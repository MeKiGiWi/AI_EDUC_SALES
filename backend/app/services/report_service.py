from __future__ import annotations

from pydantic import BaseModel

from app.domain.evaluation import COMPETENCY_NAME_BY_ID, CompetencyEvaluation, EvaluationResult
from app.domain.reports import (
    ReportDevelopmentZone,
    ReportMetadata,
    ReportPayload,
    ReportStrength,
    ReportTranscriptQuote,
)

_LEVEL_ORDER: dict[str, int] = {"Junior": 1, "Middle": 2, "Senior": 3}


class SessionReportMetadataInput(BaseModel):
    session_id: str
    manager_name: str


class ScenarioReportMetadataInput(BaseModel):
    scenario_id: str
    scenario_title: str


class VersionMetadataInput(BaseModel):
    prompt_version: str
    methodology_version: str


def build_report_payload(
    evaluation_result: EvaluationResult,
    session_metadata: SessionReportMetadataInput,
    scenario_metadata: ScenarioReportMetadataInput,
    versions: VersionMetadataInput,
) -> ReportPayload:
    strengths = _build_strengths(evaluation_result)
    development_zones = _build_development_zones(evaluation_result)
    transcript_quotes = _flatten_transcript_quotes(evaluation_result.competencies)

    return ReportPayload(
        metadata=ReportMetadata(
            session_id=session_metadata.session_id,
            scenario_id=scenario_metadata.scenario_id,
            scenario_title=scenario_metadata.scenario_title,
            manager_name=session_metadata.manager_name,
            prompt_version=versions.prompt_version,
            methodology_version=versions.methodology_version,
            evaluation_schema_version=evaluation_result.schema_version,
        ),
        overall_level=evaluation_result.overall_level,
        overall_comment=evaluation_result.overall_comment,
        strengths=strengths,
        development_zones=development_zones,
        overall_recommendations=evaluation_result.overall_recommendations,
        competencies=evaluation_result.competencies,
        transcript_quotes=transcript_quotes,
    )


def _build_strengths(evaluation_result: EvaluationResult) -> list[ReportStrength]:
    strengths = [
        ReportStrength(
            competency_id=competency.id,
            competency_name=competency.name,
            level=competency.level,
            summary=competency.argument,
        )
        for competency in evaluation_result.competencies
        if competency.level in {"Middle", "Senior"} and _has_positive_argument(competency.argument)
    ]
    if strengths:
        return strengths

    fallback_competency = max(
        evaluation_result.competencies,
        key=lambda competency: (_LEVEL_ORDER[competency.level], competency.id),
    )
    return [
        ReportStrength(
            competency_id=fallback_competency.id,
            competency_name=fallback_competency.name,
            level=fallback_competency.level,
            summary="Это наиболее устойчивый навык в текущем диалоге, его стоит сохранить как опору.",
        )
    ]


def _build_development_zones(evaluation_result: EvaluationResult) -> list[ReportDevelopmentZone]:
    overall_rank = _LEVEL_ORDER[evaluation_result.overall_level]
    zones = [
        ReportDevelopmentZone(
            competency_id=competency.id,
            competency_name=competency.name,
            level=competency.level,
            summary=competency.missing_to_next_level,
        )
        for competency in evaluation_result.competencies
        if competency.level == "Junior" or _LEVEL_ORDER[competency.level] < overall_rank
    ]
    if zones:
        return zones
    return [
        ReportDevelopmentZone(
            competency_id="stability",
            competency_name="Поддержание уровня",
            level=evaluation_result.overall_level,
            summary="Поддерживать стабильность уровня и усложнять кейсы",
        )
    ]


def _flatten_transcript_quotes(
    competencies: list[CompetencyEvaluation],
) -> list[ReportTranscriptQuote]:
    quotes: list[ReportTranscriptQuote] = []
    for competency in competencies:
        for quote in competency.evidence_quotes:
            if quote.strip():
                quotes.append(
                    ReportTranscriptQuote(
                        competency_id=competency.id,
                        quote=quote,
                    )
                )
    return quotes


def _has_positive_argument(argument: str) -> bool:
    positive_markers = (
        "использует",
        "умеет",
        "связывает",
        "предложил",
        "обозначил",
        "раскрывает",
        "фиксирует",
        "подтверждает",
    )
    lowered = argument.casefold()
    return any(marker in lowered for marker in positive_markers)
