from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

ReportGenerationLevel = Literal["Junior", "Middle", "Senior"]
ReportDialogueSpeaker = Literal["learner", "customer"]


@dataclass(frozen=True)
class ReportDialogueTurn:
    speaker: ReportDialogueSpeaker
    text: str


@dataclass(frozen=True)
class ReportGenerationCaseDefinition:
    name: str
    scenario_id: str
    scenario_title: str
    expected_level: ReportGenerationLevel
    dialogue: list[ReportDialogueTurn]
    reference_note: str | None = None
