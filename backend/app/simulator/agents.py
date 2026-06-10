import json
import re
from typing import Literal

from langchain_core.exceptions import OutputParserException
from langchain_core.messages import AIMessage, BaseMessage, SystemMessage
from langchain_core.output_parsers import JsonOutputParser, StrOutputParser
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder, PromptTemplate
from pydantic import BaseModel, Field

from app.simulator.prompts import (
    EVALUATION_SYSTEM_PROMPT,
    RUDE_CLASSIFIER_SYSTEM_PROMPT,
    TOPIC_CLASSIFIER_PROMPT,
)
from app.simulator.schemas import EvaluationResultRaw


class RudeCheckResult(BaseModel):
    rude: Literal["yes", "no"] = Field(
        description="Whether the sales message is rude. Use 'yes' for rude tone and 'no' otherwise."
    )
    confidence: float = Field(
        ge=0.0,
        le=1.0,
        description="Model confidence for the rudeness decision, from 0 to 1.",
    )


class TopicCheckResult(BaseModel):
    on_topic: Literal["yes", "no"] = Field(
        description="Whether the sales message is relevant to the B2B sales training dialogue."
    )
    confidence: float = Field(
        ge=0.0,
        le=1.0,
        description="Model confidence for the topic relevance decision, from 0 to 1.",
    )


class RudeClassifierAgent:
    def __init__(self, llm) -> None:
        self.llm = llm
        self.parser = JsonOutputParser(pydantic_object=RudeCheckResult)
        self.prompt_template = PromptTemplate(
            template=(
                "{system_prompt}\n\n"
                "{format_instructions}\n\n"
                "Сообщение sales:\n{message}"
            ),
            input_variables=["message"],
            partial_variables={
                "system_prompt": RUDE_CLASSIFIER_SYSTEM_PROMPT,
                "format_instructions": self.parser.get_format_instructions(),
            },
        )
        self.chain = self.prompt_template | llm | self.parser

    async def check(self, message: str) -> RudeCheckResult:
        try:
            result = await self.chain.ainvoke({"message": message})
            return RudeCheckResult.model_validate(result)
        except (OutputParserException, ValueError, TypeError):
            raw_output = await (self.prompt_template | self.llm | StrOutputParser()).ainvoke({"message": message})
            return self._fallback_parse(raw_output)

    @staticmethod
    def _fallback_parse(raw_output: str) -> RudeCheckResult:
        normalized = raw_output.strip()
        rude_match = re.search(r'"rude"\s*:\s*"(yes|no)"', normalized, flags=re.IGNORECASE)
        confidence = _extract_confidence(normalized)
        return RudeCheckResult(
            rude=(rude_match.group(1).lower() if rude_match else "no"),
            confidence=confidence,
        )


def format_messages_for_topic_check(messages: list[BaseMessage]) -> str:
    lines = []
    for message in messages:
        if isinstance(message, SystemMessage):
            continue
        role = "Покупатель" if isinstance(message, AIMessage) else "Продавец"
        lines.append(f"{role}: {message.content}")
    return "\n".join(lines)


class TopicClassifierAgent:
    def __init__(self, llm) -> None:
        self.llm = llm
        self.parser = JsonOutputParser(pydantic_object=TopicCheckResult)
        self.prompt_template = PromptTemplate(
            template=(
                TOPIC_CLASSIFIER_PROMPT
                + "\n\n"
                + "{format_instructions}"
            ),
            input_variables=["sales_message", "history"],
            partial_variables={
                "format_instructions": self.parser.get_format_instructions(),
            },
        )
        self.chain = self.prompt_template | llm | self.parser

    async def check(self, message: str, messages: list[BaseMessage]) -> TopicCheckResult:
        history = format_messages_for_topic_check(messages)
        payload = {"sales_message": message, "history": history}
        try:
            result = await self.chain.ainvoke(payload)
            return TopicCheckResult.model_validate(result)
        except (OutputParserException, ValueError, TypeError):
            raw_output = await (self.prompt_template | self.llm | StrOutputParser()).ainvoke(payload)
            return self._fallback_parse(raw_output)

    @staticmethod
    def _fallback_parse(raw_output: str) -> TopicCheckResult:
        normalized = raw_output.strip()
        topic_match = re.search(r'"on_topic"\s*:\s*"(yes|no)"', normalized, flags=re.IGNORECASE)
        confidence = _extract_confidence(normalized)
        return TopicCheckResult(
            on_topic=(topic_match.group(1).lower() if topic_match else "yes"),
            confidence=confidence,
        )


