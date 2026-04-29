from app.prompts import (
    BASELINE_OPENING_MESSAGE,
    BUYER_SCENARIO_CONTEXT_PROMPT,
    BUYER_SYSTEM_PROMPT,
    RUDE_CLASSIFIER_SYSTEM_PROMPT,
)


def test_prompt_constants_are_present() -> None:
    assert "b2b клиент" in BUYER_SYSTEM_PROMPT
    assert "JSON" in RUDE_CLASSIFIER_SYSTEM_PROMPT
    assert "взвесить" in BASELINE_OPENING_MESSAGE


def test_buyer_scenario_context_prompt_formats_scenario_info() -> None:
    scenario_info = "Игорь Соколов, Среднее производственное предприятие"

    prompt = BUYER_SCENARIO_CONTEXT_PROMPT.format(scenario_info=scenario_info)

    assert "Защищай интересы своей компании" in prompt
    assert scenario_info in prompt
