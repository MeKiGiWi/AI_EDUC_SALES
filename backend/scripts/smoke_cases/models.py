from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class SmokeCaseDefinition:
    name: str
    scenario_id: str
    learner_messages: list[str]
    reference_note: str

