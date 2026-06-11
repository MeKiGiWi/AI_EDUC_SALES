from __future__ import annotations

from .models import SmokeCaseDefinition


# Guard case for role stability: the learner echoes model replies three turns in a row.
CLINIC_APPOINTMENT_ROLE_COPY_GUARD_SMOKE = SmokeCaseDefinition(
    name="clinic_appointment_role_copy_guard",
    scenario_id="clinic-appointment",
    reference_note="Role-copy guard for the new B2C appointment scenario.",
    learner_messages=[],
)
