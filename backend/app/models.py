from dataclasses import dataclass
from datetime import datetime, timezone
from enum import Enum
from typing import Literal, Protocol
from uuid import uuid4

from langchain_core.messages import BaseMessage
from pydantic import BaseModel, ConfigDict, Field
from typing_extensions import TypedDict


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


class SessionStore(Protocol):
    def create(self, session: ChatSession) -> ChatSession: ...
    def get(self, session_id: str) -> ChatSession | None: ...
    def save(self, session: ChatSession) -> ChatSession: ...


class RudeClassifier(Protocol):
    async def check(self, message: str): ...


class BuyerResponder(Protocol):
    async def reply(self, messages: list[BaseMessage]) -> str: ...


@dataclass
class GraphDependencies:
    session_store: SessionStore
    rude_classifier: RudeClassifier
    buyer_agent: BuyerResponder


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
