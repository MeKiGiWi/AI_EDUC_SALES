from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db_session
from app.lead_service import AuditLeadService
from app.models import (
    AuditLeadCreateDto,
    AuditLeadDto,
    AuditLeadListResponseDto,
    AuditLeadStatus,
)

router = APIRouter(prefix="/api/v1/audit-leads", tags=["audit-leads"])


def get_lead_service(session: Session = Depends(get_db_session)) -> AuditLeadService:
    return AuditLeadService(session)


@router.post("", response_model=AuditLeadDto, status_code=status.HTTP_201_CREATED)
async def create_audit_lead(
    payload: AuditLeadCreateDto,
    service: AuditLeadService = Depends(get_lead_service),
) -> AuditLeadDto:
    return service.create_lead(payload)


@router.get("", response_model=AuditLeadListResponseDto)
async def list_audit_leads(
    lead_status: AuditLeadStatus | None = Query(default=None, alias="status"),
    service: AuditLeadService = Depends(get_lead_service),
) -> AuditLeadListResponseDto:
    return AuditLeadListResponseDto(items=service.list_leads(lead_status))
