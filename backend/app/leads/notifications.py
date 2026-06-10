from __future__ import annotations

import logging
import os
import smtplib
import ssl
from email.message import EmailMessage

from app.leads.entities import AuditLeadRecord

logger = logging.getLogger(__name__)

_DEFAULT_TIMEOUT = 15


def _build_email(lead: AuditLeadRecord, sender: str, recipient: str) -> EmailMessage:
    message = EmailMessage()
    message["Subject"] = f"Новая заявка на аудит — {lead.name}"
    message["From"] = sender
    message["To"] = recipient

    lines = [f"Имя: {lead.name}"]
    if lead.clinic:
        lines.append(f"Клиника / должность: {lead.clinic}")
    lines.append(f"Контакт: {lead.contact}")
    if lead.comment:
        lines.append(f"Комментарий: {lead.comment}")
    lines.append(f"Источник: {lead.source}")
    lines.append(f"Время: {lead.created_at:%Y-%m-%d %H:%M} UTC")
    message.set_content("\n".join(lines))
    return message


def notify_new_lead(lead: AuditLeadRecord) -> None:
    """Best-effort уведомление о новой заявке по email (SMTP).

    Включается, только если заданы SMTP_HOST и LEAD_NOTIFY_TO. Никогда не роняет
    создание заявки: БД — источник правды, письмо — необязательный доп. канал.
    RU-SMTP (smtp.yandex.ru / smtp.mail.ru) доступен с сервера в РФ.
    """

    host = os.getenv("SMTP_HOST", "").strip()
    recipient = os.getenv("LEAD_NOTIFY_TO", "").strip()
    if not host or not recipient:
        return

    user = os.getenv("SMTP_USER", "").strip()
    password = os.getenv("SMTP_PASSWORD", "").strip()
    sender = os.getenv("LEAD_NOTIFY_FROM", "").strip() or user
    port = int(os.getenv("SMTP_PORT", "465").strip() or "465")
    use_ssl = os.getenv("SMTP_USE_SSL", "").strip().lower() in {"1", "true", "yes"} or port == 465

    try:
        message = _build_email(lead, sender, recipient)
        context = ssl.create_default_context()
        if use_ssl:
            with smtplib.SMTP_SSL(host, port, timeout=_DEFAULT_TIMEOUT, context=context) as server:
                if user:
                    server.login(user, password)
                server.send_message(message)
        else:
            with smtplib.SMTP(host, port, timeout=_DEFAULT_TIMEOUT) as server:
                server.starttls(context=context)
                if user:
                    server.login(user, password)
                server.send_message(message)
    except Exception as error:  # noqa: BLE001 — уведомление не критично
        logger.warning("Не удалось отправить email о заявке: %s", error)
