from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

from app.core.settings import get_agents_config, get_settings
from app.reports.report_v2 import adapt_legacy_evaluation_to_report_v2, build_dialogue_turns
from app.simulator.dialog_logger import append_dialog_log
from app.simulator.runtime import SESSION_STORE, build_evaluation_agent, build_graph
from app.simulator.scenario_repository import get_scenario_by_id, list_scenarios
from app.simulator.schemas import (
    CompetencyLevel,
    EvaluationCompetencyRaw,
    EvaluationResultRaw,
    MessageRole,
    ScenarioListResponseDto,
    ScenarioStatus,
    ScenarioSummaryDto,
    SessionCreateDto,
    SessionCreateResponseDto,
    SessionFinishResponseDto,
    SessionMessageCreateDto,
    SessionMessageDto,
    SessionMessageResponseDto,
    SessionStatus,
)

router = APIRouter(prefix="/api/v1/simulator", tags=["simulator"])

COMPETENCY_CATALOG = [
    "Умение задавать вопросы",
    "Диагностика потребности",
    "Формулировка ценности через выгоду",
    "Работа с возражением «подумаю / не сейчас»",
    "Фиксация следующего шага",
]


def map_message(message) -> SessionMessageDto:
    if isinstance(message, HumanMessage):
        role = MessageRole.LEARNER
    elif isinstance(message, AIMessage):
        role = MessageRole.CUSTOMER
    else:
        raise ValueError("Unsupported message type for API response.")

    return SessionMessageDto(
        role=role,
        text=str(message.content),
        created_at=datetime.now(timezone.utc),
    )


def filter_visible_messages(messages: list) -> list:
    return [message for message in messages if not isinstance(message, SystemMessage)]


def normalize_competency_name(value: str) -> str:
    return (
        value.lower()
        .replace("ё", "е")
        .replace('"', "")
        .replace("«", "")
        .replace("»", "")
        .strip()
    )


def extract_dialogue_for_evaluation(messages: list) -> tuple[str, int]:
    lines: list[str] = []
    manager_replies = 0

    for message in messages:
        if isinstance(message, HumanMessage):
            manager_replies += 1
            lines.append(f"Менеджер: {str(message.content).strip()}")
        elif isinstance(message, AIMessage):
            lines.append(f"Клиент: {str(message.content).strip()}")

    return "\n".join(lines).strip(), manager_replies


def build_default_competency(name: str) -> EvaluationCompetencyRaw:
    return EvaluationCompetencyRaw(
        name=name,
        level=CompetencyLevel.JUNIOR,
        argument="Недостаточно данных для надёжной оценки этой компетенции.",
        quote=[],
        recommendations=["Продолжить диалог и собрать больше примеров поведения по этой компетенции."],
    )


def normalize_evaluation_result(raw: EvaluationResultRaw) -> EvaluationResultRaw:
    by_name = {normalize_competency_name(item.name): item for item in raw.competencies}
    normalized_competencies: list[EvaluationCompetencyRaw] = []

    for competency_name in COMPETENCY_CATALOG:
        item = by_name.get(normalize_competency_name(competency_name))
        if item is None:
            normalized_competencies.append(build_default_competency(competency_name))
            continue

        normalized_competencies.append(
            EvaluationCompetencyRaw(
                name=competency_name,
                level=item.level,
                argument=item.argument,
                quote=item.quote,
                recommendations=item.recommendations,
            )
        )

    overall_recommendations = raw.overall_recommendations
    if not overall_recommendations:
        unique_recommendations: list[str] = []
        for item in normalized_competencies:
            for recommendation in item.recommendations:
                if recommendation not in unique_recommendations:
                    unique_recommendations.append(recommendation)
        overall_recommendations = unique_recommendations[:3]

    return EvaluationResultRaw(
        overall_level=raw.overall_level,
        overall_comment=raw.overall_comment,
        overall_recommendations=overall_recommendations,
        competencies=normalized_competencies,
    )


