from __future__ import annotations

from sqlalchemy.orm import Session

from app.lead_entities import AuditLeadRecord
from app.lead_notifications import notify_new_lead
from app.lead_repository import AuditLeadRepository
from app.models import AuditLeadCreateDto, AuditLeadDto, AuditLeadStatus


def _to_dto(record: AuditLeadRecord) -> AuditLeadDto:
    return AuditLeadDto(
        id=record.id,
        name=record.name,
        clinic=record.clinic,
        contact=record.contact,
        comment=record.comment,
        source=record.source,
        status=AuditLeadStatus(record.status),
        payload=record.payload,
        created_at=record.created_at,
        updated_at=record.updated_at,
    )


class AuditLeadService:
    def __init__(self, session: Session):
        self.repository = AuditLeadRepository(session)

    def create_lead(self, payload: AuditLeadCreateDto) -> AuditLeadDto:
        record = AuditLeadRecord(
            name=payload.name.strip(),
            clinic=(payload.clinic or "").strip() or None,
            contact=payload.contact.strip(),
            comment=(payload.comment or "").strip() or None,
            source=payload.source.strip() or "landing_audit_form",
            status=AuditLeadStatus.NEW.value,
            payload=payload.payload,
        )
        saved = self.repository.create(record)
        notify_new_lead(saved)
        return _to_dto(saved)

    def list_leads(self, status: AuditLeadStatus | None = None) -> list[AuditLeadDto]:
        records = (
            self.repository.list_by_status(status.value)
            if status is not None
            else self.repository.list_all()
        )
        return [_to_dto(record) for record in records]
