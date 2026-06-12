from pathlib import Path
import sys

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from scripts.smoke_cases.clinic_appointment import CLINIC_APPOINTMENT_SMOKE


def test_clinic_appointment_smoke_case_is_wired_to_new_scenario() -> None:
    assert CLINIC_APPOINTMENT_SMOKE.scenario_id == "clinic-appointment"
    assert len(CLINIC_APPOINTMENT_SMOKE.learner_messages) == 5
    assert all(message.strip() for message in CLINIC_APPOINTMENT_SMOKE.learner_messages)
