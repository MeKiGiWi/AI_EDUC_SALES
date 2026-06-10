from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

from app.reports.schemas_v2 import (
    CaseInfo,
    CompetencyAssessment,
    DevelopmentArea,
    DialogueAnalysisStatus,
    DialogueSpeaker,
    DialogueTurnAnalysis,
    EvidenceQuote,
    ParticipantInfo,
    ReportLevel,
    ReportMeta,
    ReportSummary,
    SalesDialogueReportV2,
    Strength,
    TurnAnalysis,
    build_minimal_report,
)

if TYPE_CHECKING:
    from app.simulator.schemas import EvaluationResultRaw

COMPETENCY_ID_BY_TITLE: dict[str, str] = {
    "Умение задавать вопросы": "questioning",
    "Диагностика потребности": "needs_diagnostics",
    "Формулировка ценности через выгоду": "value_framing",
    "Работа с возражением «подумаю / не сейчас»": "objection_handling",
    "Фиксация следующего шага": "next_step",
}

COMPETENCY_SCORE_BY_LEVEL: dict[ReportLevel, int] = {
    ReportLevel.TRAINEE: 20,
    ReportLevel.JUNIOR: 40,
    ReportLevel.MIDDLE: 68,
    ReportLevel.SENIOR: 90,
}

COMPETENCY_KEYWORDS: dict[str, tuple[str, ...]] = {
    "questioning": ("?", "какой", "какие", "когда", "сколько", "подскажите", "уточню", "удобно"),
    "needs_diagnostics": ("критич", "важно", "простои", "срок", "ограничен", "критер", "нагрузк"),
    "value_framing": ("выгод", "риск", "стоим", "простой", "цен", "сниж", "реалистич"),
    "objection_handling": ("дороже", "дешев", "подума", "сравнен", "оптимизац", "сомнен"),
    "next_step": ("следующий шаг", "завтра", "послезавтра", "созвон", "выезд", "отправляю", "подтверж")
}

CLIENT_SIGNAL_PATTERNS: tuple[tuple[tuple[str, ...], str], ...] = (
    (("цена", "дорог", "дешев", "конкурент"), "Клиент поднимает ценовое возражение и сравнивает предложение с альтернативами."),
    (("срок", "до конца месяца", "запуск"), "Клиент уточняет сроки и проверяет реалистичность внедрения."),
    (("простой", "останов", "8 часов", "нагруз"), "Клиент обозначает операционные ограничения и допустимый уровень простоя."),
    (("бесплатно", "смет", "расчет"), "Клиент уточняет состав предложения и прозрачность коммерческих условий."),
    (("договорились", "подойдет", "жду", "согласовали"), "Клиент подтверждает следующий шаг и показывает готовность двигаться дальше."),
)

def _format_report_time(value: datetime) -> str:
    return value.astimezone().strftime("%H:%M")


def _speaker_label(speaker: DialogueSpeaker) -> str:
    return {
        DialogueSpeaker.MANAGER: "Менеджер",
        DialogueSpeaker.CLIENT: "Клиент",
        DialogueSpeaker.ASSISTANT: "Ассистент",
        DialogueSpeaker.SYSTEM: "Система",
    }[speaker]


def build_dialogue_turns(messages: list) -> list[DialogueTurnAnalysis]:
    turns: list[DialogueTurnAnalysis] = []
    for index, message in enumerate(messages, start=1):
        if isinstance(message, SystemMessage):
            continue

        if isinstance(message, HumanMessage):
            speaker = DialogueSpeaker.MANAGER
        elif isinstance(message, AIMessage):
            speaker = DialogueSpeaker.CLIENT
        else:
            speaker = DialogueSpeaker.ASSISTANT

        text = str(message.content).strip()
        turns.append(
            DialogueTurnAnalysis(
                turnIndex=len(turns) + 1,
                speaker=speaker,
                speakerLabel=_speaker_label(speaker),
                timestamp=_format_report_time(datetime.now(timezone.utc)),
                text=text,
                analysis=TurnAnalysis(
                    status=(
                        DialogueAnalysisStatus.NEEDS_IMPROVEMENT
                        if speaker == DialogueSpeaker.MANAGER
                        else DialogueAnalysisStatus.NEUTRAL
                    ),
                    comment=(
                        "Реплика менеджера сохранена для последующего анализа."
                        if speaker == DialogueSpeaker.MANAGER
                        else "Контекстная реплика клиента."
                    ),
                    competencyIds=[],
                ),
            )
        )
    return turns


