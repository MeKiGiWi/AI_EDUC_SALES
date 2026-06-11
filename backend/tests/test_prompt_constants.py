from app.simulator.prompts import (
    BUYER_SCENARIO_CONTEXT_PROMPT,
    BUYER_SYSTEM_PROMPT,
    DEFAULT_OPENING_MESSAGE,
    RUDE_CLASSIFIER_SYSTEM_PROMPT,
    build_evaluation_system_prompt,
)


def test_prompt_constants_are_present() -> None:
    assert "ИИ-тренажёр учебного диалога" in BUYER_SYSTEM_PROMPT
    assert "JSON" in RUDE_CLASSIFIER_SYSTEM_PROMPT
    assert "Здравствуйте" in DEFAULT_OPENING_MESSAGE


def test_buyer_scenario_context_prompt_formats_scenario_info() -> None:
    scenario_info = "Игорь Соколов, Среднее производственное предприятие"

    prompt = BUYER_SCENARIO_CONTEXT_PROMPT.format(
        scenario_info=scenario_info,
        reference_dialogues="Эталонный диалог отсутствует.",
    )

    assert "Не пересказывай этот текст пользователю." in prompt
    assert scenario_info in prompt


def test_build_evaluation_prompt_uses_runtime_competencies() -> None:
    prompt = build_evaluation_system_prompt(
        scenario_title="Жалоба на сервис клиники",
        segment="B2C",
        competency_catalog=[
            "Контакт в жалобной коммуникации",
            "Сбор фактов по жалобе",
            "Эмпатия без обороны",
            "Предложение решения по обращению",
            "Фиксация следующего шага",
        ],
    )

    assert "Жалоба на сервис клиники" in prompt
    assert "Контакт в жалобной коммуникации" in prompt
