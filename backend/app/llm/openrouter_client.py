from __future__ import annotations

from typing import Any

import httpx

from app.api.v1.schemas import MessageRole, SessionMessageDto
from app.settings import Settings


class OpenRouterClient:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    async def complete_text(
        self,
        prompt: str,
        *,
        system_prompt: str | None = None,
    ) -> str:
        messages: list[dict[str, str]] = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self.settings.LLM_MODEL,
            "messages": messages,
            "temperature": 0.2,
        }
        headers = {
            "Authorization": f"Bearer {self.settings.LLM_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": self.settings.OPENROUTER_SITE_URL,
            "X-Title": self.settings.OPENROUTER_APP_NAME,
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                self.settings.OPENROUTER_BASE_URL,
                json=payload,
                headers=headers,
            )
            response.raise_for_status()
            data = response.json()

        content = data["choices"][0]["message"]["content"]
        if isinstance(content, str):
            return content.strip()
        if isinstance(content, list):
            return "".join(
                part.get("text", "")
                for part in content
                if isinstance(part, dict)
            ).strip()
        raise ValueError("OpenRouter returned an unsupported response format.")

    async def generate_customer_reply(
        self,
        session: Any,
        message: str,
    ) -> SessionMessageDto:
        reply = await self.complete_text(prompt=message)
        return SessionMessageDto(
            role=MessageRole.CUSTOMER,
            text=reply,
        )
