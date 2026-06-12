from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any


SCENARIOS_DIR = Path(__file__).resolve().parents[2] / "kb" / "scenarios"
SCENARIOS_PATH = SCENARIOS_DIR / "scenarios.json"


@lru_cache(maxsize=1)
def _load_scenarios() -> list[dict[str, Any]]:
    if not SCENARIOS_PATH.exists():
        return []

    payload = json.loads(SCENARIOS_PATH.read_text(encoding="utf-8"))
    scenarios: list[dict[str, Any]] = []
    for item in payload:
        scenarios.append(
            {
                "id": str(item["id"]),
                "title": str(item["title"]),
                "description": str(item.get("description", "")),
                "opening_message": str(item["opening_message"]),
                "scenario_info": _load_text_file(str(item["scenario_info_path"])),
                "reference_dialogues": _load_text_file(str(item.get("reference_dialogues_path", ""))),
                "segment": str(item.get("segment", "B2B")),
                "deprecated": bool(item.get("deprecated", False)),
                "active": bool(item.get("active", True)),
                "duration": str(item.get("duration", "")),
                "level": str(item.get("level", "")),
                "catalog_status": str(item.get("catalog_status", "new")),
                "target_competencies": [str(value) for value in item.get("target_competencies", [])],
                "intro_lines": [str(value) for value in item.get("intro_lines", [])],
            }
        )
    return scenarios


def _load_text_file(relative_path: str) -> str:
    if not relative_path:
        return ""
    scenario_info_path = SCENARIOS_DIR / relative_path
    if not scenario_info_path.exists():
        return ""
    return scenario_info_path.read_text(encoding="utf-8").strip()


def list_scenarios(*, active_only: bool = False) -> list[dict[str, Any]]:
    scenarios = _load_scenarios()
    if not active_only:
        return scenarios
    return [scenario for scenario in scenarios if scenario.get("active")]


def get_scenario_by_id(scenario_id: str) -> dict[str, Any] | None:
    for scenario in _load_scenarios():
        if scenario.get("id") == scenario_id:
            return scenario
    return None


def get_active_scenario_by_id(scenario_id: str) -> dict[str, Any] | None:
    scenario = get_scenario_by_id(scenario_id)
    if scenario is None or not scenario.get("active"):
        return None
    return scenario


def get_scenario_info(scenario_id: str) -> str | None:
    scenario = get_scenario_by_id(scenario_id)
    if scenario is None:
        return None
    return scenario["scenario_info"]
