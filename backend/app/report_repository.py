from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.report_entities import ReportRecord


class ReportRepository:
    def __init__(self, session: Session):
        self.session = session

    def create(self, report: ReportRecord) -> ReportRecord:
        self.session.add(report)
        self.session.commit()
        self.session.refresh(report)
        return report

    def list_all(self) -> list[ReportRecord]:
        statement = (
            select(ReportRecord)
            .order_by(ReportRecord.updated_at.desc(), ReportRecord.created_at.desc())
        )
        return list(self.session.scalars(statement))

    def get_by_id(self, report_id: str) -> ReportRecord | None:
        return self.session.get(ReportRecord, report_id)
