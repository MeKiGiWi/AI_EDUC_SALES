from __future__ import annotations

import argparse
import json
import os
import re
import sys
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal

import httpx

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from scripts.smoke_cases.clinic_appointment import CLINIC_APPOINTMENT_SMOKE
from scripts.smoke_cases.clinic_appointment_followup import CLINIC_APPOINTMENT_ALT_SMOKE
from scripts.smoke_cases.clinic_appointment_role_copy_guard import CLINIC_APPOINTMENT_ROLE_COPY_GUARD_SMOKE
from scripts.smoke_cases.clinic_complaint import CLINIC_COMPLAINT_SMOKE
from scripts.smoke_cases.clinic_complaint_followup import CLINIC_COMPLAINT_ALT_SMOKE
from scripts.smoke_cases.clinic_complaint_role_copy_guard import CLINIC_COMPLAINT_ROLE_COPY_GUARD_SMOKE
from scripts.smoke_cases.models import SmokeCaseDefinition
from scripts.smoke_cases.opening_variants import OPENING_VARIANT_SMOKE_CASES

DEFAULT_BASE_URL = "http://127.0.0.1:8000"
DEFAULT_OUTPUT_DIR = Path("artifacts/simulator-regression/latest")
DEFAULT_OUTPUT = DEFAULT_OUTPUT_DIR.with_suffix(".md")
DEFAULT_SCRIPTED_RUNS = 1
DEFAULT_ROLE_COPY_RUNS = 3
DEFAULT_OPENING_RUNS = 1

ROLE_DRIFT_PHRASES = [
    "мы можем предложить",
    "наш продукт",
    "наше оборудование",
    "мы подберём",
    "я подготовлю для вас коммерческое предложение",
    "отправлю вам кп",
    "как менеджер",
    "как продавец",
    "как поставщик",
    "давайте я задам",
    "давайте я уточню",
    "я задам несколько уточняющих вопросов",
    "я уточню детали",
]
REFUSAL_OR_STOP_PHRASES = [
    "не получится продолжать разговор",
    "сохраним уважительный формат",
    "вернусь к диалогу",
    "диалог ушёл от темы",
    "не готов продолжать",
    "завершу эту сессию",
    "в рамках рабочего разговора",
]


class RegressionError(RuntimeError):
    pass


@dataclass
class StartedSession:
    session_id: str
    status: str
    opening_text: str
    raw_json: dict[str, Any]


@dataclass
class MessageResponse:
    session_id: str
    status: str
    rude: str
    confidence: float | None
    moderation_reason: str | None
    messages: list[dict[str, Any]]
    raw_json: dict[str, Any]


@dataclass
class HeuristicCheck:
    name: str
    status: Literal["PASS", "WARN", "ERROR"]
    detail: str


@dataclass
class TurnRecord:
    learner_text: str
    learner_source: str
    customer_text: str
    rude: str
    moderation_reason: str | None
    status: str
    confidence: float | None
    checks: list[HeuristicCheck] = field(default_factory=list)
    debug: dict[str, Any] = field(default_factory=dict)


@dataclass
class CaseResult:
    name: str
    scenario_id: str
    case_kind: str
    run_index: int
    result: Literal["PASS", "WARN", "ERROR"]
    transcript: list[TurnRecord]
    customer_opening: str | None = None
    session_id: str | None = None
    error_message: str | None = None
    debug: dict[str, Any] = field(default_factory=dict)


class SimulatorClient:
    def __init__(self, base_url: str, timeout: float) -> None:
        self.base_url = base_url.rstrip("/")
        self._client = httpx.Client(timeout=timeout)

    def close(self) -> None:
        self._client.close()

    def start_session(self, scenario_id: str, *, opening_message_override: str | None = None) -> StartedSession:
        payload: dict[str, Any] = {"scenario_id": scenario_id}
        if opening_message_override is not None:
            payload["opening_message_override"] = opening_message_override
        response_json = self._post_json("/api/v1/simulator/sessions", payload)
        return StartedSession(
            session_id=str(response_json["session_id"]),
            status=str(response_json["status"]),
            opening_text=str(response_json["message"]["text"]),
            raw_json=response_json,
        )

    def send_message(self, session_id: str, text: str) -> MessageResponse:
        response_json = self._post_json(f"/api/v1/simulator/sessions/{session_id}/messages", {"text": text})
        return MessageResponse(
            session_id=str(response_json["session_id"]),
            status=str(response_json["status"]),
            rude=str(response_json.get("rude", "")),
            confidence=_coerce_float(response_json.get("confidence")),
            moderation_reason=_coerce_optional_str(response_json.get("moderation_reason")),
            messages=list(response_json.get("messages", [])),
            raw_json=response_json,
        )

    def _post_json(self, path: str, payload: dict[str, Any]) -> dict[str, Any]:
        url = f"{self.base_url}{path}"
        try:
            response = self._client.post(url, json=payload)
        except httpx.ConnectError as exc:
            raise RegressionError(
                "Не удалось подключиться к simulator API. "
                f"Проверьте, что backend запущен и доступен по {self.base_url}."
            ) from exc
        except httpx.TimeoutException as exc:
            raise RegressionError(f"Simulator API не ответил вовремя по {url}.") from exc
        except httpx.HTTPError as exc:
            raise RegressionError(f"HTTP ошибка при запросе к {url}: {exc}") from exc
        if response.is_error:
            raise RegressionError(f"Simulator API вернул {response.status_code} для {url}: {_extract_error_detail(response)}")
        try:
            return response.json()
        except ValueError as exc:
            raise RegressionError(f"Simulator API вернул не-JSON ответ для {url}.") from exc


