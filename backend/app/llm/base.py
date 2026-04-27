from typing import Any, Protocol

from app.api.v1.schemas import SessionMessageDto


class LLMClient(Protocol):
    async def complete_text(
        self,
        prompt: str,
        *,
        system_prompt: str | None = None,
    ) -> str:
        """Generate a plain-text completion for the provided prompt."""

    async def generate_customer_reply(
        self,
        session: Any,
        message: str,
    ) -> SessionMessageDto:
        """Generate the next customer reply for the simulator session."""
