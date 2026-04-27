from __future__ import annotations

import json
from pathlib import Path

from app.domain.evaluation import (
    COMPETENCY_NAME_BY_ID,
    EvaluationAgentInput,
    EvaluationJsonError,
    EvaluationResult,
)
from app.llm.base import LLMClient

_PROMPT_PATH = Path(__file__).resolve().parent.parent / "prompts" / "evaluation_agent_v2.md"


class EvaluationAgent:
    def __init__(self, llm_client: LLMClient) -> None:
        self.llm_client = llm_client
        self.system_prompt = _PROMPT_PATH.read_text(encoding="utf-8").strip()

    async def evaluate_with_trace(self, payload: EvaluationAgentInput) -> dict:
        if not payload.session_completed:
            raise ValueError("Evaluation can only run after the session is completed.")

        prompt = self.build_prompt(payload)
        raw_output = await self.llm_client.complete_text(prompt, system_prompt=self.system_prompt)

        try:
            parsed_result = self.parse_result(raw_output, payload.manager_turn_count)
            return {
                "prompt": prompt,
                "system_prompt": self.system_prompt,
                "raw_output": raw_output,
                "parsed_result": parsed_result,
                "error": None,
            }
        except EvaluationJsonError as exc:
            return {
                "prompt": prompt,
                "system_prompt": self.system_prompt,
                "raw_output": raw_output,
                "parsed_result": None,
                "error": str(exc),
            }

    async def evaluate(self, payload: EvaluationAgentInput) -> EvaluationResult:
        trace = await self.evaluate_with_trace(payload)
        if trace["error"]:
            raise EvaluationJsonError(trace["error"])
        return trace["parsed_result"]

    def parse_result(self, raw_result: str, actual_manager_turn_count: int | None = None) -> EvaluationResult:
        try:
            result = EvaluationResult.model_validate_json(raw_result)
        except Exception as exc:
            raise EvaluationJsonError("LLM returned invalid evaluation JSON.") from exc

        for competency in result.competencies:
            for quote in competency.evidence_quotes:
                if any(
                    customer_indicator in quote.lower()
                    for customer_indicator in ["customer:", "buyer:", "клиент:", "покупатель:"]
                ):
                    raise EvaluationJsonError(
                        "Evidence quotes must not contain customer/buyer dialogue lines."
                    )

        if not all(competency.recommendations for competency in result.competencies):
            raise EvaluationJsonError("Each competency must have non-empty recommendations.")

        if actual_manager_turn_count is not None:
            if result.validity.manager_turn_count != actual_manager_turn_count:
                raise EvaluationJsonError(
                    f"Evaluation validity manager_turn_count ({result.validity.manager_turn_count}) "
                    f"does not match actual count ({actual_manager_turn_count})."
                )

        return result

    @staticmethod
    def build_prompt(payload: EvaluationAgentInput) -> str:
        prompt_payload = {
            "task": "Evaluate only manager/learner messages and return JSON matching the schema exactly.",
            "schema_contract": {
                "required_fields": [
                    "schema_version",
                    "validity",
                    "overall_level",
                    "overall_comment",
                    "competencies",
                ],
                "competency_fields": [
                    "id",
                    "name",
                    "level",
                    "argument",
                    "evidence_quotes",
                    "missing_to_next_level",
                    "recommendations",
                ],
            },
            "scenario_context": payload.scenario_context,
            "competency_rubrics": payload.competency_rubrics,
            "criteria": payload.criteria,
            "edge_cases": payload.edge_cases,
            "full_transcript": [
                {"role": turn.role, "text": turn.text}
                for turn in payload.full_transcript
            ],
            "scoring_transcript": [
                {"role": turn.role, "text": turn.text}
                for turn in payload.scoring_transcript
            ],
            "manager_turn_count": payload.manager_turn_count,
            "min_manager_turns": payload.min_manager_turns,
            "allowed_levels": payload.allowed_levels,
        }
        return json.dumps(prompt_payload, ensure_ascii=False, indent=2)
