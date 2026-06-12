from __future__ import annotations

from dataclasses import dataclass
from typing import Literal


@dataclass(frozen=True)
class SmokeCaseDefinition:
    name: str
    scenario_id: str
    learner_messages: list[str]
    reference_note: str | None
    kind: Literal["scripted_reference", "role_copy_guard", "one_phrase_opening"]
    opening_override: str | None = None
    max_turns: int | None = None
