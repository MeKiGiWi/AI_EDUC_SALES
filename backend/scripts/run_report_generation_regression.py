from __future__ import annotations

import argparse
import asyncio
import json
import os
import re
import sys
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal
from uuid import uuid4

import httpx
from langchain_core.messages import AIMessage, HumanMessage

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.core.settings import get_settings
from app.reports.report_v2 import adapt_legacy_evaluation_to_report_v2, build_dialogue_turns
from app.simulator.runtime import build_evaluation_agent
from app.simulator.schemas import EvaluationCompetencyRaw, EvaluationResultRaw
from app.simulator.scenario_repository import get_scenario_by_id
from scripts.report_generation_cases import ALL_REPORT_GENERATION_CASES
from scripts.report_generation_cases.models import ReportDialogueTurn, ReportGenerationCaseDefinition

DEFAULT_BASE_URL = "http://127.0.0.1:8000"
DEFAULT_OUTPUT_DIR = Path("artifacts/report-generation-regression/latest")
LEGACY_B2B_TERMS = ("КП", "смета", "простой", "выезд", "поставщик")
SCENARIO_CHOICES = ("all", "clinic-appointment", "clinic-complaint")


class RegressionError(RuntimeError):
    pass


@dataclass
class ReportCheck:
    name: str
    status: Literal["PASS", "WARN", "ERROR"]
    detail: str


@dataclass
class ScriptedTurnRecord:
    speaker: Literal["learner", "customer"]
    text: str


@dataclass
class ReportGenerationCaseResult:
    name: str
    scenario_id: str
    scenario_title: str
    expected_level: str
    evaluation_level: str | None
    report_level: str | None
    result: Literal["PASS", "WARN", "ERROR"]
    session_id: str
    report_id: str | None = None
    report_title: str | None = None
    pdf_filename: str | None = None
    customer_opening: str | None = None
    dialogue_turns: list[ScriptedTurnRecord] = field(default_factory=list)
    checks: list[ReportCheck] = field(default_factory=list)
    error_message: str | None = None
    debug: dict[str, Any] = field(default_factory=dict)


@dataclass
class ReportCardResponse:
    report_id: str
    title: str
    format: str
    report_v2: dict[str, Any] | None
    raw_json: dict[str, Any]


class ReportsApiClient:
    def __init__(self, base_url: str, timeout: float) -> None:
        self.base_url = base_url.rstrip("/")
        self._client = httpx.Client(timeout=timeout)

    def close(self) -> None:
        self._client.close()

    def create_report(
        self,
        *,
        scenario_id: str,
        scenario_title: str,
        session_id: str,
        evaluation: dict[str, Any],
        report_v2: dict[str, Any],
    ) -> ReportCardResponse:
        payload = {
            "role": "student",
            "scenario_id": scenario_id,
            "scenario_title": scenario_title,
            "source_label": "Report generation regression",
            "session_id": session_id,
            "evaluation": evaluation,
            "report_v2": report_v2,
        }
        response_json = self._post_json("/api/v1/reports", payload)
        return ReportCardResponse(
            report_id=str(response_json["id"]),
            title=str(response_json["title"]),
            format=str(response_json["format"]),
            report_v2=response_json.get("reportV2"),
            raw_json=response_json,
        )

    def _post_json(self, path: str, payload: dict[str, Any]) -> dict[str, Any]:
        url = f"{self.base_url}{path}"
        try:
            response = self._client.post(url, json=payload)
        except httpx.ConnectError as exc:
            raise RegressionError(
                "Не удалось подключиться к reports API. "
                f"Проверьте, что backend запущен и доступен по {self.base_url}."
            ) from exc
        except httpx.TimeoutException as exc:
            raise RegressionError(f"Reports API не ответил вовремя по {url}.") from exc
        except httpx.HTTPError as exc:
            raise RegressionError(f"HTTP ошибка при запросе к {url}: {exc}") from exc
        if response.is_error:
            raise RegressionError(f"Reports API вернул {response.status_code} для {url}: {_extract_error_detail(response)}")
        try:
            return response.json()
        except ValueError as exc:
            raise RegressionError(f"Reports API вернул не-JSON ответ для {url}.") from exc