def _coerce_float(value: Any) -> float | None:
    try:
        return None if value is None else float(value)
    except (TypeError, ValueError):
        return None


def _coerce_optional_str(value: Any) -> str | None:
    text = str(value).strip() if value is not None else ""
    return text or None


def _extract_error_detail(response: httpx.Response) -> str:
    try:
        payload = response.json()
    except ValueError:
        return response.text.strip() or "empty response body"
    if isinstance(payload, dict) and payload.get("detail"):
        return str(payload["detail"])
    return str(payload)


def extract_latest_customer_text(response_json: dict[str, Any]) -> str:
    for message in reversed(response_json.get("messages", [])):
        if str(message.get("role", "")).lower() == "customer":
            return str(message.get("text", ""))
    return ""


def classify_customer_reply_state(response_json: dict[str, Any]) -> Literal["present", "empty_live_llm_response", "missing_customer_message"]:
    has_customer_message = False
    for message in reversed(response_json.get("messages", [])):
        if str(message.get("role", "")).lower() != "customer":
            continue
        has_customer_message = True
        return "present" if str(message.get("text", "")).strip() else "empty_live_llm_response"
    return "missing_customer_message" if not has_customer_message else "empty_live_llm_response"


def build_turn_checks(response: MessageResponse, *, strict: bool, case_kind: str) -> list[HeuristicCheck]:
    latest_customer_text = extract_latest_customer_text(response.raw_json)
    reply_state = classify_customer_reply_state(response.raw_json)
    normalized = latest_customer_text.casefold()
    checks: list[HeuristicCheck] = []
    checks.append(
        HeuristicCheck("customer_reply_role", "PASS" if reply_state == "present" else "ERROR", "customer reply captured")
    )
    checks.append(
        HeuristicCheck(
            "empty_customer_reply",
            "ERROR" if reply_state != "present" else "PASS",
            "empty live reply" if reply_state == "empty_live_llm_response" else "missing customer message in API payload",
        )
    )
    checks.append(
        HeuristicCheck(
            "role_drift_seller_language",
            "WARN" if any(phrase in normalized for phrase in ROLE_DRIFT_PHRASES) else "PASS",
            "possible seller/admin language drift",
        )
    )
    checks.append(
        HeuristicCheck(
            "refusal_or_session_stop",
            "WARN" if response.status == "finished" or any(phrase in normalized for phrase in REFUSAL_OR_STOP_PHRASES) else "PASS",
            "possible refusal or unexpected stop",
        )
    )
    if case_kind == "one_phrase_opening":
        checks.append(
            HeuristicCheck(
                "rude_false_positive",
                ("ERROR" if strict else "WARN") if response.rude == "yes" else "PASS",
                "rude false positive",
            )
        )
        checks.append(
            HeuristicCheck(
                "unexpected_finish_after_one_phrase",
                "WARN" if response.status == "finished" else "PASS",
                "session finished after first learner message",
            )
        )
        checks.append(
            HeuristicCheck(
                "offtopic_or_rude_refusal_text",
                "WARN" if any(phrase in normalized for phrase in REFUSAL_OR_STOP_PHRASES) else "PASS",
                "possible off-topic/rude refusal",
            )
        )
    return checks


def aggregate_check_status(checks: list[HeuristicCheck]) -> Literal["PASS", "WARN", "ERROR"]:
    if any(check.status == "ERROR" for check in checks):
        return "ERROR"
    if any(check.status == "WARN" for check in checks):
        return "WARN"
    return "PASS"