def _extract_json_candidates(raw_output: str) -> list[str]:
    raw = raw_output.strip()
    candidates = [raw]

    if "```" in raw:
        fenced = re.sub(r"```(?:json|JSON)?", "", raw).replace("```", "").strip()
        if fenced:
            candidates.append(fenced)

    start = raw.find("{")
    end = raw.rfind("}")
    if start != -1 and end != -1 and end > start:
        candidates.append(raw[start : end + 1])

    return candidates


def parse_report_v2_payload(raw_output: str) -> SalesDialogueReportV2:
    last_error: Exception | None = None
    for candidate in _extract_json_candidates(raw_output):
        try:
            parsed = json.loads(candidate)
            return SalesDialogueReportV2.model_validate(parsed)
        except Exception as exc:  # noqa: BLE001
            last_error = exc
    raise ValueError(f"Could not parse report V2 JSON: {last_error}")


def validate_report_v2_content(
    report: SalesDialogueReportV2,
    *,
    expected_dialogue_turns: int | None = None,
) -> SalesDialogueReportV2:
    title = report.summary.title.strip()
    headline = report.summary.headline.strip()
    short_resume = [line.strip() for line in report.summary.shortResume if line and line.strip()]

    if not title:
        raise ValueError("Report V2 summary.title is empty.")
    if not headline:
        raise ValueError("Report V2 summary.headline is empty.")
    if len(short_resume) < 3:
        raise ValueError("Report V2 summary.shortResume must contain at least 3 lines.")
    if not report.competencies:
        raise ValueError("Report V2 competencies are empty.")
    if len(report.competencies) < 3:
        raise ValueError("Report V2 competencies must contain at least 3 items.")
    if not report.dialogueAnalysis:
        raise ValueError("Report V2 dialogueAnalysis is empty.")
    if expected_dialogue_turns is not None and len(report.dialogueAnalysis) != expected_dialogue_turns:
        raise ValueError(
            f"Report V2 dialogueAnalysis must contain exactly {expected_dialogue_turns} items."
        )
    if not report.strengths:
        raise ValueError("Report V2 strengths are empty.")
    if len(report.strengths) < 2:
        raise ValueError("Report V2 strengths must contain at least 2 items.")
    if not report.developmentAreas:
        raise ValueError("Report V2 developmentAreas are empty.")
    if len(report.developmentAreas) < 2:
        raise ValueError("Report V2 developmentAreas must contain at least 2 items.")
    next_steps = [line.strip() for line in report.nextSteps if line and line.strip()]
    if len(next_steps) < 2:
        raise ValueError("Report V2 nextSteps must contain at least 2 items.")

    for expected_index, turn in enumerate(report.dialogueAnalysis, start=1):
        if turn.turnIndex != expected_index:
            raise ValueError("Report V2 dialogueAnalysis turnIndex must be sequential.")
        if not turn.text.strip():
            raise ValueError("Report V2 dialogueAnalysis contains an empty turn text.")
        if not turn.analysis.comment.strip():
            raise ValueError("Report V2 dialogueAnalysis contains an empty analysis comment.")

    for competency in report.competencies:
        if not competency.comment.strip():
            raise ValueError("Report V2 competencies contain an empty comment.")

    for strength in report.strengths:
        if not strength.title.strip() or not strength.comment.strip():
            raise ValueError("Report V2 strengths contain an empty title or comment.")

    for area in report.developmentAreas:
        if not area.title.strip() or not area.comment.strip():
            raise ValueError("Report V2 developmentAreas contain an empty title or comment.")

    return report


def _find_evidence_turns(dialogue_turns: list[DialogueTurnAnalysis], quotes: list[str]) -> list[EvidenceQuote]:
    evidence: list[EvidenceQuote] = []
    for quote in quotes:
        normalized_quote = quote.strip()
        if not normalized_quote:
            continue
        for turn in dialogue_turns:
            if normalized_quote in turn.text:
                evidence.append(
                    EvidenceQuote(
                        quote=normalized_quote,
                        speaker=turn.speaker,
                        turnIndex=turn.turnIndex,
                    )
                )
                break
    return evidence


def _text_matches_competency(text: str, competency_id: str) -> bool:
    source = text.lower()
    return any(keyword in source for keyword in COMPETENCY_KEYWORDS.get(competency_id, ()))


