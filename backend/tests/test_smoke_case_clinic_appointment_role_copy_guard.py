from pathlib import Path
import sys

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from scripts.smoke_cases.clinic_appointment_role_copy_guard import (
    CLINIC_APPOINTMENT_ROLE_COPY_GUARD_SMOKE,
)


def test_clinic_appointment_role_copy_guard_case_is_wired() -> None:
    assert CLINIC_APPOINTMENT_ROLE_COPY_GUARD_SMOKE.scenario_id == "clinic-appointment"
    assert CLINIC_APPOINTMENT_ROLE_COPY_GUARD_SMOKE.name == "role_copy_guard_baseline"
    assert CLINIC_APPOINTMENT_ROLE_COPY_GUARD_SMOKE.learner_messages == []
