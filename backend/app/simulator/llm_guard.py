from __future__ import annotations

import logging
import os
import re
from dataclasses import dataclass
from typing import Any

from langchain_core.messages import AIMessage, BaseMessage

LOGGER = logging.getLogger(__name__)

ZERO_WIDTH_CHARS = ("\u200b", "\u200c", "\u200d", "\ufeff")
WHITESPACE_RE = re.compile(r"\s+", flags=re.UNICODE)


class EmptyLLMResponseError(RuntimeError):
    def __init__(
        self,
        *,
        agent_name: str,
        attempt: int,
        debug: dict[str, Any],
        message: str | None = None,
    ) -> None:
        super().__init__(message or f"{agent_name} returned an empty LLM response on attempt {attempt}.")
        self.agent_name = agent_name
        self.attempt = attempt
        self.debug = debug


@dataclass(frozen=True)
class NonEmptyInvokeResult:
    text: str
    message: AIMessage | BaseMessage | Any
    debug: dict[str, Any]
    attempt: int


def normalize_llm_text(value: str) -> str:
    normalized = value
    for char in ZERO_WIDTH_CHARS:
        normalized = normalized.replace(char, "")
    normalized = WHITESPACE_RE.sub(" ", normalized.strip())
    return normalized


def is_empty_llm_text(value: str) -> bool:
    return not normalize_llm_text(value)


def _coerce_jsonable(value: Any) -> Any:
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    if isinstance(value, dict):
        return {str(key): _coerce_jsonable(item) for key, item in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [_coerce_jsonable(item) for item in value]
    return str(value)


def extract_message_text(message: Any) -> str:
    if isinstance(message, BaseMessage):
        content = message.content
        if isinstance(content, str):
            return content
        if isinstance(content, list):
            parts: list[str] = []
            for item in content:
                if isinstance(item, str):
                    parts.append(item)
                elif isinstance(item, dict) and isinstance(item.get("text"), str):
                    parts.append(item["text"])
                else:
                    parts.append(str(item))
            return " ".join(parts)
        return str(content)
    return str(message)


def extract_llm_debug(message: Any) -> dict[str, Any]:
    text = extract_message_text(message)
    normalized_text = normalize_llm_text(text)
    response_metadata = _coerce_jsonable(getattr(message, "response_metadata", None))
    usage_metadata = _coerce_jsonable(getattr(message, "usage_metadata", None))
    additional_kwargs = getattr(message, "additional_kwargs", {}) or {}
    finish_reason = getattr(message, "finish_reason", None)
    if finish_reason is None and isinstance(response_metadata, dict):
        finish_reason = response_metadata.get("finish_reason")
    model_name = getattr(message, "model", None) or getattr(message, "model_name", None)
    if model_name is None and isinstance(response_metadata, dict):
        model_name = response_metadata.get("model")
    provider = None
    if isinstance(response_metadata, dict):
        provider = response_metadata.get("provider") or response_metadata.get("model_provider")

    reasoning = additional_kwargs.get("reasoning")
    reasoning_details = additional_kwargs.get("reasoning_details")
    reasoning_content = additional_kwargs.get("reasoning_content")
    return {
        "content_length": len(text),
        "normalized_content_length": len(normalized_text),
        "response_metadata": response_metadata,
        "usage_metadata": usage_metadata,
        "finish_reason": finish_reason,
        "model": model_name,
        "provider": provider,
        "has_reasoning": reasoning is not None,
        "reasoning_length": len(str(reasoning)) if reasoning is not None else 0,
        "has_reasoning_details": reasoning_details is not None,
        "reasoning_details_length": len(str(reasoning_details)) if reasoning_details is not None else 0,
        "has_reasoning_content": reasoning_content is not None,
        "reasoning_content_length": len(str(reasoning_content)) if reasoning_content is not None else 0,
    }


def is_debug_enabled() -> bool:
    return os.getenv("EXPO_PUBLIC_SIMULATOR_DEBUG", "").strip().lower() == "true"


async def ainvoke_non_empty(
    runnable,
    payload: dict[str, Any],
    *,
    agent_name: str,
    attempts: int = 3,
    repair_instruction: str | None = None,
) -> NonEmptyInvokeResult:
    current_payload = dict(payload)
    last_error: EmptyLLMResponseError | None = None

    for attempt in range(1, attempts + 1):
        message = await runnable.ainvoke(current_payload)
        text = extract_message_text(message)
        normalized = normalize_llm_text(text)
        debug = extract_llm_debug(message)

        if normalized:
            return NonEmptyInvokeResult(text=normalized, message=message, debug=debug, attempt=attempt)

        last_error = EmptyLLMResponseError(agent_name=agent_name, attempt=attempt, debug=debug)
        LOGGER.warning(
            "empty_llm_response agent=%s attempt=%s debug=%s",
            agent_name,
            attempt,
            debug,
        )

        if attempt < attempts and repair_instruction:
            current_payload = {**current_payload, "retry_instruction": repair_instruction}

    if last_error is None:
        last_error = EmptyLLMResponseError(agent_name=agent_name, attempt=attempts, debug={})
    raise last_error
