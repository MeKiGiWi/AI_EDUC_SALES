from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from enum import Enum
from typing import TYPE_CHECKING, Literal
from uuid import uuid4

from langchain_core.messages import BaseMessage
from pydantic import AliasChoices, BaseModel, ConfigDict, Field, field_validator, model_validator
from typing_extensions import TypedDict

from app.reports.schemas_v2 import SalesDialogueReportV2
from app.simulator.llm_guard import is_empty_llm_text, normalize_llm_text

if TYPE_CHECKING:
    from app.simulator.agents import BuyerAgent, RudeClassifierAgent, TopicClassifierAgent
    from app.simulator.store import InMemorySessionStore


class ChatSession(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    id: str
    scenario_id: str
    status: Literal["active", "finished"] = "active"
    messages: list[BaseMessage] = Field(default_factory=list)
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: datetime | None = None
    offtopic_messages_count: int = 0
    opening_message_override: str | None = None


class GraphState(TypedDict, total=False):
    action: Literal["open_session", "reply_to_sales", "close_session"]
    scenario_id: str
    session_id: str
    sales_message: str
    session: ChatSession
    messages: list[BaseMessage]
    status: Literal["active", "finished"]
    dialog_route: Literal[
        "stop_after_rudeness",
        "continue_with_customer_reply",
        "continue_after_offtopic_warning",
        "stop_after_offtopic_limit",
    ]
    confidence: float
    topic_confidence: float
    customer_message: str
    role_copy_detected: bool
    role_copy_similarity: float
    copied_customer_message: str
    moderation_label: str
    moderation_severity: str
    terminate_session: bool
    moderation_reason: str
    opening_message_override: str


@dataclass
class GraphDependencies:
    session_store: InMemorySessionStore
    rude_classifier: RudeClassifierAgent
    topic_classifier: TopicClassifierAgent
    buyer_agent: BuyerAgent


class ScenarioStatus(str, Enum):
    READY = "ready"


class MessageRole(str, Enum):
    LEARNER = "learner"
    CUSTOMER = "customer"


class SessionStatus(str, Enum):
    ACTIVE = "active"
    FINISHED = "finished"


class CompetencyLevel(str, Enum):
    JUNIOR = "Junior"
    MIDDLE = "Middle"
    SENIOR = "Senior"


class ScenarioSummaryDto(BaseModel):
    id: str
    title: str
    description: str = ""
    openingMessage: str
    status: ScenarioStatus
    segment: str = "B2C"
    duration: str = ""
    level: str = ""
    targetCompetencies: list[str] = Field(default_factory=list)
    introLines: list[str] = Field(default_factory=list)


class ScenarioListResponseDto(BaseModel):
    items: list[ScenarioSummaryDto]


class SessionCreateDto(BaseModel):
    scenario_id: str
    difficulty: str | None = None
    opening_message_override: str | None = Field(default=None, max_length=4000)


class SessionMessageCreateDto(BaseModel):
    text: str = Field(min_length=1, max_length=4000)


class SessionMessageDto(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    role: MessageRole
    text: str = Field(min_length=1)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    @field_validator("text")
    @classmethod
    def validate_text(cls, value: str) -> str:
        normalized = normalize_llm_text(value)
        if is_empty_llm_text(normalized):
            raise ValueError("Session message text must not be empty.")
        return normalized


class SessionCreateResponseDto(BaseModel):
    session_id: str
    status: SessionStatus
    message: SessionMessageDto


class SessionMessageResponseDto(BaseModel):
    session_id: str
    status: SessionStatus
    rude: str
    moderation_label: str | None = None
    moderation_severity: str | None = None
    terminate_session: bool = False
    moderation_reason: str | None = None
    confidence: float
    messages: list[SessionMessageDto]


class EvaluationCompetencyRaw(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str
    level: CompetencyLevel
    argument: str
    quote: list[str]
    recommendations: list[str]

    @field_validator("quote", mode="before")
    @classmethod
    def normalize_quote(cls, value):
        if value is None:
            return []
        if isinstance(value, str):
            return [value]
        return value

    @field_validator("recommendations", mode="before")
    @classmethod
    def normalize_recommendations(cls, value):
        if value is None:
            return []
        if isinstance(value, str):
            return [value]
        return value

    @field_validator("quote")
    @classmethod
    def clean_quote(cls, value: list[str]) -> list[str]:
        return [item.strip() for item in value if item and item.strip()]

    @field_validator("recommendations")
    @classmethod
    def clean_recommendations(cls, value: list[str]) -> list[str]:
        return [item.strip() for item in value if item and item.strip()]


class EvaluationResultRaw(BaseModel):
    model_config = ConfigDict(extra="forbid")

    overall_level: CompetencyLevel
    overall_comment: str
    overall_recommendations: list[str] = Field(
        validation_alias=AliasChoices("overall_recommendations", "recommendations"),
        serialization_alias="overall_recommendations",
    )
    competencies: list[EvaluationCompetencyRaw]

    @field_validator("overall_recommendations", mode="before")
    @classmethod
    def normalize_overall_recommendations(cls, value):
        if value is None:
            return []
        if isinstance(value, str):
            return [value]
        return value

    @field_validator("overall_recommendations")
    @classmethod
    def clean_overall_recommendations(cls, value: list[str]) -> list[str]:
        return [item.strip() for item in value if item and item.strip()]

    @model_validator(mode="after")
    def ensure_competencies_present(self):
        if not self.competencies:
            raise ValueError("Evaluation must include competencies.")
        return self


class SessionFinishResponseDto(BaseModel):
    session_id: str
    status: SessionStatus
    evaluation: EvaluationResultRaw | None = None
    report_v2: SalesDialogueReportV2 | None = None
