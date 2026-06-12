from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class AuditLeadStatus(str, Enum):
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    ARCHIVED = "archived"


class AuditLeadCreateDto(BaseModel):
    """Входящая заявка на аудит с лендинга."""

    name: str = Field(min_length=1, max_length=200)
    clinic: str | None = Field(default=None, max_length=300)
    contact: str = Field(min_length=1, max_length=300)
    comment: str | None = Field(default=None, max_length=2000)
    source: str = Field(default="landing_audit_form", max_length=64)
    payload: dict[str, object] | None = None


class AuditLeadDto(BaseModel):
    id: str
    name: str
    clinic: str | None = None
    contact: str
    comment: str | None = None
    source: str
    status: AuditLeadStatus
    payload: dict[str, object] | None = None
    created_at: datetime
    updated_at: datetime


class AuditLeadListResponseDto(BaseModel):
    items: list[AuditLeadDto]
