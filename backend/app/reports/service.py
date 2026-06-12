from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.reports.mapper import create_report_record, to_report_card
from app.reports.repository import ReportRepository
from app.reports.schemas import ReportCardDto, ReportCreateDto, WorkspaceRole


class ReportService:
    def __init__(self, session: Session):
        self.repository = ReportRepository(session)

    def create_report(self, payload: ReportCreateDto) -> ReportCardDto:
        if payload.session_id:
            existing = self.repository.get_by_session_id(payload.session_id)
            if existing is not None:
                return to_report_card(existing)

        created_at = datetime.now(timezone.utc)
        report_id = f"report-{int(created_at.timestamp() * 1000)}-{uuid4().hex[:8]}"
        record = create_report_record(payload, report_id, created_at)
        saved = self.repository.create(record)
        return to_report_card(saved)

    def list_reports(self, role: WorkspaceRole | None = None) -> list[ReportCardDto]:
        records = self.repository.list_by_role(role.value) if role is not None else self.repository.list_all()
        return [to_report_card(record) for record in records]

    def get_report(self, report_id: str) -> ReportCardDto:
        record = self.repository.get_by_id(report_id)
        if record is None:
            raise HTTPException(status_code=404, detail="Отчет не найден.")
        return to_report_card(record)
