from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from enum import Enum
from typing import TYPE_CHECKING, Literal
from uuid import uuid4

from langchain_core.messages import BaseMessage
from pydantic import BaseModel, ConfigDict, Field
from typing_extensions import TypedDict

if TYPE_CHECKING:
    from app.agents import BuyerAgent, RudeClassifierAgent
    from app.store import InMemorySessionStore


class ChatSession(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    id: str
    scenario_id: str
    status: Literal["active", "finished"] = "active"
    messages: list[BaseMessage] = Field(default_factory=list)
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: datetime | None = None


class GraphState(TypedDict, total=False):
    action: Literal["open_session", "reply_to_sales", "close_session"]
    scenario_id: str
    session_id: str
    sales_message: str
    session: ChatSession
    messages: list[BaseMessage]
    status: Literal["active", "finished"]
    dialog_route: Literal["stop_after_rudeness", "continue_with_customer_reply"]
    confidence: float
    customer_message: str


@dataclass
class GraphDependencies:
    session_store: InMemorySessionStore
    rude_classifier: RudeClassifierAgent
    buyer_agent: BuyerAgent


class ScenarioStatus(str, Enum):
    READY = "ready"


class MessageRole(str, Enum):
    LEARNER = "learner"
    CUSTOMER = "customer"


class SessionStatus(str, Enum):
    ACTIVE = "active"
    FINISHED = "finished"


class ScenarioSummaryDto(BaseModel):
    id: str
    title: str
    openingMessage: str
    status: ScenarioStatus


class ScenarioListResponseDto(BaseModel):
    items: list[ScenarioSummaryDto]


class SessionCreateDto(BaseModel):
    scenario_id: str


class SessionMessageCreateDto(BaseModel):
    text: str = Field(min_length=1, max_length=4000)


class SessionMessageDto(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    role: MessageRole
    text: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SessionCreateResponseDto(BaseModel):
    session_id: str
    status: SessionStatus
    message: SessionMessageDto


class SessionMessageResponseDto(BaseModel):
    session_id: str
    status: SessionStatus
    rude: str
    confidence: float
    messages: list[SessionMessageDto]


class SessionFinishResponseDto(BaseModel):
    session_id: str
    status: SessionStatus
