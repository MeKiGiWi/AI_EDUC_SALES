import pytest
from langchain_core.messages import AIMessage
from langchain_core.runnables import RunnableLambda

from app.simulator_agents import RudeClassifierAgent


@pytest.mark.asyncio
async def test_rude_classifier_parses_json_output() -> None:
    agent = RudeClassifierAgent(
        RunnableLambda(lambda _: AIMessage(content='{"rude":"yes","confidence":0.91}'))
    )

    result = await agent.check("Да пошел ты")

    assert result.rude == "yes"
    assert result.confidence == pytest.approx(0.91)
