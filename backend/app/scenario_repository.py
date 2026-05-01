from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path


SCENARIOS_DIR = Path(__file__).resolve().parent.parent / "kb" / "scenarios"
SCENARIOS_PATH = SCENARIOS_DIR / "scenarios.json"


@lru_cache(maxsize=1)
def list_scenarios() -> list[dict[str, str]]:
    if not SCENARIOS_PATH.exists():
        return []

    payload = json.loads(SCENARIOS_PATH.read_text(encoding="utf-8"))
    return [
        {
            "id": str(item["id"]),
            "title": str(item["title"]),
            "opening_message": str(item["opening_message"]),
            "scenario_info": _load_scenario_info(str(item["scenario_info_path"])),
        }
        for item in payload
    ]


def _load_scenario_info(relative_path: str) -> str:
    scenario_info_path = SCENARIOS_DIR / relative_path
    if not scenario_info_path.exists():
        return ""
    return scenario_info_path.read_text(encoding="utf-8").strip()


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