def _extract_error_detail(response: httpx.Response) -> str:
    try:
        payload = response.json()
    except ValueError:
        return response.text.strip() or "empty response body"
    if isinstance(payload, dict) and payload.get("detail"):
        return str(payload["detail"])
    return str(payload)


def aggregate_check_status(checks: list[ReportCheck]) -> Literal["PASS", "WARN", "ERROR"]:
    if any(check.status == "ERROR" for check in checks):
        return "ERROR"
    if any(check.status == "WARN" for check in checks):
        return "WARN"
    return "PASS"


def markdown_escape(text: str) -> str:
    return text.replace("|", "\\|")


def format_text_block(text: str) -> str:
    value = text.strip() or "[no paired customer reply]"
    return f"```text\n{value}\n```"


def build_pdf_filename(report_title: str) -> str:
    normalized = report_title.lower()
    normalized = re.sub(r"[^a-z0-9а-яё]+", "-", normalized, flags=re.IGNORECASE)
    normalized = re.sub(r"^-+|-+$", "", normalized)
    normalized = normalized[:45]
    normalized = re.sub(r"^-+|-+$", "", normalized)
    return f"{normalized or 'report'}.pdf"


def build_case_check(
    name: str,
    ok: bool,
    *,
    detail: str,
    error_on_failure: bool = True,
    strict: bool = False,
) -> ReportCheck:
    if ok:
        return ReportCheck(name, "PASS", detail)
    if error_on_failure:
        return ReportCheck(name, "ERROR", detail)
    return ReportCheck(name, "ERROR" if strict else "WARN", detail)


def normalize_competency_name(value: str) -> str:
    return (
        value.lower()
        .replace("ё", "е")
        .replace('"', "")
        .replace("«", "")
        .replace("»", "")
        .strip()
    )


def build_default_competency(name: str) -> EvaluationCompetencyRaw:
    return EvaluationCompetencyRaw(
        name=name,
        level="Junior",
        argument="Недостаточно данных для надёжной оценки этой компетенции.",
        quote=[],
        recommendations=["Продолжить диалог и собрать больше примеров поведения по этой компетенции."],
    )


def normalize_evaluation_result(raw: EvaluationResultRaw, competency_catalog: list[str]) -> EvaluationResultRaw:
    by_name = {normalize_competency_name(item.name): item for item in raw.competencies}
    normalized_competencies: list[EvaluationCompetencyRaw] = []

    for competency_name in competency_catalog:
        item = by_name.get(normalize_competency_name(competency_name))
        if item is None:
            normalized_competencies.append(build_default_competency(competency_name))
            continue
        normalized_competencies.append(
            EvaluationCompetencyRaw(
                name=competency_name,
                level=item.level,
                argument=item.argument,
                quote=item.quote,
                recommendations=item.recommendations,
            )
        )

    overall_recommendations = raw.overall_recommendations
    if not overall_recommendations:
        unique_recommendations: list[str] = []
        for item in normalized_competencies:
            for recommendation in item.recommendations:
                if recommendation not in unique_recommendations:
                    unique_recommendations.append(recommendation)
        overall_recommendations = unique_recommendations[:3]

    return EvaluationResultRaw(
        overall_level=raw.overall_level,
        overall_comment=raw.overall_comment,
        overall_recommendations=overall_recommendations,
        competencies=normalized_competencies,
    )


def build_dialogue_text(dialogue: list[ReportDialogueTurn]) -> tuple[str, int]:
    lines: list[str] = []
    manager_replies = 0
    for turn in dialogue:
        if turn.speaker == "learner":
            manager_replies += 1
            lines.append(f"Менеджер: {turn.text.strip()}")
        else:
            lines.append(f"Клиент: {turn.text.strip()}")
    return "\n".join(lines).strip(), manager_replies