def summarize_checks(checks: list[HeuristicCheck]) -> str:
    result = aggregate_check_status(checks)
    if result == "PASS":
        return "PASS"
    for check in checks:
        if check.status in {"WARN", "ERROR"}:
            detail_map = {
                "empty_customer_reply": "empty live reply",
                "rude_false_positive": "rude false positive",
                "offtopic_or_rude_refusal_text": "possible off-topic/rude refusal",
                "refusal_or_session_stop": "possible refusal or session stop",
                "role_drift_seller_language": "possible role drift",
                "unexpected_finish_after_one_phrase": "unexpected finish after one phrase",
            }
            return f"{check.status} — {detail_map.get(check.name, check.detail)}"
    return result


def record_turn(learner_text: str, learner_source: str, response: MessageResponse, *, strict: bool, case_kind: str) -> TurnRecord:
    checks = build_turn_checks(response, strict=strict, case_kind=case_kind)
    return TurnRecord(
        learner_text=learner_text,
        learner_source=learner_source,
        customer_text=extract_latest_customer_text(response.raw_json),
        rude=response.rude,
        moderation_reason=response.moderation_reason,
        status=response.status,
        confidence=response.confidence,
        checks=checks,
        debug={
            "response_payload": response.raw_json,
            "request_text": learner_text,
            "source": learner_source,
        },
    )


def run_case(client: SimulatorClient, *, case: SmokeCaseDefinition, run_index: int, strict: bool) -> CaseResult:
    started = client.start_session(case.scenario_id, opening_message_override=case.opening_override)
    transcript: list[TurnRecord] = []
    if case.kind == "role_copy_guard":
        learner_text = started.opening_text
        response: MessageResponse | None = None
        for turn_index in range(case.max_turns or 5):
            response = client.send_message(started.session_id, learner_text)
            source = "copied_from_customer_opening" if turn_index == 0 else "copied_from_last_llm_reply"
            turn = record_turn(learner_text, source, response, strict=strict, case_kind=case.kind)
            transcript.append(turn)
            if response.status == "finished":
                break
            learner_text = turn.customer_text
        if response is None:
            raise RegressionError(f"Case {case.name} did not produce any response.")
    else:
        if not case.learner_messages:
            raise RegressionError(f"Case {case.name} has no learner messages.")
        for learner_text in case.learner_messages:
            response = client.send_message(started.session_id, learner_text)
            transcript.append(record_turn(learner_text, "scripted_test_input", response, strict=strict, case_kind=case.kind))

    result = aggregate_check_status([check for turn in transcript for check in turn.checks])
    return CaseResult(
        name=case.name,
        scenario_id=case.scenario_id,
        case_kind=case.kind,
        run_index=run_index,
        result=result,
        transcript=transcript,
        customer_opening=started.opening_text,
        session_id=started.session_id,
        debug={
            "session_id": started.session_id,
            "scenario_id": case.scenario_id,
            "case_name": case.name,
            "case_kind": case.kind,
            "opening_message_override": case.opening_override,
            "session_create_response": started.raw_json,
        },
    )


ALL_CASES = [
    CLINIC_APPOINTMENT_SMOKE,
    CLINIC_APPOINTMENT_ALT_SMOKE,
    CLINIC_COMPLAINT_SMOKE,
    CLINIC_COMPLAINT_ALT_SMOKE,
    CLINIC_APPOINTMENT_ROLE_COPY_GUARD_SMOKE,
    CLINIC_COMPLAINT_ROLE_COPY_GUARD_SMOKE,
    *OPENING_VARIANT_SMOKE_CASES,
]
SUITE_TO_KINDS = {
    "all": {"scripted_reference", "role_copy_guard", "one_phrase_opening"},
    "scripted": {"scripted_reference"},
    "role-copy": {"role_copy_guard"},
    "one-phrase": {"one_phrase_opening"},
}


def select_cases(*, suite: str, case_name: str | None) -> list[SmokeCaseDefinition]:
    if case_name:
        return [case for case in ALL_CASES if case.name == case_name]
    kinds = SUITE_TO_KINDS[suite]
    return [case for case in ALL_CASES if case.kind in kinds]


def resolve_opening_runs(opening_runs: int | None) -> int:
    return DEFAULT_OPENING_RUNS if opening_runs is None else opening_runs


def resolve_case_runs(case: SmokeCaseDefinition, *, opening_runs: int) -> int:
    if case.kind == "one_phrase_opening":
        return opening_runs
    if case.kind == "role_copy_guard":
        return DEFAULT_ROLE_COPY_RUNS
    return DEFAULT_SCRIPTED_RUNS


