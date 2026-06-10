from __future__ import annotations

from datetime import datetime

from app.reports.entities import ReportRecord
from app.reports.report_v2 import adapt_legacy_evaluation_to_report_v2
from app.reports.schemas import (
    ExportFormat,
    ReportCardDto,
    ReportCreateDto,
    ReportPreviewSectionDto,
    ReportStatus,
    ReportType,
    WorkspaceRole,
)
from app.reports.schemas_v2 import SalesDialogueReportV2
from app.simulator.schemas import CompetencyLevel, EvaluationResultRaw

ROLE_OWNER_LABELS: dict[WorkspaceRole, str] = {
    WorkspaceRole.STUDENT: "Ученик",
    WorkspaceRole.MANAGER: "Руководитель",
    WorkspaceRole.HR: "HR / L&D",
    WorkspaceRole.ADMIN: "Администратор",
}

COMPETENCY_LEVEL_RANK: dict[CompetencyLevel, int] = {
    CompetencyLevel.JUNIOR: 1,
    CompetencyLevel.MIDDLE: 2,
    CompetencyLevel.SENIOR: 3,
}


def build_display_name(scenario_title: str, created_at: datetime) -> str:
    local_date = created_at.astimezone()
    return f"{scenario_title} {local_date:%d.%m}"


def format_report_timestamp(value: datetime) -> str:
    local_date = value.astimezone()
    return local_date.strftime("%d.%m %H:%M")


def build_competency_lines(evaluation: EvaluationResultRaw) -> list[str]:
    return [f"{competency.name}: {competency.level.value} — {competency.argument}" for competency in evaluation.competencies]


def build_recommendation_lines(evaluation: EvaluationResultRaw) -> list[str]:
    if evaluation.overall_recommendations:
        return evaluation.overall_recommendations

    lines: list[str] = []
    for competency in evaluation.competencies:
        for recommendation in competency.recommendations:
            lines.append(f"{competency.name}: {recommendation}")
    return lines[:4]


def build_quote_lines(evaluation: EvaluationResultRaw) -> list[str]:
    quotes: list[str] = []
    for competency in evaluation.competencies:
        quotes.extend(competency.quote)
    return [f"«{quote}»" for quote in quotes[:4]]


def sort_competencies_by_level(evaluation: EvaluationResultRaw, order: str) -> list:
    items = list(evaluation.competencies)
    items.sort(
        key=lambda item: COMPETENCY_LEVEL_RANK[item.level],
        reverse=order == "desc",
    )
    return items


def build_strength_lines(evaluation: EvaluationResultRaw) -> list[str]:
    strongest = sort_competencies_by_level(evaluation, "desc")[:2]
    return [f"{competency.name}: {competency.argument}" for competency in strongest]


def build_development_lines(evaluation: EvaluationResultRaw) -> list[str]:
    weakest = sort_competencies_by_level(evaluation, "asc")[:2]
    lines: list[str] = []
    for competency in weakest:
        next_step = competency.recommendations[0] if competency.recommendations else None
        lines.append(
            f"{competency.name}: {next_step if next_step else competency.argument}"
        )
    return lines


def build_preview_sections(evaluation: EvaluationResultRaw, scenario_title: str, report_id: str) -> list[ReportPreviewSectionDto]:
    recommendation_lines = build_recommendation_lines(evaluation)
    quote_lines = build_quote_lines(evaluation)

    sections = [
        ReportPreviewSectionDto(
            id=f"{report_id}-resume",
            title="Краткое резюме",
            lines=[
                f"Кейс: {scenario_title}",
                f"Общий уровень: {evaluation.overall_level.value}",
                evaluation.overall_comment,
            ],
        ),
        ReportPreviewSectionDto(
            id=f"{report_id}-competencies",
            title="Компетенции",
            lines=build_competency_lines(evaluation),
        ),
        ReportPreviewSectionDto(
            id=f"{report_id}-strengths",
            title="Сильные стороны",
            lines=build_strength_lines(evaluation),
        ),
        ReportPreviewSectionDto(
            id=f"{report_id}-development",
            title="Зоны роста",
            lines=build_development_lines(evaluation),
        ),
    ]

    if recommendation_lines:
        sections.append(
            ReportPreviewSectionDto(
                id=f"{report_id}-recommendations",
                title="Рекомендации",
                lines=recommendation_lines,
            )
        )

    if quote_lines:
        sections.append(
            ReportPreviewSectionDto(
                id=f"{report_id}-quotes",
                title="Цитаты из диалога",
                lines=quote_lines,
            )
        )

    return sections


def create_report_record(payload: ReportCreateDto, report_id: str, created_at: datetime) -> ReportRecord:
    title = build_display_name(payload.scenario_title, created_at)
    preview_sections = build_preview_sections(payload.evaluation, payload.scenario_title, report_id)
    report_v2 = payload.report_v2 or adapt_legacy_evaluation_to_report_v2(
        evaluation=payload.evaluation,
        dialogue_turns=[],
        scenario_id=payload.scenario_id or report_id,
        scenario_title=payload.scenario_title,
        created_at=created_at,
    )
    return ReportRecord(
        id=report_id,
        role=payload.role.value,
        title=title,
        scenario_id=payload.scenario_id,
        scenario_title=payload.scenario_title,
        status=ReportStatus.READY.value,
        report_type=ReportType.STUDENT_PROGRESS.value,
        summary=payload.evaluation.overall_comment,
        default_format=ExportFormat.PDF.value,
        owner_label=ROLE_OWNER_LABELS[payload.role],
        source_label=payload.source_label,
        available_formats=[ExportFormat.PDF.value, ExportFormat.CSV.value],
        preview_sections=[section.model_dump() for section in preview_sections],
        evaluation_payload=payload.evaluation.model_dump(mode="json"),
        report_v2_payload=report_v2.model_dump(mode="json"),
        session_id=payload.session_id,
        created_at=created_at,
        updated_at=created_at,
    )


def to_report_card(record: ReportRecord) -> ReportCardDto:
    preview_sections = [ReportPreviewSectionDto(**item) for item in record.preview_sections]
    report_v2 = None
    if record.report_v2_payload:
        report_v2 = SalesDialogueReportV2.model_validate(record.report_v2_payload)
    return ReportCardDto(
        id=record.id,
        title=record.title,
        role=WorkspaceRole(record.role),
        reportType=ReportType(record.report_type),
        scenarioId=record.scenario_id,
        scenarioTitle=record.scenario_title,
        status=ReportStatus(record.status or ReportStatus.READY.value),
        summary=record.summary,
        format=ExportFormat(record.default_format),
        createdAt=format_report_timestamp(record.created_at),
        updatedAt=format_report_timestamp(record.updated_at),
        ownerLabel=record.owner_label,
        sourceLabel=record.source_label,
        sessionId=record.session_id,
        availableFormats=[ExportFormat(value) for value in record.available_formats],
        previewSections=preview_sections,
        reportV2=report_v2,
    )