def build_langchain_messages(dialogue: list[ReportDialogueTurn]) -> list[HumanMessage | AIMessage]:
    messages: list[HumanMessage | AIMessage] = []
    for turn in dialogue:
        if turn.speaker == "learner":
            messages.append(HumanMessage(content=turn.text))
        else:
            messages.append(AIMessage(content=turn.text))
    return messages


async def evaluate_case_dialogue(case: ReportGenerationCaseDefinition) -> tuple[EvaluationResultRaw, dict[str, Any]]:
    scenario = get_scenario_by_id(case.scenario_id) or {}
    competency_catalog = [str(item) for item in scenario.get("target_competencies", [])]
    dialogue_text, manager_replies = build_dialogue_text(case.dialogue)
    evaluation_agent = build_evaluation_agent(case.scenario_id)
    raw_evaluation = await evaluation_agent.evaluate(
        dialogue=dialogue_text,
        manager_replies=manager_replies,
        min_replies=get_settings().MIN_MANAGER_TURNS,
    )
    evaluation = normalize_evaluation_result(raw_evaluation, competency_catalog)
    return evaluation, {
        "dialogue_text": dialogue_text,
        "manager_replies": manager_replies,
        "scenario_competencies": competency_catalog,
    }


def build_result_checks(
    *,
    case: ReportGenerationCaseDefinition,
    evaluation: dict[str, Any] | None,
    report_v2: dict[str, Any] | None,
    created_report: ReportCardResponse | None,
    pdf_filename: str,
    visible_turns_count: int,
    strict: bool,
) -> list[ReportCheck]:
    evaluation_payload = evaluation or {}
    report_payload = report_v2 or {}
    report_summary = report_payload.get("summary") or {}
    short_resume = report_summary.get("shortResume") or []
    competencies = report_payload.get("competencies") or []
    dialogue_analysis = report_payload.get("dialogueAnalysis") or []
    strengths = report_payload.get("strengths") or []
    development_areas = report_payload.get("developmentAreas") or []
    next_steps = report_payload.get("nextSteps") or []
    created_report_v2 = None if created_report is None else created_report.report_v2
    created_report_format = "" if created_report is None else created_report.format
    serialized_report = json.dumps(report_payload, ensure_ascii=False)
    legacy_terms = [term for term in LEGACY_B2B_TERMS if term in serialized_report]

    return [
        build_case_check("evaluation_present", bool(evaluation), detail="evaluation present"),
        build_case_check("report_v2_present", bool(report_v2), detail="report_v2 present"),
        build_case_check("report_version", report_payload.get("reportVersion") == "2.0", detail='report_v2.reportVersion == "2.0"'),
        build_case_check(
            "report_case_id",
            (report_payload.get("case") or {}).get("id") == case.scenario_id,
            detail="report_v2.case.id matches scenario_id",
        ),
        build_case_check("summary_title", bool(str(report_summary.get("title") or "").strip()), detail="report_v2.summary.title is not empty"),
        build_case_check("summary_short_resume", len(short_resume) >= 3, detail="report_v2.summary.shortResume has at least 3 lines"),
        build_case_check("competencies_present", bool(competencies), detail="report_v2.competencies present"),
        build_case_check("dialogue_analysis_present", bool(dialogue_analysis), detail="report_v2.dialogueAnalysis present"),
        build_case_check("strengths_present", bool(strengths), detail="report_v2.strengths present"),
        build_case_check("development_areas_present", bool(development_areas), detail="report_v2.developmentAreas present"),
        build_case_check("next_steps_count", len(next_steps) >= 2, detail="report_v2.nextSteps has at least 2 items"),
        build_case_check("created_report_reportV2", bool(created_report_v2), detail="created_report.reportV2 present"),
        build_case_check("created_report_format", created_report_format == "pdf", detail='created_report.format == "pdf"'),
        build_case_check("pdf_filename_suffix", pdf_filename.endswith(".pdf"), detail="pdf filename ends with .pdf"),
        build_case_check(
            "evaluation_level_matches",
            str(evaluation_payload.get("overall_level") or "") == case.expected_level,
            detail=f"evaluation.overall_level matches expected {case.expected_level}",
            error_on_failure=False,
            strict=strict,
        ),
        build_case_check(
            "report_level_matches",
            str(report_summary.get("overallLevel") or "") == case.expected_level,
            detail=f"report_v2.summary.overallLevel matches expected {case.expected_level}",
            error_on_failure=False,
            strict=strict,
        ),
        build_case_check(
            "dialogue_analysis_turns",
            len(dialogue_analysis) >= visible_turns_count,
            detail=f"dialogueAnalysis covers visible dialogue turns ({len(dialogue_analysis)}/{visible_turns_count})",
            error_on_failure=False,
            strict=strict,
        ),
        build_case_check(
            "legacy_b2b_terms",
            not legacy_terms,
            detail="legacy B2B terms absent" if not legacy_terms else f"legacy terms found: {', '.join(legacy_terms)}",
            error_on_failure=False,
            strict=strict,
        ),
    ]


