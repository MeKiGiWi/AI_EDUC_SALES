from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.v1.schemas import (
    AgentDebugStepDto,
    ScenarioListResponseDto,
    SessionCreateDto,
    SessionCreateResponseDto,
    SessionFinishEvaluatedDto,
    SessionFinishNeedsMoreDialogueDto,
    SessionMessageCreateDto,
    SessionMessageDto,
    SessionMessageResponseDto,
)
from app.agents.buyer_agent import BuyerAgent
from app.agents.evaluation_agent import EvaluationAgent
from app.domain.reports import ReportPayload
from app.graphs.simulator_graph import SimulatorGraphDependencies, create_simulator_graph
from app.graphs.state import SimulatorGraphMessage, SimulatorSession
from app.llm.base import LLMClient
from app.llm.openrouter_client import OpenRouterClient
from app.repositories import methodology_repo
from app.settings import Settings, get_settings

router = APIRouter()


class InMemoryMethodologyRepository:
    def load_active_methodology(self):
        return methodology_repo.load_active_methodology()

    def get_scenario_definition(self, scenario_id: str):
        return methodology_repo.get_scenario_definition(scenario_id)


class InMemorySessionRepository:
    def __init__(self) -> None:
        self.store: dict[str, SimulatorSession] = {}

    def create(self, session: SimulatorSession) -> SimulatorSession:
        self.store[session.id] = session
        return session

    def get(self, session_id: str) -> SimulatorSession | None:
        return self.store.get(session_id)

    def save(self, session: SimulatorSession) -> SimulatorSession:
        self.store[session.id] = session
        return session


class InMemoryReportRepository:
    def __init__(self) -> None:
        self.store: dict[str, ReportPayload] = {}

    def save(self, session_id: str, report_payload: ReportPayload) -> ReportPayload:
        self.store[session_id] = report_payload
        return report_payload

    def get(self, session_id: str) -> ReportPayload | None:
        return self.store.get(session_id)


METHODOLOGY_REPO = InMemoryMethodologyRepository()
SESSION_REPO = InMemorySessionRepository()
REPORT_REPO = InMemoryReportRepository()


def is_debug_enabled(*, debug: bool, settings: Settings) -> bool:
    return debug and settings.SIMULATOR_DEBUG_TRACE and settings.APP_ENV != "production"


def build_llm_client(settings: Settings) -> LLMClient:
    if settings.LLM_PROVIDER != "openrouter" or not settings.LLM_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="LLM provider is not configured. Set LLM_PROVIDER=openrouter and LLM_API_KEY.",
        )
    return OpenRouterClient(settings)


def build_simulator_graph(settings: Settings):
    llm_client = build_llm_client(settings)
    deps = SimulatorGraphDependencies(
        settings=settings,
        methodology_repo=METHODOLOGY_REPO,
        session_repo=SESSION_REPO,
        report_repo=REPORT_REPO,
        buyer_agent=BuyerAgent(llm_client),
        evaluation_agent=EvaluationAgent(llm_client),
    )
    return create_simulator_graph(deps)


def map_graph_message(message: SimulatorGraphMessage) -> SessionMessageDto:
    return SessionMessageDto(
        id=message.id,
        role=message.role,
        text=message.text,
        created_at=message.created_at,
    )


def map_debug_steps(result: dict) -> list[AgentDebugStepDto] | None:
    raw_steps = result.get("debug_steps")
    if not raw_steps:
        return None
    return [AgentDebugStepDto.model_validate(step) for step in raw_steps]


def build_error_detail(
    *,
    result: dict,
    debug_enabled: bool,
) -> dict:
    detail = {
        "code": result.get("error", "graph_error"),
        "message": result.get("error_message", "Simulator graph failed."),
        "node": result.get("error_node"),
        "raw_output": (result.get("error_detail") or {}).get("raw_output"),
    }
    if debug_enabled:
        detail["debug_steps"] = [
            step.model_dump(mode="json")
            for step in (map_debug_steps(result) or [])
        ]
    return detail


def with_exception_debug(detail, *, debug_enabled: bool, debug_steps: list[AgentDebugStepDto] | None = None):
    if not debug_enabled:
        return detail

    serialized_steps = [
        step.model_dump(mode="json") for step in (debug_steps or [])
    ]
    if isinstance(detail, dict):
        return {**detail, "debug_steps": serialized_steps}
    return {"message": detail, "debug_steps": serialized_steps}


def raise_for_graph_error(result: dict, *, http_status: int, debug_enabled: bool) -> None:
    if result.get("status") != "error":
        return

    raise HTTPException(
        status_code=http_status,
        detail=build_error_detail(result=result, debug_enabled=debug_enabled),
    )


@router.get("/scenarios", response_model=ScenarioListResponseDto)
async def list_scenarios() -> ScenarioListResponseDto:
    return ScenarioListResponseDto(items=methodology_repo.get_public_scenarios())


