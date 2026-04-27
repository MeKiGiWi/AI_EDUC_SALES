from typing import Any, Protocol


class LLMClient(Protocol):
    async def complete_text(
        self,
        prompt: str,
        *,
        system_prompt: str | None = None,
    ) -> str:
        """Generate a plain-text completion for the provided prompt."""
