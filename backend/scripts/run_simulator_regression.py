from __future__ import annotations

import argparse
import os
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import httpx


DEFAULT_BASE_URL = "http://127.0.0.1:8000"
DEFAULT_OUTPUT = Path("artifacts/simulator-regression/latest.md")

ROLE_DRIFT_PHRASES = [
    "мы можем предложить",
    "наше решение",
    "наш продукт",
    "наше оборудование",
    "мы подберём",
    "я подготовлю для вас коммерческое предложение",
    "отправлю вам кп",
    "как менеджер",
    "как продавец",
]

REFUSAL_OR_STOP_PHRASES = [
    "завершу эту сессию",
    "не готов продолжать",
    "вернёмся к теме",
    "в рамках рабочего разговора",
    "диалог ушёл от темы",
]


class RegressionError(RuntimeError):
    """Raised when the public simulator API cannot be used successfully."""


@dataclass
class StartedSession:
    session_id: str
    status: str
    opening_text: str


@dataclass
class MessageResponse:
    session_id: str
    status: str
    rude: str
    confidence: float | None
    messages: list[dict[str, Any]]
    raw_json: dict[str, Any]


@dataclass
class TurnRecord:
    learner_text: str
    learner_source: str
    customer_text: str
    customer_source: str
    status: str
    rude: str
    confidence: float | None


@dataclass
class HeuristicCheck:
    name: str
    status: str
    detail: str


@dataclass
class CaseResult:
    name: str
    scenario_id: str
    api_status: str
    heuristic_status: str
    turns: int
    checks: list[HeuristicCheck]
    transcript: list[TurnRecord]
    customer_opening: str | None = None
    session_id: str | None = None
    error_message: str | None = None


