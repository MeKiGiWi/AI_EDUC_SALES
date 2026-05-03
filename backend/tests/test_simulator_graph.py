import pytest
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_core.runnables import RunnableLambda

from app.agents import BuyerAgent, RudeClassifierAgent, TopicClassifierAgent
from app.graph import create_graph
from app.models import GraphDependencies
from app.prompts import BASELINE_OPENING_MESSAGE, BUYER_SCENARIO_CONTEXT_PROMPT, BUYER_SYSTEM_PROMPT
from app.scenario_repository import get_scenario_info
from app.store import InMemorySessionStore


def build_graph_with_reply(
    reply_text: str,
    rude_json='{"rude":"no","confidence":0.77}',
    topic_json='{"on_topic":"yes","confidence":0.88}',
):
    return create_graph(
        GraphDependencies(
            session_store=InMemorySessionStore(),
            rude_classifier=RudeClassifierAgent(RunnableLambda(lambda _: AIMessage(content=rude_json))),
            topic_classifier=TopicClassifierAgent(RunnableLambda(lambda _: AIMessage(content=topic_json))),
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
    assert "Не пересказывай этот текст пользователю." in started["messages"][1].content
    assert "СЛЕДУЙ СТРОГО СЦЕНАРИЮ" in started["messages"][1].content
    assert started["messages"][1].content == BUYER_SCENARIO_CONTEXT_PROMPT.format(
        scenario_info=get_scenario_info("baseline")
    )
    assert isinstance(started["messages"][2], AIMessage)
    assert started["messages"][2].content == BASELINE_OPENING_MESSAGE
    assert started["messages"][2].content == BASELINE_OPENING_MESSAGE
    assert started["customer_message"] == started["messages"][2].content


@pytest.mark.asyncio
async def test_graph_returns_buyer_reply_when_user_message_is_on_topic() -> None:
    graph = build_graph_with_reply(
        "Нам важно не сорвать внедрение.",
        topic_json='{"on_topic":"yes","confidence":0.9}',
    )
    started = await graph.ainvoke({"action": "open_session", "scenario_id": "baseline"})
    result = await graph.ainvoke(
        {
            "action": "reply_to_sales",
            "session_id": started["session_id"],
            "sales_message": "Какие у вас критерии выбора поставщика?",
        }
    )

    assert result["status"] == "active"
    assert result["dialog_route"] == "continue_with_customer_reply"
    assert result["session"].offtopic_messages_count == 0
    assert result["session"].messages[-1].content == "Нам важно не сорвать внедрение."


@pytest.mark.asyncio
async def test_graph_warns_after_first_offtopic_message() -> None:
    graph = build_graph_with_reply(
        "Не должно вызваться",
        topic_json='{"on_topic":"no","confidence":0.92}',
    )
    started = await graph.ainvoke({"action": "open_session", "scenario_id": "baseline"})
    result = await graph.ainvoke(
        {
            "action": "reply_to_sales",
            "session_id": started["session_id"],
            "sales_message": "Напиши мне рецепт борща",
        }
    )

    assert result["status"] == "active"
    assert result["dialog_route"] == "continue_after_offtopic_warning"
    assert result["session"].offtopic_messages_count == 1
    assert "вернёмся" in result["customer_message"].lower()


@pytest.mark.asyncio
async def test_graph_finishes_after_second_offtopic_message() -> None:
    graph = build_graph_with_reply(
        "Не должно вызваться",
        topic_json='{"on_topic":"no","confidence":0.92}',
    )
    started = await graph.ainvoke({"action": "open_session", "scenario_id": "baseline"})

    first = await graph.ainvoke(
        {
            "action": "reply_to_sales",
            "session_id": started["session_id"],
            "sales_message": "Расскажи анекдот",
        }
    )
    second = await graph.ainvoke(
        {
            "action": "reply_to_sales",
            "session_id": first["session_id"],
            "sales_message": "А теперь рецепт пасты",
        }
    )

    assert first["status"] == "active"
    assert second["status"] == "finished"
    assert second["dialog_route"] == "stop_after_offtopic_limit"
    assert second["session"].offtopic_messages_count == 2
    assert "заверш" in second["customer_message"].lower()
