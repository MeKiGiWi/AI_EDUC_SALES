from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ReportLevel(str, Enum):
    TRAINEE = "Trainee"
    JUNIOR = "Junior"
    MIDDLE = "Middle"
    SENIOR = "Senior"


class DialogueSpeaker(str, Enum):
    MANAGER = "manager"
    CLIENT = "client"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class DialogueAnalysisStatus(str, Enum):
    GOOD = "good"
    NEUTRAL = "neutral"
    NEEDS_IMPROVEMENT = "needs_improvement"
    CRITICAL = "critical"


class CaseInfo(BaseModel):
    id: str
    title: str
    scenarioTitle: str
    createdAt: str


class ParticipantInfo(BaseModel):
    role: str = "student"
    displayName: str = "Ученик"


class ReportSummary(BaseModel):
    title: str
    headline: str
    overallLevel: ReportLevel
    overallScore: int = Field(ge=0, le=100)
    shortResume: list[str] = Field(default_factory=list)


class EvidenceQuote(BaseModel):
    quote: str
    speaker: DialogueSpeaker
    turnIndex: int = Field(ge=1)


class CompetencyAssessment(BaseModel):
    id: str
    title: str
    level: ReportLevel
    score: int = Field(ge=0, le=100)
    comment: str
    evidence: list[EvidenceQuote] = Field(default_factory=list)


class TurnAnalysis(BaseModel):
    status: DialogueAnalysisStatus
    comment: str
    recommendation: str | None = None
    competencyIds: list[str] = Field(default_factory=list)


class DialogueTurnAnalysis(BaseModel):
    turnIndex: int = Field(ge=1)
    speaker: DialogueSpeaker
    speakerLabel: str
    timestamp: str | None = None
    text: str
    analysis: TurnAnalysis


class Strength(BaseModel):
    title: str
    comment: str
    evidence: list[str] = Field(default_factory=list)


class DevelopmentArea(BaseModel):
    title: str
    comment: str
    actions: list[str] = Field(default_factory=list)


class ReportMeta(BaseModel):
    generatedBy: str = "AI Sales Academy"
    source: str = "dialogue_simulation"
    language: str = "ru"
    fallback: bool = False


class SalesDialogueReportV2(BaseModel):
    model_config = ConfigDict(extra="forbid")

    reportVersion: str = "2.0"
    case: CaseInfo
    participant: ParticipantInfo | None = None
    summary: ReportSummary
    competencies: list[CompetencyAssessment] = Field(default_factory=list)
    dialogueAnalysis: list[DialogueTurnAnalysis] = Field(default_factory=list)
    strengths: list[Strength] = Field(default_factory=list)
    developmentAreas: list[DevelopmentArea] = Field(default_factory=list)
    nextSteps: list[str] = Field(default_factory=list)
    meta: ReportMeta = Field(default_factory=ReportMeta)

    @field_validator("reportVersion")
    @classmethod
    def validate_version(cls, value: str) -> str:
        return "2.0" if value != "2.0" else value


def build_minimal_report(
    *,
    scenario_id: str,
    scenario_title: str,
    session_id: str,
    created_at: datetime | None,
    turns: list[DialogueTurnAnalysis],
    participant_label: str = "Ученик",
) -> SalesDialogueReportV2:
    created_value = created_at or datetime.now(timezone.utc)
    return SalesDialogueReportV2(
        case=CaseInfo(
            id=scenario_id or session_id or "baseline",
            title=scenario_title,
            scenarioTitle=scenario_title,
            createdAt=created_value.astimezone(timezone.utc).isoformat(),
        ),
        participant=ParticipantInfo(role="student", displayName=participant_label),
        summary=ReportSummary(
            title=f"Отчет по диалогу: {scenario_title}",
            headline="Отчет сформирован в ограниченном режиме на основе доступного диалога.",
            overallLevel=ReportLevel.JUNIOR,
            overallScore=35,
            shortResume=[
                f"Кейс: {scenario_title}",
                "Общий уровень: Junior",
                "Отчет сформирован в ограниченном режиме. Рекомендуется повторить анализ после следующей тренировки.",
            ],
        ),
        competencies=[],
        dialogueAnalysis=turns,
        strengths=[],
        developmentAreas=[
            DevelopmentArea(
                title="Требуется повторный анализ",
                comment="Не удалось получить полный структурированный разбор, поэтому рекомендации носят общий характер.",
                actions=[
                    "Повторите тренировку и сформируйте отчет еще раз.",
                    "Соберите больше реплик менеджера для более точной оценки.",
                ],
            )
        ],
        nextSteps=["Провести еще один тренировочный диалог и повторно сформировать отчет."],
        meta=ReportMeta(fallback=True),
    )
