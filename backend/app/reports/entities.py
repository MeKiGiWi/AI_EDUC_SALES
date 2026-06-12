from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import DateTime, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class ReportRecord(Base):
    __tablename__ = "reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    role: Mapped[str] = mapped_column(String(24), index=True)
    title: Mapped[str] = mapped_column(String(300))
    scenario_id: Mapped[str | None] = mapped_column(String(200), nullable=True, index=True)
    scenario_title: Mapped[str] = mapped_column(String(300))
    status: Mapped[str | None] = mapped_column(String(24), default="ready", nullable=True, index=True)
    report_type: Mapped[str] = mapped_column(String(48), default="student_progress")
    summary: Mapped[str] = mapped_column(Text)
    default_format: Mapped[str] = mapped_column(String(16), default="pdf")
    owner_label: Mapped[str] = mapped_column(String(100))
    source_label: Mapped[str | None] = mapped_column(String(120), nullable=True)
    available_formats: Mapped[list[str]] = mapped_column(JSON)
    preview_sections: Mapped[list[dict[str, object]]] = mapped_column(JSON)
    evaluation_payload: Mapped[dict[str, object]] = mapped_column(JSON)
    report_v2_payload: Mapped[dict[str, object] | None] = mapped_column(JSON, nullable=True)
    session_id: Mapped[str | None] = mapped_column(String(200), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        onupdate=utc_now,
        index=True,
    )
