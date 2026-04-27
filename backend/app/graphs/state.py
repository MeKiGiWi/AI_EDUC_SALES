from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Literal
from uuid import uuid4

from pydantic import BaseModel, Field
from typing_extensions import NotRequired, TypedDict

from app.domain.evaluation import EvaluationResult
from app.domain.methodology import MethodologyBundle, ScenarioDefinition
from app.domain.reports import ReportPayload


class SimulatorGraphMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    role: Literal["system", "customer", "manager", "learner"]
    text: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SimulatorSession(BaseModel):
    id: str
    scenario_id: str
    user_id: str
    tenant_id: str
    status: Literal["active", "finished"] = "active"
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: datetime | None = None
    current_stage: str = "opening"
    min_manager_turns: int
    messages: list[SimulatorGraphMessage] = Field(default_factory=list)


class SimulatorGraphState(TypedDict, total=False):
    action: Literal["start", "send_message", "finish"]
    session_id: str
    scenario_id: str
    user_id: str
    tenant_id: str
    learner_message: str
    session: SimulatorSession
    scenario: ScenarioDefinition
    methodology: MethodologyBundle
    messages: list[SimulatorGraphMessage]
    manager_turn_count: int
    current_stage: str
    edge_case_flags: list[str]
    customer_reply: str
    evaluation_result: EvaluationResult
    report_payload: ReportPayload
    status: str
    warning_message: str
    error: str
    error_message: str
    error_node: str
    error_detail: dict[str, Any]
    evaluation_input: dict[str, Any]
    evaluation_prompt: str
    evaluation_raw_output: str
    repair_attempt_count: int
    debug_enabled: bool
    debug_steps: list[dict[str, Any]]