def _extract_confidence(raw_output: str) -> float:
    confidence_match = re.search(r'"confidence"\s*:\s*([0-9]+(?:\.[0-9]+)?)', raw_output, flags=re.IGNORECASE)
    if not confidence_match:
        return 0.0
    try:
        value = float(confidence_match.group(1))
    except ValueError:
        return 0.0
    return max(0.0, min(1.0, value))


class BuyerAgent:
    def __init__(self, llm) -> None:
        self.parser = StrOutputParser()
        self.prompt_template = ChatPromptTemplate.from_messages([MessagesPlaceholder("messages")])
        self.chain = self.prompt_template | llm | self.parser

    async def reply(self, messages: list[BaseMessage]) -> str:
        reply = await self.chain.ainvoke({"messages": messages})
        normalized = " ".join(reply.strip().split())
        return normalized or "Нужно чуть больше контекста, чтобы я продолжил разговор."


class EvaluationAgent:
    def __init__(self, llm) -> None:
        self.parser = StrOutputParser()
        self.prompt_template = PromptTemplate(
            template=(
                "{system_prompt}\n\n"
                "Контекст:\n"
                "- Минимум реплик для уверенной оценки: {min_replies}\n"
                "- Фактическое количество реплик менеджера: {manager_replies}\n"
                "{short_dialogue_note}\n\n"
                "{retry_instruction}\n\n"
                "Диалог:\n{dialogue}"
            ),
            input_variables=[
                "dialogue",
                "manager_replies",
                "min_replies",
                "short_dialogue_note",
                "retry_instruction",
            ],
            partial_variables={"system_prompt": EVALUATION_SYSTEM_PROMPT},
        )
        self.chain = self.prompt_template | llm | self.parser

    async def evaluate(
        self,
        dialogue: str,
        manager_replies: int,
        *,
        min_replies: int = 10,
    ) -> EvaluationResultRaw:
        short_dialogue_note = (
            "Диалог короче рекомендуемого порога. Сохраняй осторожную оценку и явно указывай ограничения."
            if manager_replies < min_replies
            else "Диалог достиг достаточного объема для стандартной оценки."
        )

        last_error: Exception | None = None
        for attempt in range(3):
            retry_instruction = (
                ""
                if attempt == 0
                else "ВАЖНО: предыдущий ответ был невалидным JSON. Верни только валидный JSON без лишнего текста."
            )
            raw_output = await self.chain.ainvoke(
                {
                    "dialogue": dialogue,
                    "manager_replies": manager_replies,
                    "min_replies": min_replies,
                    "short_dialogue_note": short_dialogue_note,
                    "retry_instruction": retry_instruction,
                }
            )

            try:
                payload = self._parse_json(raw_output)
                return EvaluationResultRaw.model_validate(payload)
            except Exception as exc:  # noqa: BLE001
                last_error = exc

        raise ValueError(f"Evaluation JSON parse failed after retries: {last_error}")

    @staticmethod
    def _parse_json(raw_output: str) -> dict:
        raw = raw_output.strip()
        candidates = [raw]

        if "```" in raw:
            fenced = raw.replace("```json", "").replace("```JSON", "").replace("```", "").strip()
            if fenced:
                candidates.append(fenced)

        start = raw.find("{")
        end = raw.rfind("}")
        if start != -1 and end != -1 and end > start:
            candidates.append(raw[start : end + 1])

        for candidate in candidates:
            try:
                parsed = json.loads(candidate)
                if isinstance(parsed, dict):
                    return parsed
            except json.JSONDecodeError:
                continue

        raise ValueError(f"Could not parse JSON payload: {raw_output}")
