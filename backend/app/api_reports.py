from __future__ import annotations

from urllib.parse import quote

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.database import get_db_session
from app.models import ReportCardDto, ReportCreateDto, ReportListResponseDto, WorkspaceRole
from app.report_service import ReportService

router = APIRouter(prefix="/api/v1/reports", tags=["reports"])


def build_attachment_header(filename: str) -> str:
    return f'attachment; filename="{filename}"; filename*=UTF-8\'\'{quote(filename)}'


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
    role: WorkspaceRole,
    service: ReportService = Depends(get_report_service),
) -> ReportListResponseDto:
    return ReportListResponseDto(items=service.list_reports(role))


@router.get("/{report_id}", response_model=ReportCardDto)
async def get_report(
    report_id: str,
    service: ReportService = Depends(get_report_service),
) -> ReportCardDto:
    return service.get_report(report_id)


@router.get("/{report_id}/export/pdf")
async def export_report_pdf(
    report_id: str,
    service: ReportService = Depends(get_report_service),
) -> Response:
    filename, content = service.build_pdf_export(report_id)
    return Response(
        content=content,
        media_type="application/pdf",
        headers={"Content-Disposition": build_attachment_header(filename)},
    )


@router.get("/{report_id}/export/csv")
async def export_report_csv(
    report_id: str,
    service: ReportService = Depends(get_report_service),
) -> Response:
    filename, content = service.build_csv_export(report_id)
    return Response(
        content=content,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": build_attachment_header(filename)},
    )
