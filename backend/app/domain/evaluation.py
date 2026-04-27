from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, model_validator

from app.domain.methodology import CompetencyLevel

CompetencyId = Literal[
    "questioning",
    "need_diagnosis",
    "value_through_benefit",
    "think_it_over_objection",
    "next_step_fixation",
]

COMPETENCY_NAME_BY_ID: dict[str, str] = {
    "questioning": "Умение задавать вопросы",
    "need_diagnosis": "Диагностика потребности",
    "value_through_benefit": "Формулировка ценности через выгоду",
    "think_it_over_objection": "Работа с возражением «подумаю / не сейчас»",
    "next_step_fixation": "Фиксация следующего шага",
}


class EvaluationJsonError(ValueError):
    """Raised when the LLM returns invalid evaluation JSON."""


class EvaluationValidity(BaseModel):
    is_valid_for_scoring: bool
    manager_turn_count: int = Field(ge=0)
    min_manager_turns: int = Field(ge=1)
    short_effective_exception: bool
    limitations: list[str] = Field(default_factory=list)


class CompetencyEvaluation(BaseModel):
    id: CompetencyId
    name: str
    level: Literal["Junior", "Middle", "Senior"]
    argument: str
    evidence_quotes: list[str]
    missing_to_next_level: str
    recommendations: list[str]

    @model_validator(mode="after")
    def validate_content(self) -> "CompetencyEvaluation":
        expected_name = COMPETENCY_NAME_BY_ID[self.id]
        if self.name != expected_name:
            raise ValueError(f"Invalid competency name for '{self.id}'.")
        if not any(quote.strip() for quote in self.evidence_quotes):
            raise ValueError("Each competency must contain at least one evidence quote.")
        if not 2 <= len(self.recommendations) <= 4:
            raise ValueError("Each competency must contain 2 to 4 recommendations.")
        return self


class EvaluationResult(BaseModel):
    schema_version: str
    validity: EvaluationValidity
    overall_level: Literal["Junior", "Middle", "Senior"]
    overall_comment: str
    overall_recommendations: list[str] = Field(default_factory=list)
    competencies: list[CompetencyEvaluation]

    @model_validator(mode="after")
    def validate_competencies(self) -> "EvaluationResult":
        expected_ids = list(COMPETENCY_NAME_BY_ID.keys())
        actual_ids = [competency.id for competency in self.competencies]
        if len(self.competencies) != 5:
            raise ValueError("All five competencies are required.")
        if sorted(actual_ids) != sorted(expected_ids):
            raise ValueError("Competency set is invalid.")
        if len(set(actual_ids)) != 5:
            raise ValueError("Duplicate competencies are not allowed.")
        return self


class EvaluationTranscriptTurn(BaseModel):
    role: str
    text: str


class EvaluationAgentInput(BaseModel):
    session_completed: bool
    full_transcript: list[EvaluationTranscriptTurn]
    scenario_context: str
    competency_model_version: str
    criteria: list[str] = Field(default_factory=list)
    edge_cases: list[str] = Field(default_factory=list)
    min_manager_turns: int = Field(ge=1)

    @property
    def scoring_transcript(self) -> list[EvaluationTranscriptTurn]:
        return [
            turn
            for turn in self.full_transcript
            if turn.role.lower() in {"manager", "learner"}
        ]

    @property
    def manager_turn_count(self) -> int:
        return sum(1 for turn in self.full_transcript if turn.role.lower() in {"manager", "learner"})

    @property
    def allowed_levels(self) -> list[str]:
        return [level.value for level in CompetencyLevel]
