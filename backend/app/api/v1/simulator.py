from fastapi import APIRouter, Depends, HTTPException, status

from app.api.v1.schemas import (
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
from app.llm.fake_client import FakeLLMClient
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


def build_simulator_graph(settings: Settings):
    llm_client = (
        OpenRouterClient(settings)
        if settings.LLM_PROVIDER == "openrouter" and settings.LLM_API_KEY
        else FakeLLMClient()
    )
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


@router.get("/scenarios", response_model=ScenarioListResponseDto)
async def list_scenarios() -> ScenarioListResponseDto:
    return ScenarioListResponseDto(items=methodology_repo.get_public_scenarios())


@router.post(
    "/sessions",
    response_model=SessionCreateResponseDto,
    status_code=status.HTTP_201_CREATED,
)
async def create_session(
    payload: SessionCreateDto,
    settings: Settings = Depends(get_settings),
) -> SessionCreateResponseDto:
    try:
        methodology_repo.get_scenario_definition(payload.scenario_id)
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Сценарий не найден.",
        )

    graph = build_simulator_graph(settings)
    result = await graph.ainvoke(
        {
            "action": "start",
            "scenario_id": payload.scenario_id,
            "user_id": "demo-user",
            "tenant_id": "demo-tenant",
        }
    )
    return SessionCreateResponseDto(
        session_id=result["session_id"],
        status="active",
        message=map_graph_message(result["messages"][-1]),
        can_finish=False,
        manager_turn_count=result["manager_turn_count"],
        min_manager_turns=result["session"].min_manager_turns,
    )


@router.post(
    "/sessions/{session_id}/messages",
    response_model=SessionMessageResponseDto,
)
async def send_message(
    session_id: str,
    payload: SessionMessageCreateDto,
    settings: Settings = Depends(get_settings),
) -> SessionMessageResponseDto:
    session = SESSION_REPO.get(session_id)
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Сессия симулятора не найдена.",
        )
    if session.status == "finished":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Сессия уже завершена, отправка сообщений недоступна.",
        )

    graph = build_simulator_graph(settings)
    result = await graph.ainvoke(
        {
            "action": "send_message",
            "session_id": session_id,
            "learner_message": payload.text,
        }
    )
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
    )


@router.post(
    "/sessions/{session_id}/finish",
    response_model=SessionFinishNeedsMoreDialogueDto | SessionFinishEvaluatedDto,
)
async def finish_session(
    session_id: str,
    settings: Settings = Depends(get_settings),
) -> SessionFinishNeedsMoreDialogueDto | SessionFinishEvaluatedDto:
    session = SESSION_REPO.get(session_id)
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Сессия симулятора не найдена.",
        )
    if session.status == "finished":
        report = REPORT_REPO.get(session_id)
        if report is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Отчет по сессии пока недоступен.",
            )
        return SessionFinishEvaluatedDto(
            session_id=session_id,
            status="evaluated",
            report=report,
        )

    graph = build_simulator_graph(settings)
    result = await graph.ainvoke(
        {
            "action": "finish",
            "session_id": session_id,
        }
    )
    if result["status"] == "needs_more_dialogue":
        return SessionFinishNeedsMoreDialogueDto(
            session_id=session_id,
            status="needs_more_dialogue",
            message=result["warning_message"],
            manager_turn_count=result["manager_turn_count"],
            min_manager_turns=session.min_manager_turns,
        )
    return SessionFinishEvaluatedDto(
        session_id=session_id,
        status="evaluated",
        report=result["report_payload"],
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