class SimulatorClient:
    def __init__(self, base_url: str, timeout: float) -> None:
        self.base_url = base_url.rstrip("/")
        self._client = httpx.Client(timeout=timeout)

    def close(self) -> None:
        self._client.close()

    def start_session(self, scenario_id: str) -> StartedSession:
        response_json = self._post_json("/api/v1/simulator/sessions", {"scenario_id": scenario_id})
        return StartedSession(
            session_id=str(response_json["session_id"]),
            status=str(response_json["status"]),
            opening_text=str(response_json["message"]["text"]),
        )

    def send_message(self, session_id: str, text: str) -> MessageResponse:
        response_json = self._post_json(
            f"/api/v1/simulator/sessions/{session_id}/messages",
            {"text": text},
        )
        return MessageResponse(
            session_id=str(response_json["session_id"]),
            status=str(response_json["status"]),
            rude=str(response_json.get("rude", "")),
            confidence=_coerce_float(response_json.get("confidence")),
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
            raise RegressionError(
                f"Simulator API не ответил вовремя по {url}. Увеличьте --timeout или проверьте backend."
            ) from exc
        except httpx.HTTPError as exc:
            raise RegressionError(f"HTTP ошибка при запросе к {url}: {exc}") from exc

        if response.is_error:
            detail = _extract_error_detail(response)
            raise RegressionError(f"Simulator API вернул {response.status_code} для {url}: {detail}")

        try:
            return response.json()
        except ValueError as exc:
            raise RegressionError(f"Simulator API вернул не-JSON ответ для {url}.") from exc


def _coerce_float(value: Any) -> float | None:
    try:
        return None if value is None else float(value)
    except (TypeError, ValueError):
        return None


def _extract_error_detail(response: httpx.Response) -> str:
    try:
        payload = response.json()
    except ValueError:
        return response.text.strip() or "empty response body"

    if isinstance(payload, dict):
        detail = payload.get("detail")
        if detail:
            return str(detail)
    return str(payload)


def extract_latest_customer_text(response_json: dict[str, Any]) -> str:
    messages = response_json.get("messages", [])
    for message in reversed(messages):
        if str(message.get("role", "")).lower() == "customer":
            return str(message.get("text", ""))
    return ""


def evaluate_checks(last_response: MessageResponse) -> list[HeuristicCheck]:
    latest_customer_text = extract_latest_customer_text(last_response.raw_json)
    normalized_text = latest_customer_text.casefold()
    return [
        HeuristicCheck(
            name="role_drift_seller_language",
            status="WARN" if any(phrase in normalized_text for phrase in ROLE_DRIFT_PHRASES) else "PASS",
            detail=latest_customer_text,
        ),
        HeuristicCheck(
            name="refusal_or_session_stop",
            status=(
                "WARN"
                if last_response.status == "finished"
                or any(phrase in normalized_text for phrase in REFUSAL_OR_STOP_PHRASES)
                else "PASS"
            ),
            detail=f"status={last_response.status}",
        ),
        HeuristicCheck(
            name="empty_customer_reply",
            status="WARN" if not latest_customer_text.strip() else "PASS",
            detail="last customer reply is empty" if not latest_customer_text.strip() else latest_customer_text,
        ),
    ]


def aggregate_heuristic_status(checks: list[HeuristicCheck]) -> str:
    return "WARN" if any(check.status != "PASS" for check in checks) else "PASS"


def record_turn(learner_text: str, learner_source: str, response: MessageResponse) -> TurnRecord:
    return TurnRecord(
        learner_text=learner_text,
        learner_source=learner_source,
        customer_text=extract_latest_customer_text(response.raw_json),
        customer_source="llm_generated_via_public_api",
        status=response.status,
        rude=response.rude,
        confidence=response.confidence,
    )


def run_role_copy_guard_baseline(client: SimulatorClient) -> CaseResult:
    started = client.start_session("baseline")
    transcript: list[TurnRecord] = []

    learner_text = started.opening_text
    response = client.send_message(started.session_id, learner_text)
    transcript.append(record_turn(learner_text, "copied_from_customer_opening", response))

    learner_text = transcript[-1].customer_text
    response = client.send_message(started.session_id, learner_text)
    transcript.append(record_turn(learner_text, "copied_from_last_llm_reply", response))

    learner_text = transcript[-1].customer_text
    response = client.send_message(started.session_id, learner_text)
    transcript.append(record_turn(learner_text, "copied_from_last_llm_reply", response))

    checks = evaluate_checks(response)
    return CaseResult(
        name="role_copy_guard_baseline",
        scenario_id="baseline",
        api_status="ok",
        heuristic_status=aggregate_heuristic_status(checks),
        turns=len(transcript),
        checks=checks,
        transcript=transcript,
        customer_opening=started.opening_text,
        session_id=started.session_id,
    )


def run_scripted_case(
    client: SimulatorClient,
    *,
    case_name: str,
    scenario_id: str,
    learner_messages: list[str],
) -> CaseResult:
    started = client.start_session(scenario_id)
    transcript: list[TurnRecord] = []
    last_response: MessageResponse | None = None

    for learner_text in learner_messages:
        last_response = client.send_message(started.session_id, learner_text)
        transcript.append(record_turn(learner_text, "scripted_test_input", last_response))

    if last_response is None:
        raise RegressionError(f"Case {case_name} has no learner messages.")

    checks = evaluate_checks(last_response)
    return CaseResult(
        name=case_name,
        scenario_id=scenario_id,
        api_status="ok",
        heuristic_status=aggregate_heuristic_status(checks),
        turns=len(transcript),
        checks=checks,
        transcript=transcript,
        customer_opening=started.opening_text,
        session_id=started.session_id,
    )


def build_cases(client: SimulatorClient) -> list[CaseResult]:
    return [
        run_role_copy_guard_baseline(client),
        run_scripted_case(
            client,
            case_name="realistic_baseline_discovery",
            scenario_id="baseline",
            learner_messages=[
                "Чтобы не присылать общий шаблон, подскажите, что сейчас происходит в цеху и почему задача стала актуальной?",
                "Правильно понимаю, что вопрос не только в комфорте, но и в риске просадки производительности или сроков?",
                "Что для вас будет главным критерием: стабильность температуры, монтаж без простоя, стоимость эксплуатации или что-то ещё?",
                "Тогда ценность решения стоит сравнивать не только по цене, а по тому, снизит ли оно риск простоя и проблем в эксплуатации.",
                "Предлагаю подготовить короткую сверку по вашим критериям и созвониться на 15 минут завтра после обеда. Такой формат подойдёт?",
            ],
        ),
        run_scripted_case(
            client,
            case_name="realistic_objection_and_next_step",
            scenario_id="price-objection",
            learner_messages=[
                "Понимаю ваше сомнение, спорить с ощущением высокой цены точно не хочу.",
                "Подскажите, пожалуйста, с чем именно вы сейчас сравниваете нашу цену: с другим поставщиком, внутренним бюджетом или прошлым проектом?",
                "Если смотреть шире цены закупки, где для вас самый чувствительный риск: простой на монтаже, нестабильная работа системы или дальнейшая эксплуатация?",
                "Предлагаю сравнить варианты на одной понятной рамке: цена входа, риск простоя, срок монтажа и стоимость эксплуатации на дистанции.",
                "Если вам ок, я подготовлю короткое сравнение по этим критериям и завтра коротко созвонимся на 15 минут без обязательств.",
            ],
        ),
    ]


def format_report(base_url: str, strict: bool, results: list[CaseResult]) -> str:
    lines = [
        "# Simulator regression report",
        "",
        f"Generated at: {datetime.now(timezone.utc).isoformat()}",
        f"Base URL: {base_url}",
        f"Strict mode: {str(strict).lower()}",
        "",
        "## Summary",
        "",
        "| Case | Scenario | API status | Heuristic status | Turns |",
        "|---|---|---:|---|---:|",
    ]
    for result in results:
        lines.append(
            f"| {result.name} | {result.scenario_id} | {result.api_status} | {result.heuristic_status} | {result.turns} |"
        )

    for result in results:
        lines.extend(
            [
                "",
                f"## Case: {result.name}",
                "",
                f"Scenario: {result.scenario_id}",
            ]
        )
        if result.session_id:
            lines.append(f"Session ID: `{result.session_id}`")
        if result.error_message:
            lines.extend(["", "### Error", "", result.error_message])
            continue

        lines.extend(["", "### Heuristic checks", ""])
        for check in result.checks:
            lines.append(f"- {check.name}: {check.status}")

        lines.extend(["", "### Transcript", ""])
        if result.customer_opening is not None:
            lines.extend(
                [
                    "1. API opening message:",
                    "- kind: live_api_payload",
                    "- actor: scenario opening returned by API",
                    "- source: default_api_opening_message",
                    f"> {quote_block(result.customer_opening)}",
                    "",
                ]
            )

        for index, turn in enumerate(result.transcript, start=1):
            lines.extend(
                [
                    f"{index + 1}. **User input**",
                    "- kind: test_input",
                    "- actor: learner message supplied by regression script",
                    f"- source: {turn.learner_source}",
                    f"> {quote_block(turn.learner_text)}",
                    "",
                    "**Live LLM reply**",
                    "- kind: live_llm_output",
                    "- actor: buyer-agent / LLM response observed during this run",
                    f"- source: {turn.customer_source}",
                    f"> {quote_block(turn.customer_text)}",
                    "",
                    "Raw API metadata:",
                    f"- status: {turn.status}",
                    f"- rude: {turn.rude}",
                    f"- confidence: {format_confidence(turn.confidence)}",
                    "",
                ]
            )

    lines.append("")
    return "\n".join(lines)


def quote_block(text: str) -> str:
    stripped = text.strip()
    if not stripped:
        return ""
    return "\n> ".join(stripped.splitlines())


def format_confidence(value: float | None) -> str:
    return "n/a" if value is None else f"{value:.2f}"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run live smoke regression scenarios against the public simulator API."
    )
    parser.add_argument(
        "--base-url",
        default=os.getenv("SIMULATOR_API_URL") or DEFAULT_BASE_URL,
        help="Simulator API base URL. Defaults to SIMULATOR_API_URL or http://127.0.0.1:8000",
    )
    parser.add_argument(
        "--output",
        default=str(DEFAULT_OUTPUT),
        help="Markdown report output path. Defaults to artifacts/simulator-regression/latest.md",
    )
    parser.add_argument("--timeout", type=float, default=90, help="Request timeout in seconds. Default: 90")
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Exit with code 1 when any heuristic returns WARN.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    client = SimulatorClient(base_url=args.base_url, timeout=args.timeout)
    try:
        results = build_cases(client)
        output_path.write_text(format_report(args.base_url, args.strict, results), encoding="utf-8")
    except RegressionError as exc:
        error_result = CaseResult(
            name="simulator_regression_run",
            scenario_id="n/a",
            api_status="error",
            heuristic_status="n/a",
            turns=0,
            checks=[],
            transcript=[],
            error_message=str(exc),
        )
        output_path.write_text(format_report(args.base_url, args.strict, [error_result]), encoding="utf-8")
        print(str(exc), file=sys.stderr)
        return 1
    finally:
        client.close()

    if args.strict and any(result.heuristic_status != "PASS" for result in results):
        print(f"Simulator regression finished with heuristic WARN. See {output_path}", file=sys.stderr)
        return 1

    print(f"Simulator regression report written to {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
