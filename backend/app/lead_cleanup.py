from __future__ import annotations

import asyncio
import logging
import os
from datetime import datetime, timedelta, timezone

from app.database import get_session_factory
from app.lead_repository import AuditLeadRepository

logger = logging.getLogger(__name__)

_DEFAULT_RETENTION_DAYS = 14
_CHECK_INTERVAL_SECONDS = 24 * 60 * 60  # раз в сутки сверяем окно хранения


def get_retention_days() -> int:
    raw = os.getenv("LEAD_RETENTION_DAYS", "").strip()
    try:
        days = int(raw) if raw else _DEFAULT_RETENTION_DAYS
    except ValueError:
        days = _DEFAULT_RETENTION_DAYS
    return max(days, 1)


def purge_old_leads() -> int:
    """Удаляет заявки старше окна хранения (по умолчанию 14 дней).

    Email остаётся постоянным архивом, а БД держим «свежей» — скользящее окно.
    """

    cutoff = datetime.now(timezone.utc) - timedelta(days=get_retention_days())
    session = get_session_factory()()
    try:
        removed = AuditLeadRepository(session).delete_older_than(cutoff)
        if removed:
            logger.info("Очистка заявок: удалено %s (старше %s дней).", removed, get_retention_days())
        return removed
    finally:
        session.close()


async def run_lead_cleanup_loop(interval_seconds: int = _CHECK_INTERVAL_SECONDS) -> None:
    """Фоновая задача: периодически чистит старые заявки. Запускается из lifespan."""

    while True:
        try:
            purge_old_leads()
        except Exception as error:  # noqa: BLE001 — очистка не должна ронять сервис
            logger.warning("Не удалось выполнить очистку заявок: %s", error)
        await asyncio.sleep(interval_seconds)
