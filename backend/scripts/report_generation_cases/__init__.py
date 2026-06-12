"""Scripted report-generation regression cases for live clinic scenarios."""

from .clinic_appointment import CLINIC_APPOINTMENT_REPORT_CASES
from .clinic_complaint import CLINIC_COMPLAINT_REPORT_CASES
from .models import ReportGenerationCaseDefinition

ALL_REPORT_GENERATION_CASES: list[ReportGenerationCaseDefinition] = [
    *CLINIC_APPOINTMENT_REPORT_CASES,
    *CLINIC_COMPLAINT_REPORT_CASES,
]

