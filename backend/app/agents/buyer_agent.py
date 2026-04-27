from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path

from pydantic import BaseModel, Field

from app.domain.methodology import ScenarioDefinition
from app.llm.base import LLMClient

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


@dataclass
class BuyerAgentTraceResult:
    prompt: str
    system_prompt: str
    raw_output: str
    validated_output: str
    repaired_prompt: str | None = None
    repaired_raw_output: str | None = None
    repaired_validated_output: str | None = None


class BuyerAgent:
    def __init__(self, llm_client: LLMClient) -> None:
        self.llm_client = llm_client
        self.system_prompt = _PROMPT_PATH.read_text(encoding="utf-8").strip()

    async def generate_reply(self, payload: BuyerAgentInput) -> str:
        result = await self.generate_reply_with_trace(payload)
        return result.validated_output

    async def generate_reply_with_trace(self, payload: BuyerAgentInput) -> BuyerAgentTraceResult:
        prompt = self._build_prompt(payload)
        reply = await self.llm_client.complete_text(prompt, system_prompt=self.system_prompt)
        validated_reply = self._sanitize_reply(reply)
        if validated_reply is not None:
            return BuyerAgentTraceResult(
                prompt=prompt,
                system_prompt=self.system_prompt,
                raw_output=reply,
                validated_output=validated_reply,
            )

        repaired_prompt = self._build_repair_prompt(prompt)
        repaired_reply = await self.llm_client.complete_text(
            repaired_prompt,
            system_prompt=self.system_prompt,
        )
        repaired_validated_reply = self._sanitize_reply(repaired_reply)
        if repaired_validated_reply is not None:
            return BuyerAgentTraceResult(
                prompt=prompt,
                system_prompt=self.system_prompt,
                raw_output=reply,
                validated_output=repaired_validated_reply,
                repaired_prompt=repaired_prompt,
                repaired_raw_output=repaired_reply,
                repaired_validated_output=repaired_validated_reply,
            )
        return BuyerAgentTraceResult(
            prompt=prompt,
            system_prompt=self.system_prompt,
            raw_output=reply,
            validated_output=repaired_reply.strip() or reply.strip(),
            repaired_prompt=repaired_prompt,
            repaired_raw_output=repaired_reply,
            repaired_validated_output=None,
        )

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
