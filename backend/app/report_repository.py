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

    def get_by_session_id(self, session_id: str) -> ReportRecord | None:
        statement = select(ReportRecord).where(ReportRecord.session_id == session_id).limit(1)
        return self.session.scalar(statement)

    def list_all(self) -> list[ReportRecord]:
        statement = (
            select(ReportRecord)
            .order_by(ReportRecord.updated_at.desc(), ReportRecord.created_at.desc())
        )
        return list(self.session.scalars(statement))

    def list_by_role(self, role: str) -> list[ReportRecord]:
        statement = (
            select(ReportRecord)
            .where(ReportRecord.role == role)
            .order_by(ReportRecord.updated_at.desc(), ReportRecord.created_at.desc())
        )
        return list(self.session.scalars(statement))

    def get_by_id(self, report_id: str) -> ReportRecord | None:
        return self.session.get(ReportRecord, report_id)
