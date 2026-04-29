from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from app.prompts import BASELINE_OPENING_MESSAGE, BASELINE_SCENARIO_ID, BASELINE_SCENARIO_TITLE


SCENARIOS_DIR = Path(__file__).resolve().parent.parent / "kb" / "scenarios"
BASELINE_SCENARIO_PATH = SCENARIOS_DIR / f"{BASELINE_SCENARIO_ID}.md"


@lru_cache(maxsize=1)
def _load_baseline_scenario_info() -> str:
    if not BASELINE_SCENARIO_PATH.exists():
        return ""
    return BASELINE_SCENARIO_PATH.read_text(encoding="utf-8").strip()


def list_scenarios() -> list[dict[str, str]]:
    return [
        {
            "id": BASELINE_SCENARIO_ID,
            "title": BASELINE_SCENARIO_TITLE,
            "opening_message": BASELINE_OPENING_MESSAGE,
            "scenario_info": _load_baseline_scenario_info(),
        }
    ]


def get_scenario_by_id(scenario_id: str) -> dict[str, str] | None:
    for scenario in list_scenarios():
        if scenario.get("id") == scenario_id:
            return scenario
    return None


def get_scenario_info(scenario_id: str) -> str | None:
    scenario = get_scenario_by_id(scenario_id)
    if scenario is None:
        return None
    return scenario["scenario_info"]
