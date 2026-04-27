import pytest

from app.domain.methodology import CompetencyLevel
from app.repositories.methodology_repo import get_public_scenarios, load_active_methodology


def test_public_scenario_does_not_expose_competencies() -> None:
    scenarios = get_public_scenarios()

    assert scenarios
    dumped = scenarios[0].model_dump()
    assert "target_competencies" not in dumped
    assert "criteria" not in dumped
    assert "suggested_actions" not in dumped
    assert "quick_replies" not in dumped


def test_methodology_loads_all_five_competencies() -> None:
    methodology = load_active_methodology()
    competency_keys = [competency.key for competency in methodology.competency_model.competencies]

    assert len(competency_keys) == 5
    assert competency_keys == [
        "questioning",
        "need_diagnosis",
        "value_through_benefit",
        "think_it_over_objection",
        "next_step_fixation",
    ]


def test_competency_levels_are_valid_enum() -> None:
    methodology = load_active_methodology()

    for competency in methodology.competency_model.competencies:
        levels = {rubric.level for rubric in competency.levels}
        assert levels == {
            CompetencyLevel.JUNIOR,
            CompetencyLevel.MIDDLE,
            CompetencyLevel.SENIOR,
        }

    with pytest.raises(ValueError):
        CompetencyLevel("Lead")
