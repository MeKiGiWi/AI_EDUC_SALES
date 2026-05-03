import pytest
from langchain_core.messages import AIMessage
from langchain_core.runnables import RunnableLambda

from app.agents import TopicClassifierAgent


@pytest.mark.asyncio
async def test_topic_classifier_parses_json_output() -> None:
    agent = TopicClassifierAgent(
        RunnableLambda(lambda _: AIMessage(content='{"on_topic":"no","confidence":0.91}'))
    )

    result = await agent.check("Напиши рецепт борща")

    assert result.on_topic == "no"
    assert result.confidence == pytest.approx(0.91)
