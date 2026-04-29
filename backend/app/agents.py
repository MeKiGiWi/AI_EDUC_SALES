from typing import Literal

from langchain_core.messages import BaseMessage
from langchain_core.output_parsers import JsonOutputParser, StrOutputParser
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder, PromptTemplate
from pydantic import BaseModel, Field

from app.prompts import BUYER_SYSTEM_PROMPT, RUDE_CLASSIFIER_SYSTEM_PROMPT


class RudeCheckResult(BaseModel):
    rude: Literal["yes", "no"] = Field(
        description="Whether the sales message is rude. Use 'yes' for rude tone and 'no' otherwise."
    )
    confidence: float = Field(
        ge=0.0,
        le=1.0,
        description="Model confidence for the rudeness decision, from 0 to 1.",
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


class BuyerAgent:
    def __init__(self, llm) -> None:
        self.parser = StrOutputParser()
        self.prompt_template = ChatPromptTemplate.from_messages(
            [
                ("system", BUYER_SYSTEM_PROMPT),
                MessagesPlaceholder("messages"),
            ]
        )
        self.chain = self.prompt_template | llm | self.parser

    async def reply(self, messages: list[BaseMessage]) -> str:
        reply = await self.chain.ainvoke({"messages": messages})
        normalized = " ".join(reply.strip().split())
        return normalized or "Нужно чуть больше контекста, чтобы я продолжил разговор."
