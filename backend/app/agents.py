import json
from typing import Literal

from langchain_core.messages import BaseMessage
from langchain_core.output_parsers import JsonOutputParser, StrOutputParser
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder, PromptTemplate
from pydantic import BaseModel, Field

from app.models import EvaluationResultRaw
from app.prompts import EVALUATION_SYSTEM_PROMPT, RUDE_CLASSIFIER_SYSTEM_PROMPT, TOPIC_CLASSIFIER_SYSTEM_PROMPT


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
        result = await self.chain.ainvoke({"message": message})
        return RudeCheckResult.model_validate(result)


class TopicClassifierAgent:
    def __init__(self, llm) -> None:
        self.parser = JsonOutputParser(pydantic_object=TopicCheckResult)
        self.prompt_template = PromptTemplate(
            template=(
                "{system_prompt}\n\n"
                "{format_instructions}\n\n"
                "Сообщение пользователя:\n{message}"
            ),
            input_variables=["message"],
            partial_variables={
                "system_prompt": TOPIC_CLASSIFIER_SYSTEM_PROMPT,
                "format_instructions": self.parser.get_format_instructions(),
            },
        )
        self.chain = self.prompt_template | llm | self.parser

    async def check(self, message: str) -> TopicCheckResult:
        result = await self.chain.ainvoke({"message": message})
        return TopicCheckResult.model_validate(result)


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
