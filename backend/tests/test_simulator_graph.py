import pytest
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_core.runnables import RunnableLambda

from app.agents import BuyerAgent, RudeClassifierAgent
from app.graph import create_graph
from app.models import GraphDependencies
from app.prompts import BASELINE_OPENING_MESSAGE, BUYER_SYSTEM_PROMPT
from app.store import InMemorySessionStore


def build_graph_with_reply(reply_text: str, rude_json='{"rude":"no","confidence":0.77}'):
    return create_graph(
        GraphDependencies(
            session_store=InMemorySessionStore(),
            rude_classifier=RudeClassifierAgent(RunnableLambda(lambda _: AIMessage(content=rude_json))),
            buyer_agent=BuyerAgent(RunnableLambda(lambda _: AIMessage(content=reply_text))),
        )
    )


@pytest.mark.asyncio
async def test_graph_keeps_dialogue_active_when_user_is_rude() -> None:
    graph = build_graph_with_reply("Не должно вызваться", rude_json='{"rude":"yes","confidence":0.95}')
    started = await graph.ainvoke({"action": "open_session", "scenario_id": "baseline"})
    result = await graph.ainvoke(
        {"action": "reply_to_sales", "session_id": started["session_id"], "sales_message": "Иди ты нахер"}
    )

    assert result["status"] == "active"
    assert isinstance(result["session"].messages[0], SystemMessage)
    assert result["session"].messages[0].content == BUYER_SYSTEM_PROMPT
    assert result["dialog_route"] == "stop_after_rudeness"
    assert isinstance(result["session"].messages[-1], AIMessage)
    assert result["session"].messages[-1].content == "КЛИЕНТ УШЕЛ"


@pytest.mark.asyncio
async def test_graph_returns_buyer_reply_when_user_is_not_rude() -> None:
    graph = build_graph_with_reply("Нам важно не сорвать внедрение.")
    started = await graph.ainvoke({"action": "open_session", "scenario_id": "baseline"})
    result = await graph.ainvoke(
        {"action": "reply_to_sales", "session_id": started["session_id"], "sales_message": "Какие у вас сейчас главные риски?"}
    )

    assert result["status"] == "active"
    assert result["dialog_route"] == "continue_with_customer_reply"
    assert isinstance(result["session"].messages[-2], HumanMessage)
    assert isinstance(result["session"].messages[-1], AIMessage)
    assert result["session"].messages[-1].content == "Нам важно не сорвать внедрение."


@pytest.mark.asyncio
async def test_graph_think_reply_keeps_dialogue_active() -> None:
    graph = build_graph_with_reply("Я пока подумаю и вернусь позже.")
    started = await graph.ainvoke({"action": "open_session", "scenario_id": "baseline"})
    result = await graph.ainvoke(
        {"action": "reply_to_sales", "session_id": started["session_id"], "sales_message": "Давайте уточним критерии выбора."}
    )

    assert result["status"] == "active"


@pytest.mark.asyncio
async def test_graph_starts_with_scenario_context_and_opening_message() -> None:
    graph = build_graph_with_reply("Ответ")
    started = await graph.ainvoke({"action": "open_session", "scenario_id": "baseline"})

    assert isinstance(started["messages"][0], SystemMessage)
    assert started["messages"][0].content == BUYER_SYSTEM_PROMPT
    assert isinstance(started["messages"][1], SystemMessage)
    assert "Защищай интересы своей компании" in started["messages"][1].content
    assert "Игорь Соколов" in started["messages"][1].content
    assert "сезонным ростом нагрузки" in started["messages"][1].content
    assert isinstance(started["messages"][2], AIMessage)
    assert started["messages"][2].content == BASELINE_OPENING_MESSAGE
    assert started["customer_message"] == started["messages"][2].content
