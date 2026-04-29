from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

from app.settings import get_settings
from app.models import (
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
from app.runtime import SESSION_STORE, build_graph
from app.scenario_repository import get_scenario_by_id, list_scenarios

router = APIRouter(prefix="/api/v1/simulator", tags=["simulator"])


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

    graph = build_graph(get_settings())
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

    graph = build_graph(get_settings())
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

    graph = build_graph(get_settings())
    initial_state = {"action": "close_session", "session_id": session_id}
    result = await graph.ainvoke(initial_state)
    return SessionFinishResponseDto(
        session_id=session_id,
        status=SessionStatus(result["status"]),
    )
