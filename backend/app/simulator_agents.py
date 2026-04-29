from typing import Literal

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage, BaseMessage
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field

from app.simulator_prompts import BUYER_SYSTEM_PROMPT, RUDE_CLASSIFIER_SYSTEM_PROMPT


class RudeCheckResult(BaseModel):
    rude: Literal["yes", "no"]
    confidence: float = Field(ge=0.0, le=1.0)


class RudeClassifierAgent:
    def __init__(self, model) -> None:
        self._model = model
        self._parser = JsonOutputParser(pydantic_object=RudeCheckResult)

    async def check(self, message: str) -> RudeCheckResult:
        response = await self._model.ainvoke(
            [
                SystemMessage(content=RUDE_CLASSIFIER_SYSTEM_PROMPT),
                HumanMessage(
                    content=(
                        f"{self._parser.get_format_instructions()}\n\n"
                        f"Сообщение sales:\n{message}"
                    )
                ),
            ]
        )
        parsed = self._parser.parse(response.content)
        return RudeCheckResult.model_validate(parsed)


class BuyerAgent:
    def __init__(self, model) -> None:
        self._model = model

    async def reply(self, messages: list[BaseMessage]) -> str:
        response = await self._model.ainvoke(messages)
        return self._normalize_reply(response.content)

    @staticmethod
    def _normalize_reply(reply: str) -> str:
        normalized = " ".join(reply.strip().split())
        return normalized or "Нужно чуть больше контекста, чтобы я продолжил разговор."
