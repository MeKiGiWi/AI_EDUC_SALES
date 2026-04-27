from enum import Enum

from pydantic import BaseModel, Field, model_validator


class CompetencyLevel(str, Enum):
    JUNIOR = "Junior"
    MIDDLE = "Middle"
    SENIOR = "Senior"


class CompetencyLevelRubric(BaseModel):
    level: CompetencyLevel
    description: str
    observable_signals: list[str] = Field(default_factory=list)


class CompetencyDefinition(BaseModel):
    key: str
    title: str
    description: str
    levels: list[CompetencyLevelRubric]

    @model_validator(mode="after")
    def validate_levels(self) -> "CompetencyDefinition":
        expected_levels = {level.value for level in CompetencyLevel}
        actual_levels = {rubric.level.value for rubric in self.levels}
        if actual_levels != expected_levels:
            raise ValueError("Each competency must define Junior, Middle and Senior levels.")
        return self


class CompetencyModel(BaseModel):
    version: str
    name: str
    competencies: list[CompetencyDefinition]

    @model_validator(mode="after")
    def validate_competency_count(self) -> "CompetencyModel":
        expected_keys = {
            "questioning",
            "need_diagnosis",
            "value_through_benefit",
            "think_it_over_objection",
            "next_step_fixation",
        }
        actual_keys = {competency.key for competency in self.competencies}
        if actual_keys != expected_keys:
            raise ValueError("Competency model must contain the exact five required competencies.")
        return self


class BuyerAgentContext(BaseModel):
    persona_name: str
    company_context: str
    current_situation: str
    disclosure_sequence: list[str] = Field(default_factory=list)
    hidden_methodology_notes: list[str] = Field(default_factory=list)


class ScenarioDefinition(BaseModel):
    id: str
    title: str
    goal: str
    difficulty: str
    channel: str
    status: str
    introduction: str
    hidden_summary: str
    target_competencies: list[str]
    criteria: list[str] = Field(default_factory=list)
    suggested_actions: list[str] = Field(default_factory=list)
    quick_replies: list[str] = Field(default_factory=list)
    buyer_agent_context: BuyerAgentContext


class EdgeCaseRule(BaseModel):
    id: str
    trigger: str
    description: str
    handling_instruction: str


class ReportTemplateSection(BaseModel):
    id: str
    title: str
    description: str


class ReportTemplateDefinition(BaseModel):
    version: str
    title: str
    summary_template: str
    sections: list[ReportTemplateSection]
    recommendations_policy: list[str] = Field(default_factory=list)


class MethodologyBundle(BaseModel):
    competency_model: CompetencyModel
    scenarios: list[ScenarioDefinition]
    edge_cases: list[EdgeCaseRule]
    report_template: ReportTemplateDefinition

