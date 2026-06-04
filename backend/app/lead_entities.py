from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import DateTime, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class AuditLeadRecord(Base):
    """Заявка на аудит, оставленная через лендинг.

    Хранилище заявок сделано с заделом на будущую CRM/платформу:
    ``source`` различает каналы заявок, ``status`` — стадию обработки,
    ``payload`` — произвольные доп. данные (например, результат аудита),
    которые можно добавлять без изменения схемы.
    """

    __tablename__ = "audit_leads"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String(200))
    clinic: Mapped[str | None] = mapped_column(String(300), nullable=True)
    contact: Mapped[str] = mapped_column(String(300))
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    source: Mapped[str] = mapped_column(String(64), default="landing_audit_form", index=True)
    status: Mapped[str] = mapped_column(String(24), default="new", index=True)
    payload: Mapped[dict[str, object] | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, index=True
    )