@router.post(
    "/sessions",
    response_model=SessionCreateResponseDto,
    status_code=status.HTTP_201_CREATED,
    response_model_exclude_none=True,
)
async def create_session(
    payload: SessionCreateDto,
    debug: bool = Query(default=False),
    settings: Settings = Depends(get_settings),
) -> SessionCreateResponseDto:
    debug_enabled = is_debug_enabled(debug=debug, settings=settings)
    try:
        methodology_repo.get_scenario_definition(payload.scenario_id)
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=with_exception_debug("Сценарий не найден.", debug_enabled=debug_enabled),
        )

    try:
        graph = build_simulator_graph(settings)
    except HTTPException as exc:
        exc.detail = with_exception_debug(exc.detail, debug_enabled=debug_enabled)
        raise
    result = await graph.ainvoke(
        {
            "action": "start",
            "scenario_id": payload.scenario_id,
            "user_id": "demo-user",
            "tenant_id": "demo-tenant",
            "debug_enabled": debug_enabled,
            "debug_steps": [],
        }
    )
    raise_for_graph_error(result, http_status=status.HTTP_502_BAD_GATEWAY, debug_enabled=debug_enabled)
    return SessionCreateResponseDto(
        session_id=result["session_id"],
        status="active",
        message=map_graph_message(result["messages"][-1]),
        can_finish=False,
        manager_turn_count=result["manager_turn_count"],
        min_manager_turns=result["session"].min_manager_turns,
        debug_steps=map_debug_steps(result) if debug_enabled else None,
    )


@router.post(
    "/sessions/{session_id}/messages",
    response_model=SessionMessageResponseDto,
    response_model_exclude_none=True,
)
async def send_message(
    session_id: str,
    payload: SessionMessageCreateDto,
    debug: bool = Query(default=False),
    settings: Settings = Depends(get_settings),
) -> SessionMessageResponseDto:
    debug_enabled = is_debug_enabled(debug=debug, settings=settings)
    session = SESSION_REPO.get(session_id)
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=with_exception_debug("Сессия симулятора не найдена.", debug_enabled=debug_enabled),
        )
    if session.status == "finished":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=with_exception_debug(
                "Сессия уже завершена, отправка сообщений недоступна.",
                debug_enabled=debug_enabled,
            ),
        )

    try:
        graph = build_simulator_graph(settings)
    except HTTPException as exc:
        exc.detail = with_exception_debug(exc.detail, debug_enabled=debug_enabled)
        raise
    result = await graph.ainvoke(
        {
            "action": "send_message",
            "session_id": session_id,
            "learner_message": payload.text,
            "debug_enabled": debug_enabled,
            "debug_steps": [],
        }
    )
    raise_for_graph_error(result, http_status=status.HTTP_502_BAD_GATEWAY, debug_enabled=debug_enabled)
    return SessionMessageResponseDto(
        session_id=session_id,
        status="active",
        messages=[
            map_graph_message(result["messages"][-2]),
            map_graph_message(result["messages"][-1]),
        ],
        can_finish=result["manager_turn_count"] >= result["session"].min_manager_turns,
        manager_turn_count=result["manager_turn_count"],
        min_manager_turns=result["session"].min_manager_turns,
        debug_steps=map_debug_steps(result) if debug_enabled else None,
    )


@router.post(
    "/sessions/{session_id}/finish",
    response_model=SessionFinishNeedsMoreDialogueDto | SessionFinishEvaluatedDto,
    response_model_exclude_none=True,
)
async def finish_session(
    session_id: str,
    debug: bool = Query(default=False),
    settings: Settings = Depends(get_settings),
) -> SessionFinishNeedsMoreDialogueDto | SessionFinishEvaluatedDto:
    debug_enabled = is_debug_enabled(debug=debug, settings=settings)
    session = SESSION_REPO.get(session_id)
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=with_exception_debug("Сессия симулятора не найдена.", debug_enabled=debug_enabled),
        )
    if session.status == "finished":
        report = REPORT_REPO.get(session_id)
        if report is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=with_exception_debug("Отчет по сессии пока недоступен.", debug_enabled=debug_enabled),
            )
        return SessionFinishEvaluatedDto(
            session_id=session_id,
            status="evaluated",
            report=report,
        )

    try:
        graph = build_simulator_graph(settings)
    except HTTPException as exc:
        exc.detail = with_exception_debug(exc.detail, debug_enabled=debug_enabled)
        raise
    result = await graph.ainvoke(
        {
            "action": "finish",
            "session_id": session_id,
            "debug_enabled": debug_enabled,
            "debug_steps": [],
        }
    )
    raise_for_graph_error(result, http_status=status.HTTP_502_BAD_GATEWAY, debug_enabled=debug_enabled)
    if result["status"] == "needs_more_dialogue":
        return SessionFinishNeedsMoreDialogueDto(
            session_id=session_id,
            status="needs_more_dialogue",
            message=result["warning_message"],
            manager_turn_count=result["manager_turn_count"],
            min_manager_turns=session.min_manager_turns,
            debug_steps=map_debug_steps(result) if debug_enabled else None,
        )
    return SessionFinishEvaluatedDto(
        session_id=session_id,
        status="evaluated",
        report=result["report_payload"],
        debug_steps=map_debug_steps(result) if debug_enabled else None,
    )


@router.get(
    "/sessions/{session_id}/report",
    response_model=ReportPayload,
)
async def get_session_report(session_id: str) -> ReportPayload:
    report = REPORT_REPO.get(session_id)
    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Отчет по сессии пока недоступен.",
        )
    return report
