from app.prompts import (
    BASELINE_OPENING_MESSAGE,
    BUYER_SYSTEM_PROMPT,
    RUDE_CLASSIFIER_SYSTEM_PROMPT,
)


def test_prompt_constants_are_present() -> None:
    assert "b2b клиент" in BUYER_SYSTEM_PROMPT
    assert "JSON" in RUDE_CLASSIFIER_SYSTEM_PROMPT
    assert "взвесить" in BASELINE_OPENING_MESSAGE
