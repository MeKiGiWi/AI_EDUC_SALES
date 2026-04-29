from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI

from app.simulator_agents import BuyerAgent, RudeClassifierAgent
from app.simulator_graph import InMemorySessionStore, SimulatorGraphDependencies, create_simulator_graph
from app.simulator_models import (
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
from app.simulator_prompts import BASELINE_OPENING_MESSAGE, BASELINE_SCENARIO_ID, BASELINE_SCENARIO_TITLE
from app.settings import Settings, get_settings

router = APIRouter(prefix="/api/v1/simulator", tags=["simulator"])
SESSION_STORE = InMemorySessionStore()


def build_chat_model(settings: Settings) -> ChatOpenAI:
    if not settings.LLM_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="LLM API key is not configured.",
        )
    return ChatOpenAI(
        model=settings.LLM_MODEL,
        api_key=settings.LLM_API_KEY,
        base_url=settings.OPENROUTER_BASE_URL,
        temperature=settings.LLM_TEMPERATURE,
        default_headers={
            "HTTP-Referer": settings.OPENROUTER_SITE_URL,
            "X-Title": settings.OPENROUTER_APP_NAME,
        },
    )


def build_simulator_graph(settings: Settings):
    model = build_chat_model(settings)
    return create_simulator_graph(
        SimulatorGraphDependencies(
            session_store=SESSION_STORE,
            rude_classifier=RudeClassifierAgent(model),
            buyer_agent=BuyerAgent(model),
        )
    )


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


def visible_messages(messages: list) -> list:
    return [message for message in messages if not isinstance(message, SystemMessage)]


@router.get("/scenarios", response_model=ScenarioListResponseDto)
async def get_scenarios() -> ScenarioListResponseDto:
    return ScenarioListResponseDto(
        items=[
            ScenarioSummaryDto(
                id=BASELINE_SCENARIO_ID,
                title=BASELINE_SCENARIO_TITLE,
                openingMessage=BASELINE_OPENING_MESSAGE,
                status=ScenarioStatus.READY,
            )
        ]
    )


@router.post("/sessions", response_model=SessionCreateResponseDto, status_code=status.HTTP_201_CREATED)
async def open_session(payload: SessionCreateDto) -> SessionCreateResponseDto:
    settings = get_settings()
    graph = build_simulator_graph(settings)
    result = await graph.ainvoke({"action": "open_session", "scenario_id": payload.scenario_id})
    return SessionCreateResponseDto(
        session_id=result["session_id"],
        status=SessionStatus(result["status"]),
        message=map_message(visible_messages(result["messages"])[-1]),
    )


@router.post("/sessions/{session_id}/messages", response_model=SessionMessageResponseDto)
async def reply_to_sales(session_id: str, payload: SessionMessageCreateDto) -> SessionMessageResponseDto:
    settings = get_settings()
    session = SESSION_STORE.get(session_id)
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Сессия не найдена.")
    if session.status == "finished":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Сессия уже завершена.")

    graph = build_simulator_graph(settings)
    result = await graph.ainvoke(
        {
            "action": "reply_to_sales",
            "session_id": session_id,
            "sales_message": payload.text,
        }
    )

    return SessionMessageResponseDto(
        session_id=session_id,
        status=SessionStatus(result["status"]),
        rude="yes" if result["dialog_route"] == "stop_after_rudeness" else "no",
        confidence=result["confidence"],
        messages=[map_message(item) for item in visible_messages(result["messages"])[-2:]],
    )


@router.post("/sessions/{session_id}/finish", response_model=SessionFinishResponseDto)
async def close_session(session_id: str) -> SessionFinishResponseDto:
    session = SESSION_STORE.get(session_id)
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Сессия не найдена.")

    settings = get_settings()
    graph = build_simulator_graph(settings)
    result = await graph.ainvoke({"action": "close_session", "session_id": session_id})
    return SessionFinishResponseDto(
        session_id=session_id,
        status=SessionStatus(result["status"]),
    )