def _infer_manager_turn_analysis(
    text: str,
    competency_ids: list[str],
) -> TurnAnalysis:
    normalized = text.lower()
    has_question = "?" in text
    mentions_risk = any(token in normalized for token in ("риск", "простой", "нагруз", "ограничен"))
    mentions_timing = any(token in normalized for token in ("срок", "завтра", "послезавтра", "14:30", "15:00", "до конца месяца"))
    mentions_plan = any(token in normalized for token in ("план", "этап", "смет", "график", "договор", "кп", "выезд"))
    mentions_value = any(token in normalized for token in ("дороже", "дешев", "выгод", "разниц", "стоим"))
    summarizes_client = any(token in normalized for token in ("понял", "правильно понимаю", "тогда ключевой критерий", "если суммировать", "фиксирую"))

    if mentions_value and mentions_risk and mentions_plan:
        return TurnAnalysis(
            status=DialogueAnalysisStatus.GOOD,
            comment="Менеджер не застревает в обсуждении цены, а переводит разговор к совокупной выгоде: простоям, срокам и понятному плану действий.",
            recommendation=None,
            competencyIds=competency_ids,
        )

    if has_question and mentions_risk:
        return TurnAnalysis(
            status=DialogueAnalysisStatus.GOOD,
            comment="Фраза помогает диагностировать ограничения клиента: менеджер уточняет сроки, допустимый простой или критичные условия внедрения.",
            recommendation=None,
            competencyIds=competency_ids,
        )

    if summarizes_client and mentions_plan:
        return TurnAnalysis(
            status=DialogueAnalysisStatus.GOOD,
            comment="Менеджер корректно фиксирует услышанные критерии клиента и превращает их в конкретный следующий шаг или рабочий план.",
            recommendation=None,
            competencyIds=competency_ids,
        )

    if mentions_timing and mentions_plan:
        return TurnAnalysis(
            status=DialogueAnalysisStatus.GOOD,
            comment="Фраза хорошо двигает сделку вперед: менеджер предлагает конкретный шаг, сроки и понятный формат следующего контакта.",
            recommendation="Можно усилить эффект, если коротко напомнить клиенту, какую проблему решает этот следующий шаг.",
            competencyIds=competency_ids,
        )

    if has_question:
        return TurnAnalysis(
            status=DialogueAnalysisStatus.NEUTRAL,
            comment="Менеджер удерживает инициативу через вопрос, но фразе не хватает явной привязки к ценности или бизнес-рискам клиента.",
            recommendation="Добавьте в вопрос связь с последствиями: простоями, сроками, стоимостью ошибки или критериями выбора.",
            competencyIds=competency_ids,
        )

    return TurnAnalysis(
        status=DialogueAnalysisStatus.NEEDS_IMPROVEMENT,
        comment="Фраза продолжает диалог, но звучит скорее как передача информации, чем как управляемый шаг продажи с диагностикой или усилением ценности.",
        recommendation="Сделайте реплику прикладнее: зафиксируйте критерий клиента, переведите его в выгоду или договоритесь о следующем шаге.",
        competencyIds=competency_ids,
    )


def _infer_client_turn_analysis(text: str) -> TurnAnalysis:
    normalized = text.lower()
    for tokens, comment in CLIENT_SIGNAL_PATTERNS:
        if any(token in normalized for token in tokens):
            return TurnAnalysis(
                status=DialogueAnalysisStatus.NEUTRAL,
                comment=comment,
                recommendation="В следующем ответе коротко отзеркальте сигнал клиента и уточните значимый критерий.",
                competencyIds=[],
            )

    return TurnAnalysis(
        status=DialogueAnalysisStatus.NEUTRAL,
        comment="Реплика клиента задает контекст для следующего ответа менеджера.",
        recommendation="Коротко подтвердите контекст и задайте один уточняющий вопрос по сути.",
        competencyIds=[],
    )


