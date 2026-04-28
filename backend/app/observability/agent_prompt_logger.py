import json
import logging
import sys
from datetime import datetime, timezone
from typing import Any

from app.settings import Settings

LOGGER_NAME = "app.simulator.agent_prompts"
_SEPARATOR = "=" * 96
_SECTION_SEPARATOR = "-" * 96


def configure_agent_prompt_logger() -> logging.Logger:
    prompt_logger = logging.getLogger(LOGGER_NAME)
    prompt_logger.setLevel(logging.INFO)

    has_stdout_handler = any(
        isinstance(handler, logging.StreamHandler)
        and getattr(handler, "stream", None) is sys.stdout
        for handler in prompt_logger.handlers
    )
    if not has_stdout_handler:
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(logging.INFO)
        handler.setFormatter(logging.Formatter("%(message)s"))
        prompt_logger.addHandler(handler)

    prompt_logger.propagate = False
    return prompt_logger


def should_log_agent_prompts(settings: Settings) -> bool:
    return bool(settings.SIMULATOR_PROMPT_LOG_ENABLED) and settings.APP_ENV != "production"


def log_agent_prompt_call(
    *,
    settings: Settings,
    agent: str,
    node: str,
    status: str,
    prompt: str,
    system_prompt: str | None = None,
    raw_output: str | None = None,
    parsed_output: Any | None = None,
    metadata: dict[str, Any] | None = None,
    session_id: str | None = None,
    scenario_id: str | None = None,
) -> None:
    if not should_log_agent_prompts(settings):
        return

    max_chars = settings.SIMULATOR_PROMPT_LOG_MAX_CHARS
    show_outputs = settings.SIMULATOR_PROMPT_LOG_OUTPUTS
    ts = datetime.now(timezone.utc).isoformat()

    header_parts = [
        "AI AGENT CALL",
        f"ts={ts}",
        f"agent={agent}",
        f"node={node}",
        f"status={status}",
    ]
    if session_id:
        header_parts.append(f"session_id={session_id}")
    if scenario_id:
        header_parts.append(f"scenario_id={scenario_id}")

    sections: list[str] = [
        _SEPARATOR,
        " | ".join(header_parts),
    ]

    if metadata:
        sections.append(_render_section("METADATA", metadata, max_chars=max_chars))
    if system_prompt:
        sections.append(_render_section("SYSTEM PROMPT", system_prompt, max_chars=max_chars))
    sections.append(_render_section("USER PROMPT", prompt, max_chars=max_chars))

    if show_outputs:
        if raw_output:
            sections.append(_render_section("RAW OUTPUT", raw_output, max_chars=max_chars))
        if parsed_output not in (None, "", {}, []):
            sections.append(_render_section("PARSED / VALIDATED OUTPUT", parsed_output, max_chars=max_chars))

    sections.append(_SEPARATOR)
    configure_agent_prompt_logger().info("\n%s\n", "\n".join(sections))


def _render_section(title: str, value: Any, *, max_chars: int) -> str:
    rendered = _render_value(value)
    rendered = _truncate(rendered, max_chars=max_chars)
    return f"{_SECTION_SEPARATOR}\n{title}\n{_SECTION_SEPARATOR}\n{rendered}"


def _render_value(value: Any) -> str:
    normalized = _normalize_value(value)
    if isinstance(normalized, str):
        return _pretty_json_string(normalized)
    return json.dumps(normalized, ensure_ascii=False, indent=2, default=str)


def _normalize_value(value: Any) -> Any:
    if value is None:
        return None
    if hasattr(value, "model_dump"):
        return value.model_dump()
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, dict):
        return {str(key): _normalize_value(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [_normalize_value(item) for item in value]
    return value


def _pretty_json_string(value: str) -> str:
    stripped = value.strip()
    if not stripped:
        return ""
    if stripped[0] not in "[{":
        return value
    try:
        parsed = json.loads(stripped)
    except json.JSONDecodeError:
        return value
    return json.dumps(parsed, ensure_ascii=False, indent=2)


def _truncate(value: str, *, max_chars: int) -> str:
    if max_chars <= 0 or len(value) <= max_chars:
        return value
    omitted = len(value) - max_chars
    return f"{value[:max_chars]}\n... <truncated {omitted} chars; set SIMULATOR_PROMPT_LOG_MAX_CHARS=0 for full output>"
