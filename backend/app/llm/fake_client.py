from typing import Any

from collections.abc import Sequence

from app.api.v1.schemas import MessageRole, SessionMessageDto


class FakeLLMClient:
    def __init__(self, queued_text_responses: Sequence[str] | None = None) -> None:
        self.queued_text_responses = list(queued_text_responses or [])
        self.prompts: list[dict[str, str | None]] = []

    async def complete_text(
        self,
        prompt: str,
        *,
        system_prompt: str | None = None,
    ) -> str:
        self.prompts.append({"prompt": prompt, "system_prompt": system_prompt})
        if self.queued_text_responses:
            return self.queued_text_responses.pop(0)
        return (
            "Сейчас для нас важнее понять, как внедрение повлияет на сроки "
            "и риски производства."
        )

    async def generate_customer_reply(
        self,
        session: Any,
        message: str,
    ) -> SessionMessageDto:
        return SessionMessageDto(
            role=MessageRole.CUSTOMER,
            text=(
                "Принял вашу мысль. Расскажите, пожалуйста, как это повлияет "
                "на мои текущие показатели и сроки внедрения?"
            ),
        )
