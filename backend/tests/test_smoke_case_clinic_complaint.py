from pathlib import Path
import sys

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from scripts.smoke_cases.clinic_complaint import CLINIC_COMPLAINT_SMOKE


def test_clinic_complaint_smoke_case_is_wired_to_new_scenario() -> None:
    assert CLINIC_COMPLAINT_SMOKE.scenario_id == "clinic-complaint"
    assert len(CLINIC_COMPLAINT_SMOKE.learner_messages) == 5
    assert all(message.strip() for message in CLINIC_COMPLAINT_SMOKE.learner_messages)
