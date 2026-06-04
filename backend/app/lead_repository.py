from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.lead_entities import AuditLeadRecord


class AuditLeadRepository:
    def __init__(self, session: Session):
        self.session = session

    def create(self, lead: AuditLeadRecord) -> AuditLeadRecord:
        self.session.add(lead)
        self.session.commit()
        self.session.refresh(lead)
        return lead

    def list_all(self) -> list[AuditLeadRecord]:
        statement = select(AuditLeadRecord).order_by(AuditLeadRecord.created_at.desc())
        return list(self.session.scalars(statement))

    def list_by_status(self, status: str) -> list[AuditLeadRecord]:
        statement = (
            select(AuditLeadRecord)
            .where(AuditLeadRecord.status == status)
            .order_by(AuditLeadRecord.created_at.desc())
        )
        return list(self.session.scalars(statement))

    def get_by_id(self, lead_id: str) -> AuditLeadRecord | None:
        return self.session.get(AuditLeadRecord, lead_id)