def run_case(
    client: ReportsApiClient,
    *,
    case: ReportGenerationCaseDefinition,
    strict: bool,
) -> ReportGenerationCaseResult:
    session_id = f"report-regression-{case.scenario_id}-{case.expected_level.lower()}-{uuid4().hex[:8]}"
    customer_opening = case.dialogue[0].text if case.dialogue and case.dialogue[0].speaker == "customer" else None
    dialogue_turns = [ScriptedTurnRecord(speaker=turn.speaker, text=turn.text) for turn in case.dialogue[1:]]
    created_at = datetime.now(timezone.utc)
    debug_payload: dict[str, Any] = {
        "case_name": case.name,
        "scenario_id": case.scenario_id,
        "scenario_title": case.scenario_title,
        "expected_level": case.expected_level,
        "scripted_dialogue": [asdict(turn) for turn in case.dialogue],
    }

    try:
        evaluation_model, evaluation_debug = asyncio.run(evaluate_case_dialogue(case))
        langchain_messages = build_langchain_messages(case.dialogue)
        report_model = adapt_legacy_evaluation_to_report_v2(
            evaluation=evaluation_model,
            dialogue_turns=build_dialogue_turns(langchain_messages),
            scenario_id=case.scenario_id,
            scenario_title=case.scenario_title,
            created_at=created_at,
        )
        evaluation_payload = evaluation_model.model_dump(mode="json")
        report_payload = report_model.model_dump(mode="json")
        created_report = client.create_report(
            scenario_id=case.scenario_id,
            scenario_title=case.scenario_title,
            session_id=session_id,
            evaluation=evaluation_payload,
            report_v2=report_payload,
        )
        pdf_filename = build_pdf_filename(created_report.title)
        checks = build_result_checks(
            case=case,
            evaluation=evaluation_payload,
            report_v2=report_payload,
            created_report=created_report,
            pdf_filename=pdf_filename,
            visible_turns_count=len(case.dialogue),
            strict=strict,
        )
        return ReportGenerationCaseResult(
            name=case.name,
            scenario_id=case.scenario_id,
            scenario_title=case.scenario_title,
            expected_level=case.expected_level,
            evaluation_level=str(evaluation_model.overall_level.value),
            report_level=str(report_model.summary.overallLevel.value),
            result=aggregate_check_status(checks),
            session_id=session_id,
            report_id=created_report.report_id,
            report_title=created_report.title,
            pdf_filename=pdf_filename,
            customer_opening=customer_opening,
            dialogue_turns=dialogue_turns,
            checks=checks,
            debug={
                **debug_payload,
                "evaluation_debug": evaluation_debug,
                "evaluation_payload": evaluation_payload,
                "report_v2_payload": report_payload,
                "report_create_response": created_report.raw_json,
                "pdf_filename": pdf_filename,
            },
        )
    except Exception as exc:  # noqa: BLE001
        checks = build_result_checks(
            case=case,
            evaluation=None,
            report_v2=None,
            created_report=None,
            pdf_filename=build_pdf_filename(""),
            visible_turns_count=len(case.dialogue),
            strict=strict,
        )
        return ReportGenerationCaseResult(
            name=case.name,
            scenario_id=case.scenario_id,
            scenario_title=case.scenario_title,
            expected_level=case.expected_level,
            evaluation_level=None,
            report_level=None,
            result=aggregate_check_status(checks),
            session_id=session_id,
            customer_opening=customer_opening,
            dialogue_turns=dialogue_turns,
            checks=checks,
            error_message=str(exc),
            debug=debug_payload,
        )