def adapt_legacy_evaluation_to_report_v2(
    *,
    evaluation: "EvaluationResultRaw",
    dialogue_turns: list[DialogueTurnAnalysis],
    scenario_id: str,
    scenario_title: str,
    created_at: datetime | None = None,
) -> SalesDialogueReportV2:
    created_value = created_at or datetime.now(timezone.utc)
    competencies: list[CompetencyAssessment] = []

    for item in evaluation.competencies:
        level = ReportLevel(getattr(item.level, "value", item.level))
        competencies.append(
            CompetencyAssessment(
                id=COMPETENCY_ID_BY_TITLE.get(item.name, re.sub(r"[^a-z0-9]+", "_", item.name.lower()).strip("_")),
                title=item.name,
                level=level,
                score=COMPETENCY_SCORE_BY_LEVEL[level],
                comment=item.argument,
                evidence=_find_evidence_turns(dialogue_turns, item.quote),
            )
        )

    strengths = [
        Strength(
            title=item.name,
            comment=item.argument,
            evidence=item.quote[:2],
        )
        for item in evaluation.competencies
        if getattr(item.level, "value", item.level) in {"Middle", "Senior"}
    ][:3]

    development_areas = [
        DevelopmentArea(
            title=item.name,
            comment=item.argument,
            actions=item.recommendations[:3],
        )
        for item in evaluation.competencies
        if getattr(item.level, "value", item.level) == "Junior"
    ][:3]

    if not strengths:
        strengths = [
            Strength(
                title=item.title,
                comment=item.comment,
                evidence=[evidence.quote for evidence in item.evidence[:2]],
            )
            for item in competencies
            if item.evidence
        ][:3]

    if len(strengths) < 2:
        for item in competencies:
            if any(existing.title == item.title for existing in strengths):
                continue
            strengths.append(
                Strength(
                    title=item.title,
                    comment=item.comment,
                    evidence=[evidence.quote for evidence in item.evidence[:2]],
                )
            )
            if len(strengths) >= 2:
                break

    if not development_areas:
        development_areas = [
            DevelopmentArea(
                title=item.name,
                comment=item.argument,
                actions=item.recommendations[:3]
                or ["Усильте эту зону в следующем диалоге через более точные вопросы и фиксацию критериев."],
            )
            for item in evaluation.competencies[-2:]
        ]

    if len(development_areas) < 2:
        for item in evaluation.competencies:
            if any(existing.title == item.name for existing in development_areas):
                continue
            development_areas.append(
                DevelopmentArea(
                    title=item.name,
                    comment=item.argument,
                    actions=item.recommendations[:3]
                    or ["Отработайте эту зону на следующей практике с более конкретной формулировкой ответа."],
                )
            )
            if len(development_areas) >= 2:
                break

    manager_competency_ids = [competency.id for competency in competencies]
    for turn in dialogue_turns:
        if turn.speaker == DialogueSpeaker.CLIENT:
            turn.analysis = _infer_client_turn_analysis(turn.text)
            continue
        if turn.speaker != DialogueSpeaker.MANAGER:
            continue
        matched = [item.id for item in competencies if any(ev.turnIndex == turn.turnIndex for ev in item.evidence)]
        inferred = [item.id for item in competencies if _text_matches_competency(turn.text, item.id)]
        resolved_ids = matched or inferred or manager_competency_ids[:1]
        turn.analysis = _infer_manager_turn_analysis(turn.text, resolved_ids)

    report_level = ReportLevel(getattr(evaluation.overall_level, "value", evaluation.overall_level))
    overall_score = round(
        sum(item.score for item in competencies) / len(competencies)
    ) if competencies else COMPETENCY_SCORE_BY_LEVEL[report_level]

    next_steps = evaluation.overall_recommendations[:3]
    if not next_steps:
        next_steps = [
            "Провести еще одну тренировку и проверить, как меняются вопросы и фиксация следующего шага."
        ]
    if len(next_steps) < 2:
        next_steps.append(
            "После тренировки сверить, где менеджер усилил диагностику потребности и как зафиксировал следующий шаг."
        )

    return SalesDialogueReportV2(
        case=CaseInfo(
            id=scenario_id or "baseline",
            title=scenario_title,
            scenarioTitle=scenario_title,
            createdAt=created_value.astimezone(timezone.utc).isoformat(),
        ),
        participant=ParticipantInfo(role="student", displayName="Ученик"),
        summary=ReportSummary(
            title=f"Отчет по диалогу: {scenario_title}",
            headline=evaluation.overall_comment,
            overallLevel=report_level,
            overallScore=overall_score,
            shortResume=[
                f"Кейс: {scenario_title}",
                f"Общий уровень: {report_level.value}",
                evaluation.overall_comment,
            ],
        ),
        competencies=competencies,
        dialogueAnalysis=dialogue_turns,
        strengths=strengths,
        developmentAreas=development_areas,
        nextSteps=next_steps,
        meta=ReportMeta(),
    )


def build_fallback_report_v2(
    *,
    scenario_id: str,
    scenario_title: str,
    session_id: str,
    created_at: datetime | None,
    messages: list,
) -> SalesDialogueReportV2:
    return build_minimal_report(
        scenario_id=scenario_id,
        scenario_title=scenario_title,
        session_id=session_id,
        created_at=created_at,
        turns=build_dialogue_turns(messages),
    )