def build_cases(client: SimulatorClient, *, suite: str, case_name: str | None, opening_runs: int, strict: bool) -> list[CaseResult]:
    results: list[CaseResult] = []
    selected_cases = select_cases(suite=suite, case_name=case_name)
    if not selected_cases:
        raise RegressionError(f"Не найдено smoke cases для selector '{case_name or suite}'.")
    for case in selected_cases:
        case_runs = resolve_case_runs(case, opening_runs=opening_runs)
        for run_index in range(1, case_runs + 1):
            results.append(run_case(client, case=case, run_index=run_index, strict=strict))
    return results


def markdown_escape(text: str) -> str:
    return text.replace("|", "\\|")


def scenario_report_filename(scenario_id: str) -> str:
    safe = re.sub(r"[^a-zA-Z0-9._-]+", "-", scenario_id).strip("-")
    return f"{safe or 'scenario'}.md"


def format_text_block(text: str) -> str:
    value = text.strip() or "[empty live LLM reply]"
    return f"```text\n{value}\n```"


def format_rude_check(turn: TurnRecord) -> str:
    if turn.moderation_reason:
        reason = turn.moderation_reason.replace("\n", " ").strip()
        return f'**Проверка на грубость:** `{turn.rude}` — причина: "{reason}"'
    return f"**Проверка на грубость:** `{turn.rude}`"


def format_scenario_report(scenario_id: str, results: list[CaseResult]) -> str:
    summary_rows: list[str] = []
    by_case: dict[str, list[CaseResult]] = {}
    for result in results:
        by_case.setdefault(result.name, []).append(result)
    for case_name, case_results in by_case.items():
        case_status = aggregate_check_status([HeuristicCheck(case_name, item.result, "") for item in case_results])
        summary_rows.append(f"| {markdown_escape(case_name)} | {len(case_results)} | {case_status} |")

    groups = [
        {
            "kind": "role_copy_guard",
            "title": "## Тест постоянного копирования ответов LLM",
            "description": "Проверяем устойчивость роли, когда пользователь копирует открывающее сообщение клиента и затем несколько раз дословно вставляет последний ответ модели обратно. Каждый такой кейс всегда запускается 3 раза.",
        },
        {
            "kind": "one_phrase_opening",
            "title": "## Тест 10 открывающих фраз",
            "description": "Проверяем 10 однофразовых реплик администратора клиники в ответ на стандартное стартовое сообщение клиента. Это короткие живые фразы менеджера или администратора, которые должны проходить проверку на грубость без ложных срабатываний и не ломать диалог.",
        },
        {
            "kind": "scripted_reference",
            "title": "## Тесты диалогов, похожих на эталонные",
            "description": "Проверяем scripted dialogue кейсы, которые по структуре похожи на эталонные сценарии, но сформулированы иначе. Здесь смотрим, что маршрут разговора и следующий шаг остаются адекватными. Каждый такой кейс всегда запускается 1 раз.",
        },
    ]

    lines = [f"# {scenario_id}", "", "## Сводка", "", "| Case | Runs | Result |", "|---|---:|---|", *summary_rows, ""]
    for group in groups:
        group_results = [result for result in results if result.case_kind == group["kind"]]
        if not group_results:
            continue
        lines.extend(["---", "", group["title"], "", group["description"], ""])
        group_case_names = []
        for result in group_results:
            if result.name not in group_case_names:
                group_case_names.append(result.name)
        lines.append(f"Количество кейсов в наборе: {len(group_case_names)}.")
        lines.append(f"Количество прогонов в наборе: {len(group_results)}.")
        for case_name in group_case_names:
            case_results = by_case[case_name]
            lines.extend(["", f"### {case_name}", ""])
            for result in case_results:
                lines.extend(["", f"### Прогон {result.run_index:02d} — {result.result}", ""])
                if result.customer_opening is not None:
                    lines.extend(["**Стартовое сообщение API**", "", format_text_block(result.customer_opening), ""])
                if result.error_message:
                    lines.extend([f"**Проверки:** ERROR — {result.error_message}", "", "---"])
                    continue
                for turn_index, turn in enumerate(result.transcript, start=1):
                    lines.extend(
                        [
                            f"### Ход {turn_index:02d}",
                            "",
                            "**Сообщение пользователя**",
                            "",
                            format_text_block(turn.learner_text),
                            "",
                            format_rude_check(turn),
                            "",
                            "**Живой ответ LLM**",
                            "",
                            format_text_block(turn.customer_text),
                            "",
                            f"**Проверки:** {summarize_checks(turn.checks)}",
                            "",
                            "---",
                        ]
                    )
    report = "\n".join(lines).strip() + "\n"
    if re.search(r"(?m)^\d+\. ", report):
        raise AssertionError("Scenario markdown contains ordered-list prefix.")
    return report


