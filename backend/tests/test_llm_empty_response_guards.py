import logging

import pytest
from fastapi import status
from httpx import ASGITransport, AsyncClient
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_core.runnables import RunnableLambda

from app.main import app
from app.routes import simulator as simulator_api
from app.simulator import runtime as simulator_runtime
from app.simulator.agents import BuyerAgent
from app.simulator.graph import create_graph
from app.simulator.llm_guard import normalize_llm_text
from app.simulator.schemas import GraphDependencies
from app.simulator.store import InMemorySessionStore
from app.simulator.agents import RudeClassifierAgent, TopicClassifierAgent


@pytest.mark.asyncio
async def test_buyer_agent_retries_after_empty_message() -> None:
    replies = iter([AIMessage(content=""), AIMessage(content="Нужен понятный следующий шаг.")])

    agent = BuyerAgent(RunnableLambda(lambda _: next(replies)))
    messages = [
        SystemMessage(content="system"),
        SystemMessage(content="context"),
        AIMessage(content="Открывающая реплика"),
        HumanMessage(content="Что предлагаете дальше?"),
    ]

    reply = await agent.reply(messages)

    assert reply == "Нужен понятный следующий шаг."


@pytest.mark.asyncio
async def test_buyer_agent_returns_safe_fallback_after_three_empty_attempts(caplog: pytest.LogCaptureFixture) -> None:
    caplog.set_level(logging.WARNING)
    agent = BuyerAgent(RunnableLambda(lambda _: AIMessage(content="\u200b\u200c")))
    messages = [
        SystemMessage(content="system"),
        SystemMessage(content="context"),
        AIMessage(content="Открывающая реплика"),
        HumanMessage(content="Что предлагаете дальше?"),
    ]

    reply = await agent.reply(messages)

    assert reply == BuyerAgent.SAFE_FALLBACK_REPLY
    assert "empty_llm_response" in caplog.text
    assert "buyer_agent_empty_response_exhausted" in caplog.text


def test_normalize_llm_text_removes_zero_width_only_payload() -> None:
    assert normalize_llm_text("\u200b \u200c \ufeff") == ""


@pytest.mark.asyncio
async def test_send_message_route_never_returns_empty_customer_message(monkeypatch) -> None:
    simulator_runtime.SESSION_STORE = InMemorySessionStore()
    monkeypatch.setattr(simulator_api, "SESSION_STORE", simulator_runtime.SESSION_STORE)
    graph = create_graph(
        GraphDependencies(
            session_store=simulator_runtime.SESSION_STORE,
            rude_classifier=RudeClassifierAgent(
                RunnableLambda(lambda _: AIMessage(content='{"rude":"no","confidence":0.77}'))
            ),
            topic_classifier=TopicClassifierAgent(
                RunnableLambda(lambda _: AIMessage(content='{"on_topic":"yes","confidence":0.88}'))
            ),
            buyer_agent=BuyerAgent(RunnableLambda(lambda _: AIMessage(content=""))),
        )
    )
    monkeypatch.setattr(simulator_api, "build_graph", lambda: graph)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        created = await client.post("/api/v1/simulator/sessions", json={"scenario_id": "clinic-appointment"})
        session_id = created.json()["session_id"]
        response = await client.post(
            f"/api/v1/simulator/sessions/{session_id}/messages",
            json={"text": "Какие у вас критерии выбора?"},
        )

    assert response.status_code == status.HTTP_200_OK
    payload = response.json()
    customer_messages = [item for item in payload["messages"] if item["role"] == "customer"]
    assert customer_messages
    assert all(message["text"].strip() for message in customer_messages)
    assert customer_messages[-1]["text"] == BuyerAgent.SAFE_FALLBACK_REPLY
