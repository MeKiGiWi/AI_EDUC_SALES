from datetime import datetime, timezone
from enum import Enum
from uuid import uuid4

from pydantic import BaseModel, Field

from app.domain.reports import ReportPayload


class ScenarioStatus(str, Enum):
    READY = "ready"
    ACTIVE = "active"
    COMPLETED = "completed"


class MessageRole(str, Enum):
    MANAGER = "manager"
    LEARNER = "learner"
    CUSTOMER = "customer"
    SYSTEM = "system"


class SessionStatus(str, Enum):
    ACTIVE = "active"
    FINISHED = "finished"


class ScenarioSummaryDto(BaseModel):
    id: str
    title: str
    goal: str
    difficulty: str
    channel: str
    status: ScenarioStatus


class ScenarioListResponseDto(BaseModel):
    items: list[ScenarioSummaryDto]


class SessionMessageCreateDto(BaseModel):
    text: str = Field(min_length=1, max_length=4000)


class SessionMessageDto(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    role: MessageRole
    text: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SessionCreateDto(BaseModel):
    scenario_id: str
    difficulty: str = Field(min_length=1, max_length=32)


class SessionCreateResponseDto(BaseModel):
    session_id: str
    status: str
    message: SessionMessageDto
    can_finish: bool
    manager_turn_count: int
    min_manager_turns: int


class SessionMessageResponseDto(BaseModel):
    session_id: str
    status: str
    messages: list[SessionMessageDto]
    can_finish: bool
    manager_turn_count: int
    min_manager_turns: int


class SessionFinishNeedsMoreDialogueDto(BaseModel):
    session_id: str
    status: str
    message: str
    manager_turn_count: int
    min_manager_turns: int


class SessionFinishEvaluatedDto(BaseModel):
    session_id: str
    status: str
    report: ReportPayload