def format_index(base_url: str, strict: bool, output_dir: Path, results: list[CaseResult]) -> str:
    generated_at = datetime.now(timezone.utc).isoformat()
    lines = [
        "# Simulator Regression Index",
        "",
        f"Generated at: {generated_at}",
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
        pass_count = sum(1 for result in scenario_results if result.result == "PASS")
        warn_count = sum(1 for result in scenario_results if result.result == "WARN")
        error_count = sum(1 for result in scenario_results if result.result == "ERROR")
        lines.append(
            f"| {markdown_escape(scenario_id)} | {pass_count} | {warn_count} | {error_count} | [{scenario_report_filename(scenario_id)}]({scenario_report_filename(scenario_id)}) |"
        )
    return "\n".join(lines).strip() + "\n"


def build_debug_payload(results: list[CaseResult]) -> dict[str, Any]:
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "results": [
            {
                **asdict(result),
                "transcript": [
                    {
                        **asdict(turn),
                        "checks": [asdict(check) for check in turn.checks],
                    }
                    for turn in result.transcript
                ],
            }
            for result in results
        ],
    }


def write_reports(*, base_url: str, strict: bool, output_dir: Path, results: list[CaseResult]) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    scenario_ids = sorted({result.scenario_id for result in results})
    for scenario_id in scenario_ids:
        scenario_results = [result for result in results if result.scenario_id == scenario_id]
        (output_dir / scenario_report_filename(scenario_id)).write_text(
            format_scenario_report(scenario_id, scenario_results),
            encoding="utf-8",
        )
    (output_dir / "index.md").write_text(format_index(base_url, strict, output_dir, results), encoding="utf-8")
    (output_dir / "debug.json").write_text(
        json.dumps(build_debug_payload(results), ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return output_dir / "index.md"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run live smoke regression scenarios against the public simulator API.")
    parser.add_argument("--base-url", default=os.getenv("SIMULATOR_API_URL") or DEFAULT_BASE_URL)
    parser.add_argument("--output-dir", default=str(DEFAULT_OUTPUT_DIR))
    parser.add_argument("--output", default=str(DEFAULT_OUTPUT))
    parser.add_argument("--timeout", type=float, default=90)
    parser.add_argument("--strict", action="store_true")
    parser.add_argument("--case", default=None)
    parser.add_argument("--suite", choices=sorted(SUITE_TO_KINDS.keys()), default="all")
    parser.add_argument(
        "--runs",
        type=int,
        default=None,
        help="Deprecated. Scripted cases run 1 time, role-copy cases run 3 times, one-phrase cases use --opening-runs.",
    )
    parser.add_argument("--opening-runs", type=int, default=None)
    return parser.parse_args()


def resolve_output_dir(args: argparse.Namespace) -> Path:
    output_dir = Path(args.output_dir)
    if args.output != str(DEFAULT_OUTPUT) and args.output_dir == str(DEFAULT_OUTPUT_DIR):
        legacy_output = Path(args.output)
        if legacy_output.suffix == ".md":
            return legacy_output.with_suffix("")
        return legacy_output
    return output_dir


def main() -> int:
    args = parse_args()
    output_dir = resolve_output_dir(args)
    opening_runs = resolve_opening_runs(args.opening_runs)
    client = SimulatorClient(base_url=args.base_url, timeout=args.timeout)
    try:
        results = build_cases(
            client,
            suite=args.suite,
            case_name=args.case,
            opening_runs=opening_runs,
            strict=args.strict,
        )
        index_path = write_reports(base_url=args.base_url, strict=args.strict, output_dir=output_dir, results=results)
    except RegressionError as exc:
        failure = CaseResult(
            name=args.case or args.suite,
            scenario_id="n/a",
            case_kind="scripted_reference",
            run_index=0,
            result="ERROR",
            transcript=[],
            error_message=str(exc),
        )
        index_path = write_reports(base_url=args.base_url, strict=args.strict, output_dir=output_dir, results=[failure])
        print(str(exc), file=sys.stderr)
        return 1
    finally:
        client.close()

    if args.strict and any(result.result != "PASS" for result in results):
        print(f"Simulator regression finished with WARN/ERROR. See {index_path}", file=sys.stderr)
        return 1

    print(f"Simulator regression index written to {index_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