def select_cases(*, scenario: str, case_name: str | None) -> list[ReportGenerationCaseDefinition]:
    cases = ALL_REPORT_GENERATION_CASES
    if scenario != "all":
        cases = [case for case in cases if case.scenario_id == scenario]
    if case_name is not None:
        cases = [case for case in cases if case.name == case_name]
    return cases


def run_cases(
    client: ReportsApiClient,
    *,
    scenario: str,
    case_name: str | None,
    strict: bool,
) -> list[ReportGenerationCaseResult]:
    selected_cases = select_cases(scenario=scenario, case_name=case_name)
    if not selected_cases:
        raise RegressionError(f"Не найдено report generation cases для selector '{case_name or scenario}'.")
    return [run_case(client, case=case, strict=strict) for case in selected_cases]


def format_check_summary(checks: list[ReportCheck]) -> str:
    status = aggregate_check_status(checks)
    if status == "PASS":
        return "PASS"
    first_problem = next((check for check in checks if check.status in {"WARN", "ERROR"}), None)
    if first_problem is None:
        return status
    return f"{first_problem.status} — {first_problem.detail}"


def scenario_report_filename(scenario_id: str) -> str:
    safe = re.sub(r"[^a-zA-Z0-9._-]+", "-", scenario_id).strip("-")
    return f"{safe or 'scenario'}.md"


def order_case_results(results: list[ReportGenerationCaseResult]) -> list[ReportGenerationCaseResult]:
    level_order = {"Junior": 1, "Middle": 2, "Senior": 3}
    return sorted(results, key=lambda item: (level_order.get(item.expected_level, 99), item.name))


