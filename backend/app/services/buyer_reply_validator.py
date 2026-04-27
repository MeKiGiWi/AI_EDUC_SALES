"""Buyer reply validation module with deterministic fallback support."""

from __future__ import annotations

import re
from dataclasses import dataclass, field

# Regex patterns
_MARKDOWN_HEADING_RE = re.compile(r"(?m)^\s{0,3}#{1,6}\s+\S")
_JSON_OBJECT_RE = re.compile(r"^\s*\{.*\}\s*$", re.DOTALL)

# Seller role phrases that Buyer Agent should never use
SELLER_ROLE_PHRASES = (
    "мы предлагаем",
    "наше решение",
    "мы можем решить",
    "давайте обсудим, как мы можем",
)

# Banned substrings indicating internal leak or wrong role
BANNED_SUBSTRINGS = (
    "junior",
    "middle",
    "senior",
    "компетенц",
    "критери",
    "инструк",
    "внутренн",
    "как ии",
    "как модель",
    "в тренажёре проверяется",
    "в тренажере проверяется",
)


@dataclass
class BuyerReplyValidationResult:
    """Result of buyer reply validation."""

    is_valid: bool
    normalized_reply: str
    reasons: list[str] = field(default_factory=list)


def _compute_word_count(text: str) -> int:
    """Count words in text."""
    return len(text.split())


def _compute_similarity(a: str, b: str) -> float:
    """Compute simple similarity between two strings based on character overlap."""
    if not a or not b:
        return 0.0
    a_lower = a.lower().strip()
    b_lower = b.lower().strip()
    if a_lower == b_lower:
        return 1.0
    # Use ratio of common characters
    set_a = set(a_lower)
    set_b = set(b_lower)
    intersection = len(set_a & set_b)
    union = len(set_a | set_b)
    return intersection / union if union > 0 else 0.0


def validate_buyer_reply(
    raw_reply: str,
    forbidden_replies: list[str] | None = None,
    proposed_date_or_time: str | None = None,
    dialogue_signals: dict | None = None,
) -> BuyerReplyValidationResult:
    """
    Validate a buyer agent reply.

    Args:
        raw_reply: The raw LLM output to validate.
        forbidden_replies: List of previous customer replies to check for repetition.
        proposed_date_or_time: If set, indicates a date/time was already proposed.
        dialogue_signals: Dictionary of detected signals like profanity, price_before_value, etc.

    Returns:
        BuyerReplyValidationResult with is_valid, normalized_reply, and reasons.
    """
    reasons: list[str] = []
    normalized = " ".join(raw_reply.strip().split()) if raw_reply else ""

    # 1. Empty reply check
    if not normalized:
        return BuyerReplyValidationResult(
            is_valid=False,
            normalized_reply="",
            reasons=["empty_reply"],
        )

    lowered = normalized.casefold()

    # 2. JSON or markdown check
    if _JSON_OBJECT_RE.match(raw_reply):
        reasons.append("json_or_markdown")
    if _MARKDOWN_HEADING_RE.search(raw_reply):
        reasons.append("json_or_markdown")

    # 3. Simulator internal leak check
    for fragment in BANNED_SUBSTRINGS:
        if fragment in lowered:
            reasons.append("simulator_internal_leak")
            break

    # 4. Repeated customer reply check (similarity >= 0.9)
    if forbidden_replies:
        for prev_reply in forbidden_replies:
            if prev_reply.strip():
                similarity = _compute_similarity(normalized, prev_reply.strip())
                if similarity >= 0.9:
                    reasons.append("repeated_customer_reply")
                    break

    # 5. Seller role leak check
    for phrase in SELLER_ROLE_PHRASES:
        if phrase in lowered:
            reasons.append("seller_role_leak")
            break

    # Check for "у вас есть сомнения" in seller context
    if "у вас есть сомнения" in lowered or "у вас есть сомнение" in lowered:
        reasons.append("seller_role_leak")

    # Check for repeated "когда вам будет удобно" if proposed_date_or_time exists
    if proposed_date_or_time:
        if "когда вам будет удобно" in lowered or "когда вам удобно" in lowered:
            reasons.append("seller_role_leak")

    # 6. Too long check (> 60 words for Buyer Agent)
    if _compute_word_count(normalized) > 60:
        reasons.append("too_long")

    is_valid = len(reasons) == 0
    return BuyerReplyValidationResult(
        is_valid=is_valid,
        normalized_reply=normalized if is_valid else normalized,
        reasons=reasons,
    )


def get_fallback_reply(dialogue_signals: dict | None = None) -> tuple[str, str]:
    """
    Get a deterministic fallback reply based on dialogue signals.

    Args:
        dialogue_signals: Dictionary with keys like:
            - profanity_or_insult: bool
            - price_before_value: bool
            - repeated_pitch: bool
            - asked_about_equipment: bool
            - asked_about_peak_problem: bool
            - scheduling_attempt: bool
            - proposed_date_or_time: str | None

    Returns:
        Tuple of (fallback_reply, fallback_reason).
    """
    signals = dialogue_signals or {}

    if signals.get("profanity_or_insult"):
        return (
            "В таком тоне я не готов продолжать обсуждение. Если вернемся к предметному разговору о рисках и сроках, можем продолжить.",
            "profanity_or_insult",
        )

    if signals.get("price_before_value"):
        return (
            "Для меня вопрос не только в цене. Сначала нужно понять, как вы исключите простой линии во время внедрения.",
            "price_before_value",
        )

    if signals.get("repeated_pitch"):
        return (
            "Вы повторяете общие обещания, а мне нужен конкретный ответ по срокам внедрения и риску остановки производства.",
            "repeated_pitch",
        )

    if signals.get("asked_about_equipment"):
        return (
            "Сейчас стоят две старые холодильные установки и локальная вентиляция в горячей зоне, резервирования почти нет.",
            "asked_about_equipment",
        )

    if signals.get("asked_about_peak_problem"):
        return (
            "В жаркие недели температура уходит выше нормы, а в прошлом сезоне были две короткие остановки линии из-за перегрева.",
            "asked_about_peak_problem",
        )

    if signals.get("scheduling_attempt") and signals.get("proposed_date_or_time"):
        return (
            "Завтра смогу в 11:00. Давайте подключим главного инженера и предметно пройдем риски по срокам внедрения.",
            "scheduling_attempt",
        )

    # Default fallback
    return (
        "Мне важно понять, как вы снизите риск остановки производства во время внедрения.",
        "default",
    )
