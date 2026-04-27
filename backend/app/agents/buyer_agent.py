from __future__ import annotations

import json
import re
from pathlib import Path

from pydantic import BaseModel, Field

from app.domain.methodology import ScenarioDefinition
from app.llm.base import LLMClient

SAFE_FALLBACK_REPLY = (
    "Нам нужно аккуратно оценить риски и понять практическую пользу. "
    "Давайте без спешки зафиксируем, что именно вы предлагаете следующим шагом."
)
_PROMPT_PATH = Path(__file__).resolve().parent.parent / "prompts" / "buyer_agent_v1.md"
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


class BuyerAgent:
    def __init__(self, llm_client: LLMClient) -> None:
        self.llm_client = llm_client
        self.system_prompt = _PROMPT_PATH.read_text(encoding="utf-8").strip()

    async def generate_reply(self, payload: BuyerAgentInput) -> str:
        prompt = self._build_prompt(payload)
        reply = await self.llm_client.complete_text(prompt, system_prompt=self.system_prompt)
        validated_reply = self._sanitize_reply(reply)
        if validated_reply is not None:
            return validated_reply

        repaired_reply = await self.llm_client.complete_text(
            self._build_repair_prompt(prompt),
            system_prompt=self.system_prompt,
        )
        repaired_validated_reply = self._sanitize_reply(repaired_reply)
        if repaired_validated_reply is not None:
            return repaired_validated_reply
        return SAFE_FALLBACK_REPLY

    def _build_prompt(self, payload: BuyerAgentInput) -> str:
        dialog_lines = [
            f"{turn.role}: {turn.text.strip()}" for turn in payload.dialog_history if turn.text.strip()
        ]
        history_text = "\n".join(dialog_lines) if dialog_lines else "Диалог только начинается."
        private_context = payload.scenario_private_context
        prompt_payload = {
            "public_context": payload.public_context,
            "current_stage": payload.current_stage,
            "dialog_history": history_text,
            "edge_case_flags": payload.edge_case_flags,
            "buyer_persona": {
                "persona_name": private_context.buyer_agent_context.persona_name,
                "company_context": private_context.buyer_agent_context.company_context,
                "current_situation": private_context.buyer_agent_context.current_situation,
                "disclosure_sequence": private_context.buyer_agent_context.disclosure_sequence,
                "hidden_summary": private_context.hidden_summary,
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
