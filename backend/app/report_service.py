from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import ReportCardDto, ReportCreateDto, WorkspaceRole
from app.report_csv_service import build_csv_content
from app.report_mapper import create_report_record, to_report_card
from app.report_pdf_service import build_pdf_bytes
from app.report_repository import ReportRepository


def build_safe_filename(title: str, extension: str) -> str:
    normalized = "".join(
        character.lower() if character.isascii() and character.isalnum() else "-"
        for character in title
    )
    compact = "-".join(fragment for fragment in normalized.split("-") if fragment).strip("-")[:48]
    return f"{compact or 'ai-sales-academy-report'}.{extension}"


class ReportService:
    def __init__(self, session: Session):
        self.repository = ReportRepository(session)

    def create_report(self, payload: ReportCreateDto) -> ReportCardDto:
        created_at = datetime.now(timezone.utc)
        report_id = f"report-{int(created_at.timestamp() * 1000)}-{uuid4().hex[:8]}"
        record = create_report_record(payload, report_id, created_at)
        saved = self.repository.create(record)
        return to_report_card(saved)

    def list_reports(self, role: WorkspaceRole) -> list[ReportCardDto]:
        records = self.repository.list_by_role(role.value)
        return [to_report_card(record) for record in records]

    def get_report(self, report_id: str) -> ReportCardDto:
        record = self.repository.get_by_id(report_id)
        if record is None:
            raise HTTPException(status_code=404, detail="Отчет не найден.")
        return to_report_card(record)

    def build_pdf_export(self, report_id: str) -> tuple[str, bytes]:
        report = self.get_report(report_id)
        return build_safe_filename(report.title, "pdf"), build_pdf_bytes(report)

    def build_csv_export(self, report_id: str) -> tuple[str, bytes]:
        report = self.get_report(report_id)
        content = f"\ufeff{build_csv_content(report)}".encode("utf-8")
        return build_safe_filename(report.title, "csv"), content