def format_scenario_report(scenario_id: str, results: list[ReportGenerationCaseResult]) -> str:
    ordered_results = order_case_results(results)
    lines = [
        f"# {scenario_id}",
        "",
        "## Сводка",
        "",
        "| Case | Expected level | Evaluation level | Report level | Result | PDF |",
        "|---|---|---|---|---|---|",
    ]
    for result in ordered_results:
        lines.append(
            f"| {markdown_escape(result.name)} | {result.expected_level} | {result.evaluation_level or '—'} | {result.report_level or '—'} | {result.result} | `{result.pdf_filename or '—'}` |"
        )

    for result in ordered_results:
        report_v2_payload = (result.debug.get("report_v2_payload") or {}) if result.debug else {}
        lines.extend(
            [
                "",
                "---",
                "",
                f"## Диалог {result.expected_level} — {result.name}",
                "",
                f"**PDF-файл отчёта:** `{result.pdf_filename or '—'}`",
                "",
                f"**Report ID:** `{result.report_id or '—'}`",
                f"**Report title:** `{result.report_title or '—'}`",
                f"**Session ID:** `{result.session_id}`",
                "",
                "### Стартовое сообщение API",
                "",
                format_text_block(result.customer_opening or ""),
            ]
        )
        learner_turn_index = 0
        buffered_customer_reply: str | None = None
        for turn in result.dialogue_turns:
            if turn.speaker == "customer":
                buffered_customer_reply = turn.text
                continue
            learner_turn_index += 1
            lines.extend(
                [
                    "",
                    f"### Ход {learner_turn_index:02d}",
                    "",
                    "**Сообщение пользователя**",
                    "",
                    format_text_block(turn.text),
                    "",
                    "**Ответ клиента / LLM**",
                    "",
                    format_text_block(buffered_customer_reply or "[formatter artifact: no paired customer reply]"),
                ]
            )
            buffered_customer_reply = None
        lines.extend(
            [
                "",
                "### Итог генерации отчёта",
                "",
                f"* Evaluation level: `{result.evaluation_level or '—'}`",
                f"* Report V2 level: `{result.report_level or '—'}`",
                f"* Competencies: `{len(report_v2_payload.get('competencies') or [])}`",
                f"* Dialogue analysis turns: `{len(report_v2_payload.get('dialogueAnalysis') or [])}`",
                f"* Checks: `{format_check_summary(result.checks)}`",
            ]
        )
        report_create_response = result.debug.get("report_create_response") or {}
        preview_sections = report_create_response.get("previewSections") or []
        summary = report_v2_payload.get("summary") or {}
        competencies = report_v2_payload.get("competencies") or []
        strengths = report_v2_payload.get("strengths") or []
        development_areas = report_v2_payload.get("developmentAreas") or []
        next_steps = report_v2_payload.get("nextSteps") or []
        dialogue_analysis = report_v2_payload.get("dialogueAnalysis") or []

        lines.extend(
            [
                "",
                "### Карточка отчёта",
                "",
                f"* Status: `{report_create_response.get('status', '—')}`",
                f"* Format: `{report_create_response.get('format', '—')}`",
                f"* Owner: `{report_create_response.get('ownerLabel', '—')}`",
                f"* Source label: `{report_create_response.get('sourceLabel', '—')}`",
                f"* Created at: `{report_create_response.get('createdAt', '—')}`",
                f"* Updated at: `{report_create_response.get('updatedAt', '—')}`",
                "",
                "### Summary",
                "",
                f"**Title:** {summary.get('title', '—')}",
                "",
                f"**Headline:** {summary.get('headline', '—')}",
                "",
                f"**Overall score:** `{summary.get('overallScore', '—')}`",
                "",
                "**Short resume**",
                "",
            ]
        )
        for item in summary.get("shortResume") or []:
            lines.append(f"* {item}")

        lines.extend(["", "### Competencies", ""])
        for competency in competencies:
            evidence = competency.get("evidence") or []
            lines.append(
                f"* {competency.get('title', '—')} — уровень `{competency.get('level', '—')}`, score `{competency.get('score', '—')}`: {competency.get('comment', '—')}"
            )
            for quote in evidence[:3]:
                lines.append(
                    f"  quote: {quote.get('speaker', '—')} #{quote.get('turnIndex', '—')} — {quote.get('quote', '—')}"
                )

        lines.extend(["", "### Strengths", ""])
        for strength in strengths:
            lines.append(f"* {strength.get('title', '—')}: {strength.get('comment', '—')}")
            for evidence_line in strength.get("evidence") or []:
                lines.append(f"  evidence: {evidence_line}")

        lines.extend(["", "### Development Areas", ""])
        for area in development_areas:
            lines.append(f"* {area.get('title', '—')}: {area.get('comment', '—')}")
            for action in area.get("actions") or []:
                lines.append(f"  action: {action}")

        lines.extend(["", "### Next Steps", ""])
        for step in next_steps:
            lines.append(f"* {step}")

        lines.extend(["", "### Dialogue Analysis", ""])
        for item in dialogue_analysis:
            analysis = item.get("analysis") or {}
            lines.append(
                f"* Turn {item.get('turnIndex', '—')} — {item.get('speakerLabel', '—')} [{analysis.get('status', '—')}]: {analysis.get('comment', '—')}"
            )
            if item.get("text"):
                lines.append(f"  text: {item.get('text')}")
            if analysis.get("recommendation"):
                lines.append(f"  recommendation: {analysis.get('recommendation')}")
            competency_ids = analysis.get("competencyIds") or []
            if competency_ids:
                lines.append(f"  competencies: {', '.join(str(value) for value in competency_ids)}")

        if preview_sections:
            lines.extend(["", "### Preview Sections", ""])
            for section in preview_sections:
                lines.append(f"* {section.get('title', '—')}")
                for section_line in section.get("lines") or []:
                    lines.append(f"  {section_line}")
    report = "\n".join(lines).strip() + "\n"
    if re.search(r"(?m)^\d+\. ", report):
        raise AssertionError("Scenario markdown contains ordered-list prefix.")
    return report


