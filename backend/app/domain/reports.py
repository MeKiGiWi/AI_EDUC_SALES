from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, model_validator

from app.domain.evaluation import COMPETENCY_NAME_BY_ID, CompetencyEvaluation


class ReportMetadata(BaseModel):
    session_id: str
    scenario_id: str
    scenario_title: str
    manager_name: str
    prompt_version: str
    methodology_version: str
    evaluation_schema_version: str


class ReportStrength(BaseModel):
    competency_id: str
    competency_name: str
    level: Literal["Junior", "Middle", "Senior"]
    summary: str


class ReportDevelopmentZone(BaseModel):
    competency_id: str
    competency_name: str
    level: Literal["Junior", "Middle", "Senior"]
    summary: str


class ReportTranscriptQuote(BaseModel):
    competency_id: str
    quote: str


class ReportPayload(BaseModel):
    type: Literal["simulator_report"] = "simulator_report"
    schema_version: Literal["1.0"] = "1.0"
    visibility: Literal["after_session_finish_only"] = "after_session_finish_only"
    metadata: ReportMetadata
    overall_level: Literal["Junior", "Middle", "Senior"]
    overall_comment: str
    strengths: list[ReportStrength] = Field(default_factory=list)
    development_zones: list[ReportDevelopmentZone] = Field(default_factory=list)
    overall_recommendations: list[str] = Field(default_factory=list)
    competencies: list[CompetencyEvaluation]
    transcript_quotes: list[ReportTranscriptQuote] = Field(default_factory=list)

    @model_validator(mode="after")
    def validate_competencies(self) -> "ReportPayload":
        expected_ids = list(COMPETENCY_NAME_BY_ID.keys())
        actual_ids = [competency.id for competency in self.competencies]
        if len(self.competencies) != 5:
            raise ValueError("Report must keep exactly five competencies.")
        if sorted(actual_ids) != sorted(expected_ids):
            raise ValueError("Report competencies are invalid.")
        return self

