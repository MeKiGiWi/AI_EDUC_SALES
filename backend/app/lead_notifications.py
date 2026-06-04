from __future__ import annotations

import logging
import os

import httpx

from app.lead_entities import AuditLeadRecord

logger = logging.getLogger(__name__)

_TELEGRAM_API = "https://api.telegram.org/bot{token}/sendMessage"
_TIMEOUT_SECONDS = 10.0


def _format_lead_message(lead: AuditLeadRecord) -> str:
    lines = [
        "🟢 Новая заявка на аудит",
        f"Имя: {lead.name}",
    ]
    if lead.clinic:
        lines.append(f"Клиника / должность: {lead.clinic}")
    lines.append(f"Контакт: {lead.contact}")
    if lead.comment:
        lines.append(f"Комментарий: {lead.comment}")
    lines.append(f"Источник: {lead.source}")
    return "\n".join(lines)


def notify_new_lead(lead: AuditLeadRecord) -> None:
    """Best-effort уведомление о новой заявке в Telegram.

    Включается только если заданы переменные окружения TELEGRAM_BOT_TOKEN и
    TELEGRAM_CHAT_ID. Никогда не роняет создание заявки: БД — источник правды,
    уведомление — необязательный доп. канал.
    """

    token = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
    chat_id = os.getenv("TELEGRAM_CHAT_ID", "").strip()
    if not token or not chat_id:
        return

    try:
        httpx.post(
            _TELEGRAM_API.format(token=token),
            json={"chat_id": chat_id, "text": _format_lead_message(lead)},
            timeout=_TIMEOUT_SECONDS,
        )
    except Exception as error:  # noqa: BLE001 — уведомление не критично
        logger.warning("Не удалось отправить уведомление о заявке в Telegram: %s", error)
