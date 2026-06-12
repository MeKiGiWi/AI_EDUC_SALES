from __future__ import annotations

from .models import SmokeCaseDefinition


CLINIC_COMPLAINT_ROLE_COPY_GUARD_SMOKE = SmokeCaseDefinition(
    name="role_copy_guard_price_objection",
    scenario_id="clinic-complaint",
    reference_note="Role-copy guard for complaint handling with repeated learner echo.",
    learner_messages=[],
    kind="role_copy_guard",
    max_turns=5,
)
