import pytest
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_core.runnables import RunnableLambda

from app.simulator_agents import BuyerAgent, RudeClassifierAgent
from app.simulator_graph import InMemorySessionStore, SimulatorGraphDependencies, create_simulator_graph


@pytest.mark.asyncio
async def test_graph_finishes_dialogue_when_user_is_rude() -> None:
    graph = create_simulator_graph(
        SimulatorGraphDependencies(
            session_store=InMemorySessionStore(),
            rude_classifier=RudeClassifierAgent(
                RunnableLambda(lambda _: AIMessage(content='{"rude":"yes","confidence":0.95}'))
            ),
            buyer_agent=BuyerAgent(RunnableLambda(lambda _: AIMessage(content="Не должно вызваться"))),
        )
    )

    started = await graph.ainvoke({"action": "open_session", "scenario_id": "production-cooling"})
    result = await graph.ainvoke(
        {
            "action": "reply_to_sales",
            "session_id": started["session_id"],
            "sales_message": "Иди ты нахер",
        }
    )

    assert result["status"] == "finished"
    assert isinstance(result["session"].messages[0], SystemMessage)
    assert result["dialog_route"] == "stop_after_rudeness"
    assert isinstance(result["session"].messages[-1], AIMessage)
    assert result["session"].messages[-1].content == "КЛИЕНТ УШЕЛ"


@pytest.mark.asyncio
async def test_graph_returns_buyer_reply_when_user_is_not_rude() -> None:
    graph = create_simulator_graph(
        SimulatorGraphDependencies(
            session_store=InMemorySessionStore(),
            rude_classifier=RudeClassifierAgent(
                RunnableLambda(lambda _: AIMessage(content='{"rude":"no","confidence":0.77}'))
            ),
            buyer_agent=BuyerAgent(RunnableLambda(lambda _: AIMessage(content="Нам важно не сорвать внедрение."))),
        )
    )

    started = await graph.ainvoke({"action": "open_session", "scenario_id": "production-cooling"})
    result = await graph.ainvoke(
        {
            "action": "reply_to_sales",
            "session_id": started["session_id"],
            "sales_message": "Какие у вас сейчас главные риски?",
        }
    )

    assert result["status"] == "active"
    assert isinstance(result["session"].messages[0], SystemMessage)
    assert result["dialog_route"] == "continue_with_customer_reply"
    assert isinstance(result["session"].messages[-2], HumanMessage)
    assert isinstance(result["session"].messages[-1], AIMessage)
    assert result["session"].messages[-1].content == "Нам важно не сорвать внедрение."
