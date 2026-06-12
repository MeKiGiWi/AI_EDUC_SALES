import pytest
from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.runnables import RunnableLambda

from app.simulator.agents import (
    TopicClassifierAgent,
    contains_seller_language,
    detect_role_copy,
    is_internal_guard_message,
)
from app.simulator.prompts import OFFTOPIC_WARNING_MESSAGE


@pytest.mark.asyncio
async def test_topic_classifier_parses_json_output() -> None:
    agent = TopicClassifierAgent(
        RunnableLambda(lambda _: AIMessage(content='{"on_topic":"no","confidence":0.91}'))
    )

    result = await agent.check("Напиши рецепт борща", [])

    assert result.on_topic == "no"
    assert result.confidence == pytest.approx(0.91)


@pytest.mark.asyncio
async def test_topic_classifier_falls_back_on_invalid_json_confidence() -> None:
    agent = TopicClassifierAgent(
        RunnableLambda(lambda _: AIMessage(content='{"on_topic":"no","confidence":0. nine}'))
    )

    result = await agent.check("Напиши рецепт борща", [])

    assert result.on_topic == "no"
    assert result.confidence == pytest.approx(0.0)


def test_detect_role_copy_matches_normalized_previous_customer_message() -> None:
    matched, source_message, similarity = detect_role_copy(
        "  ПОДБЕРИТЕ  мне  слот на завтра!!! ",
        [
            AIMessage(content="Подберите мне слот на завтра."),
            HumanMessage(content="Уточните, пожалуйста, время."),
        ],
    )

    assert matched is True
    assert source_message is not None
    assert source_message.content == "Подберите мне слот на завтра."
    assert similarity >= 0.94


def test_internal_guard_and_seller_language_detection() -> None:
    assert is_internal_guard_message(OFFTOPIC_WARNING_MESSAGE) is True
    assert contains_seller_language("Давайте я задам несколько уточняющих вопросов.") is True
