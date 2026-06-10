import pytest
from langchain_core.messages import AIMessage
from langchain_core.runnables import RunnableLambda

from app.simulator.agents import TopicClassifierAgent


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
