from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db_session
from app.reports.schemas import ReportCardDto, ReportCreateDto, ReportListResponseDto, WorkspaceRole
from app.reports.service import ReportService

router = APIRouter(prefix="/api/v1/reports", tags=["reports"])


def get_report_service(session: Session = Depends(get_db_session)) -> ReportService:
    return ReportService(session)


@router.post("", response_model=ReportCardDto, status_code=status.HTTP_201_CREATED)
async def create_report(
    payload: ReportCreateDto,
    service: ReportService = Depends(get_report_service),
) -> ReportCardDto:
    return service.create_report(payload)


@router.get("", response_model=ReportListResponseDto)
async def list_reports(
    role: WorkspaceRole | None = Query(default=None),
    service: ReportService = Depends(get_report_service),
) -> ReportListResponseDto:
    return ReportListResponseDto(items=service.list_reports(role))


@router.get("/{report_id}", response_model=ReportCardDto)
async def get_report(
    report_id: str,
    service: ReportService = Depends(get_report_service),
) -> ReportCardDto:
    return service.get_report(report_id)
