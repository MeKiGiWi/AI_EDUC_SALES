from __future__ import annotations

import json
from pathlib import Path

from app.domain.evaluation import EvaluationAgentInput, EvaluationJsonError, EvaluationResult
from app.llm.base import LLMClient

_PROMPT_PATH = Path(__file__).resolve().parent.parent / "prompts" / "evaluation_agent_v1.md"


class EvaluationAgent:
    def __init__(self, llm_client: LLMClient) -> None:
        self.llm_client = llm_client
        self.system_prompt = _PROMPT_PATH.read_text(encoding="utf-8").strip()

    async def evaluate(self, payload: EvaluationAgentInput) -> EvaluationResult:
        if not payload.session_completed:
            raise ValueError("Evaluation can only run after the session is completed.")

        prompt = self.build_prompt(payload)
        raw_result = await self.llm_client.complete_text(prompt, system_prompt=self.system_prompt)
        return self.parse_result(raw_result)

    def parse_result(self, raw_result: str) -> EvaluationResult:
        try:
            return EvaluationResult.model_validate_json(raw_result)
        except Exception as exc:
            raise EvaluationJsonError("LLM returned invalid evaluation JSON.") from exc

    @staticmethod
    def build_prompt(payload: EvaluationAgentInput) -> str:
        prompt_payload = {
            "task": "Evaluate only manager/learner messages and return JSON matching the schema exactly.",
            "scenario_context": payload.scenario_context,
            "competency_model_version": payload.competency_model_version,
            "criteria": payload.criteria,
            "edge_cases": payload.edge_cases,
            "min_manager_turns": payload.min_manager_turns,
            "manager_turn_count": payload.manager_turn_count,
            "allowed_levels": payload.allowed_levels,
            "scoring_transcript": [
                {"role": turn.role, "text": turn.text}
                for turn in payload.scoring_transcript
            ],
        }
        return json.dumps(prompt_payload, ensure_ascii=False, indent=2)
