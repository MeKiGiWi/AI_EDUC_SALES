from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path

from pydantic import BaseModel, Field

from app.domain.methodology import ScenarioDefinition
from app.llm.base import LLMClient
from app.services.buyer_reply_validator import (
    BuyerReplyValidationResult,
    get_fallback_reply,
    validate_buyer_reply,
)

_PROMPT_PATH_V2 = Path(__file__).resolve().parent.parent / "prompts" / "buyer_agent_v2.md"
_MARKDOWN_HEADING_RE = re.compile(r"(?m)^\s{0,3}#{1,6}\s+\S")
_JSON_OBJECT_RE = re.compile(r"^\s*\{.*\}\s*$", re.DOTALL)


class BuyerDialogTurn(BaseModel):
    role: str
    text: str


class BuyerAgentInput(BaseModel):
    scenario_private_context: ScenarioDefinition
    public_context: dict[str, str]
    current_stage: str
    dialog_history: list[BuyerDialogTurn] = Field(default_factory=list)
    edge_case_flags: list[str] = Field(default_factory=list)
    dialogue_signals: dict | None = None


@dataclass
class BuyerAgentTraceResult:
    prompt: str
    system_prompt: str
    raw_output: str
    validated_output: str
    validation_reasons: list[str] | None = None
    used_fallback: bool = False
    fallback_reason: str | None = None
    repaired_prompt: str | None = None
    repaired_raw_output: str | None = None
    repaired_validated_output: str | None = None


class BuyerAgent:
    def __init__(self, llm_client: LLMClient) -> None:
        self.llm_client = llm_client
        self.system_prompt = _PROMPT_PATH_V2.read_text(encoding="utf-8").strip()

    async def generate_reply(self, payload: BuyerAgentInput) -> str:
        result = await self.generate_reply_with_trace(payload)
        return result.validated_output

    async def generate_reply_with_trace(self, payload: BuyerAgentInput) -> BuyerAgentTraceResult:
        prompt = self._build_prompt(payload)
        reply = await self.llm_client.complete_text(prompt, system_prompt=self.system_prompt)

        # Collect forbidden replies for validation
        previous_customer_replies = [
            turn.text.strip()
            for turn in payload.dialog_history
            if turn.role == "customer" and turn.text.strip()
        ]
        forbidden_replies = previous_customer_replies[-3:] if previous_customer_replies else []

        # Extract proposed_date_or_time from dialogue_signals if available
        dialogue_signals = payload.dialogue_signals or {}
        proposed_date_or_time = dialogue_signals.get("proposed_date_or_time")

        # Validate using the new validator
        validation_result = validate_buyer_reply(
            raw_reply=reply,
            forbidden_replies=forbidden_replies,
            proposed_date_or_time=proposed_date_or_time,
            dialogue_signals=dialogue_signals,
        )

        if validation_result.is_valid:
            return BuyerAgentTraceResult(
                prompt=prompt,
                system_prompt=self.system_prompt,
                raw_output=reply,
                validated_output=validation_result.normalized_reply,
                validation_reasons=validation_result.reasons or None,
                used_fallback=False,
                fallback_reason=None,
            )

        # If invalid, use deterministic fallback (no second LLM repair for Buyer Agent)
        fallback_reply, fallback_reason = get_fallback_reply(dialogue_signals)

        return BuyerAgentTraceResult(
            prompt=prompt,
            system_prompt=self.system_prompt,
            raw_output=reply,
            validated_output=fallback_reply,
            validation_reasons=validation_result.reasons,
            used_fallback=True,
            fallback_reason=fallback_reason,
        )

    def _build_prompt(self, payload: BuyerAgentInput) -> str:
        # Collect recent customer replies for repetition protection
        previous_customer_replies = [
            turn.text.strip()
            for turn in payload.dialog_history
            if turn.role == "customer" and turn.text.strip()
        ]
        forbidden_replies = previous_customer_replies[-3:] if previous_customer_replies else []

        # Build normalized transcript with human-readable roles
        recent_transcript = []
        for turn in payload.dialog_history:
            if not turn.text.strip():
                continue
            if turn.role == "system":
                continue  # Do not send system messages to Buyer Agent
            role_label = "Менеджер" if turn.role in ("learner", "manager") else turn.role.capitalize()
            if turn.role == "customer":
                role_label = "Клиент"
            recent_transcript.append(f"{role_label}: {turn.text.strip()}")

        history_text = "\n".join(recent_transcript) if recent_transcript else "Диалог только начинается."

        private_context = payload.scenario_private_context
        buyer_ctx = private_context.buyer_agent_context

        # Compact JSON without meta-anchors, includes customer_memory for factual answers
        prompt_payload = {
            "customer_profile": {
                "name": buyer_ctx.persona_name,
                "company_context": buyer_ctx.company_context,
                "current_situation": buyer_ctx.current_situation,
            },
            "customer_memory": buyer_ctx.customer_memory or {},
            "hidden_objections": buyer_ctx.hidden_methodology_notes,
            "decision_context": {
                "current_stage": payload.current_stage,
                "edge_case_flags": payload.edge_case_flags,
            },
            "last_manager_message": (
                next(
                    (turn.text.strip() for turn in reversed(payload.dialog_history) if turn.role in ("learner", "manager") and turn.text.strip()),
                    None,
                )
            ),
            "recent_transcript": recent_transcript,
            "previous_customer_replies": previous_customer_replies,
            "forbidden_replies": forbidden_replies,
            "dialogue_signals": {
                "should_not_repeat_previous_replies": True,
                "should_not_ask_same_question_twice": True,
            },
        }
        return json.dumps(prompt_payload, ensure_ascii=False, indent=2)

    @staticmethod
    def _build_repair_prompt(original_prompt: str) -> str:
        return (
            "Ответ нарушил правила роли покупателя. "
            "Перепиши его как короткую реплику B2B-покупателя на русском языке, "
            "без markdown, JSON, критериев, уровней, объяснений своей роли или механики тренажера.\n\n"
            f"Исходный контекст:\n{original_prompt}"
        )

    @staticmethod
    def _sanitize_reply(reply: str) -> str | None:
        normalized = " ".join(reply.strip().split())
        if not normalized:
            return None
        lowered = normalized.casefold()
        banned_substrings = (
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
        if any(fragment in lowered for fragment in banned_substrings):
            return None
        if _MARKDOWN_HEADING_RE.search(reply):
            return None
        if _JSON_OBJECT_RE.match(reply):
            return None
        return normalized
