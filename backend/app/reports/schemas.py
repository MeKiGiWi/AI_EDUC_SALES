from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field

from app.reports.schemas_v2 import SalesDialogueReportV2
from app.simulator.schemas import EvaluationResultRaw


class WorkspaceRole(str, Enum):
    STUDENT = "student"
    MANAGER = "manager"
    HR = "hr"
    ADMIN = "admin"


class ExportFormat(str, Enum):
    PDF = "pdf"
    XLSX = "xlsx"
    CSV = "csv"


class ReportType(str, Enum):
    STUDENT_PROGRESS = "student_progress"
    TEAM_PERFORMANCE = "team_performance"
    LEARNING_ADOPTION = "learning_adoption"
    COMPETENCY_DYNAMICS = "competency_dynamics"


class ReportStatus(str, Enum):
    DRAFT = "draft"
    GENERATING = "generating"
    READY = "ready"
    ERROR = "error"


class ReportPreviewSectionDto(BaseModel):
    id: str
    title: str
    lines: list[str]


class ReportCardDto(BaseModel):
    id: str
    title: str
    role: WorkspaceRole
    reportType: ReportType
    scenarioId: str | None = None
    scenarioTitle: str
    status: ReportStatus
    summary: str
    format: ExportFormat
    createdAt: str
    updatedAt: str
    ownerLabel: str
    sourceLabel: str | None = None
    sessionId: str | None = None
    availableFormats: list[ExportFormat]
    previewSections: list[ReportPreviewSectionDto]
    reportV2: SalesDialogueReportV2 | None = None


class ReportListResponseDto(BaseModel):
    items: list[ReportCardDto]


class ReportCreateDto(BaseModel):
    role: WorkspaceRole
    scenario_id: str | None = Field(default=None, max_length=200)
    scenario_title: str = Field(min_length=1, max_length=300)
    source_label: str | None = Field(default=None, max_length=120)
    evaluation: EvaluationResultRaw
    session_id: str | None = Field(default=None, max_length=200)
    report_v2: SalesDialogueReportV2 | None = None
