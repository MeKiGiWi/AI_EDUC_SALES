from datetime import datetime, timezone
from enum import Enum
from typing import Any, Literal
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


class ScenarioCustomerDto(BaseModel):
    name: str
    roleTitle: str
    company: str | None = None
    mood: str | None = None


class ScenarioSummaryDto(BaseModel):
    id: str
    title: str
    goal: str
    difficulty: str
    channel: str
    status: ScenarioStatus
    customer: ScenarioCustomerDto


class ScenarioListResponseDto(BaseModel):
    items: list[ScenarioSummaryDto]


class AgentDebugStepDto(BaseModel):
    step_id: str
    ts: datetime
    node: str
    agent: Literal["system", "buyer_agent", "evaluation_agent", "report_builder", "json_repair"]
    status: Literal["started", "completed", "error", "skipped"]
    input_summary: dict[str, Any] | str | None = None
    prompt: str | None = None
    system_prompt: str | None = None
    raw_output: str | None = None
    parsed_output: dict[str, Any] | None = None
    error: dict[str, Any] | str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


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
    debug_steps: list[AgentDebugStepDto] | None = None


class SessionMessageResponseDto(BaseModel):
    session_id: str
    status: str
    messages: list[SessionMessageDto]
    can_finish: bool
    manager_turn_count: int
    min_manager_turns: int
    debug_steps: list[AgentDebugStepDto] | None = None


class SessionFinishNeedsMoreDialogueDto(BaseModel):
    session_id: str
    status: str
    message: str
    manager_turn_count: int
    min_manager_turns: int
    debug_steps: list[AgentDebugStepDto] | None = None


class SessionFinishEvaluatedDto(BaseModel):
    session_id: str
    status: str
    report: ReportPayload
    debug_steps: list[AgentDebugStepDto] | None = None