@router.get("/scenarios", response_model=ScenarioListResponseDto)
async def get_scenarios() -> ScenarioListResponseDto:
    return ScenarioListResponseDto(
        items=[
            ScenarioSummaryDto(
                id=str(scenario["id"]),
                title=str(scenario["title"]),
                openingMessage=str(scenario["opening_message"]),
                status=ScenarioStatus.READY,
            )
            for scenario in list_scenarios()
        ]
    )


@router.post("/sessions", response_model=SessionCreateResponseDto, status_code=201)
async def open_session(payload: SessionCreateDto) -> SessionCreateResponseDto:
    if get_scenario_by_id(payload.scenario_id) is None:
        raise HTTPException(status_code=404, detail="Сценарий не найден.")

    graph = build_graph()
    initial_state = {"action": "open_session", "scenario_id": payload.scenario_id}
    result = await graph.ainvoke(initial_state)
    return SessionCreateResponseDto(
        session_id=result["session_id"],
        status=SessionStatus(result["status"]),
        message=map_message(filter_visible_messages(result["messages"])[-1]),
    )


@router.post("/sessions/{session_id}/messages", response_model=SessionMessageResponseDto)
async def reply_to_sales(session_id: str, payload: SessionMessageCreateDto) -> SessionMessageResponseDto:
    session = SESSION_STORE.get(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Сессия не найдена.")
    if session.status == "finished":
        raise HTTPException(status_code=409, detail="Сессия уже завершена.")

    graph = build_graph()
    initial_state = {
        "action": "reply_to_sales",
        "session_id": session_id,
        "sales_message": payload.text,
    }
    result = await graph.ainvoke(initial_state)

    return SessionMessageResponseDto(
        session_id=session_id,
        status=SessionStatus(result["status"]),
        rude="yes" if result["dialog_route"] == "stop_after_rudeness" else "no",
        confidence=result["confidence"],
        messages=[map_message(item) for item in filter_visible_messages(result["messages"])[-2:]],
    )


@router.post("/sessions/{session_id}/finish", response_model=SessionFinishResponseDto)
async def close_session(session_id: str) -> SessionFinishResponseDto:
    session = SESSION_STORE.get(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Сессия не найдена.")

    agents_config = get_agents_config()
    graph = build_graph()
    initial_state = {"action": "close_session", "session_id": session_id}
    result = await graph.ainvoke(initial_state)
    visible_messages = filter_visible_messages(result["messages"])
    dialogue_text, manager_replies = extract_dialogue_for_evaluation(visible_messages)
    if not dialogue_text:
        return SessionFinishResponseDto(
            session_id=session_id,
            status=SessionStatus(result["status"]),
            evaluation=None,
        )

    append_dialog_log(
        model_name=agents_config.buyer_agent_llm_settings.LLM_MODEL,
        scenario_name=session.scenario_id,
        dialogue=dialogue_text,
    )

    try:
        evaluation_agent = build_evaluation_agent()
        raw_evaluation = await evaluation_agent.evaluate(
            dialogue=dialogue_text,
            manager_replies=manager_replies,
            min_replies=get_settings().MIN_MANAGER_TURNS,
        )
        evaluation = normalize_evaluation_result(raw_evaluation)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Не удалось получить оценку от модели. {exc}",
        ) from exc

    created_at = session.completed_at or datetime.now(timezone.utc)
    report_v2 = adapt_legacy_evaluation_to_report_v2(
        evaluation=evaluation,
        dialogue_turns=build_dialogue_turns(visible_messages),
        scenario_id=session.scenario_id,
        scenario_title=get_scenario_by_id(session.scenario_id)["title"] if get_scenario_by_id(session.scenario_id) else session.scenario_id,
        created_at=created_at,
    )

    return SessionFinishResponseDto(
        session_id=session_id,
        status=SessionStatus(result["status"]),
        evaluation=evaluation,
        report_v2=report_v2,
    )