def format_index(base_url: str, strict: bool, results: list[ReportGenerationCaseResult]) -> str:
    lines = [
        "# Report Generation Regression Index",
        "",
        f"Generated at: {datetime.now(timezone.utc).isoformat()}",
        f"Base URL: {base_url}",
        f"Strict mode: {str(strict).lower()}",
        "",
        "## Summary",
        "",
        "| Scenario | PASS | WARN | ERROR | Report |",
        "|---|---:|---:|---:|---|",
    ]
    for scenario_id in sorted({result.scenario_id for result in results}):
        scenario_results = [result for result in results if result.scenario_id == scenario_id]
        lines.append(
            f"| {markdown_escape(scenario_id)} | {sum(1 for item in scenario_results if item.result == 'PASS')} | {sum(1 for item in scenario_results if item.result == 'WARN')} | {sum(1 for item in scenario_results if item.result == 'ERROR')} | [{scenario_report_filename(scenario_id)}]({scenario_report_filename(scenario_id)}) |"
        )
    return "\n".join(lines).strip() + "\n"


def build_debug_payload(results: list[ReportGenerationCaseResult]) -> dict[str, Any]:
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "results": [asdict(result) for result in results],
    }


def write_reports(*, base_url: str, strict: bool, output_dir: Path, results: list[ReportGenerationCaseResult]) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    scenario_ids = sorted({result.scenario_id for result in results})
    for scenario_id in scenario_ids:
        scenario_results = [result for result in results if result.scenario_id == scenario_id]
        (output_dir / scenario_report_filename(scenario_id)).write_text(
            format_scenario_report(scenario_id, scenario_results),
            encoding="utf-8",
        )
    (output_dir / "index.md").write_text(format_index(base_url, strict, results), encoding="utf-8")
    (output_dir / "debug.json").write_text(
        json.dumps(build_debug_payload(results), ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return output_dir / "index.md"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run live report generation regression on scripted clinic dialogues.")
    parser.add_argument("--base-url", default=os.getenv("SIMULATOR_API_URL") or DEFAULT_BASE_URL)
    parser.add_argument("--output-dir", default=str(DEFAULT_OUTPUT_DIR))
    parser.add_argument("--timeout", type=float, default=120)
    parser.add_argument("--strict", action="store_true")
    parser.add_argument("--case", default=None)
    parser.add_argument("--scenario", choices=SCENARIO_CHOICES, default="all")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    client = ReportsApiClient(args.base_url, args.timeout)
    try:
        results = run_cases(client, scenario=args.scenario, case_name=args.case, strict=args.strict)
        report_path = write_reports(
            base_url=args.base_url,
            strict=args.strict,
            output_dir=Path(args.output_dir),
            results=results,
        )
    except RegressionError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2
    finally:
        client.close()

    overall = aggregate_check_status([ReportCheck(result.name, result.result, "") for result in results])
    print(f"{overall}: wrote report generation regression artifacts to {report_path}")
    return 1 if overall == "ERROR" else 0


if __name__ == "__main__":
    raise SystemExit(main())
