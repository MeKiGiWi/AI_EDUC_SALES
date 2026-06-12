from __future__ import annotations

from .models import SmokeCaseDefinition


CLINIC_APPOINTMENT_ROLE_COPY_GUARD_FOLLOWUP_SMOKE = SmokeCaseDefinition(
    name="role_copy_guard_cold_call",
    scenario_id="clinic-appointment",
    reference_note="Second role-copy guard variant on the appointment scenario for repeated replay stability.",
    learner_messages=[],
)
