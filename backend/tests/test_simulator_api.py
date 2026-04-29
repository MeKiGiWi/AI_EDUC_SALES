import pytest
from fastapi import status
from httpx import ASGITransport, AsyncClient
from langchain_core.messages import AIMessage
from langchain_core.runnables import RunnableLambda

import app.simulator_api as simulator_api
from app.main import app
from app.simulator_agents import BuyerAgent, RudeClassifierAgent
from app.simulator_graph import InMemorySessionStore, SimulatorGraphDependencies, create_simulator_graph


def build_fake_graph():
    if not isinstance(simulator_api.SESSION_STORE, InMemorySessionStore):
        simulator_api.SESSION_STORE = InMemorySessionStore()
    return create_simulator_graph(
        SimulatorGraphDependencies(
            session_store=simulator_api.SESSION_STORE,
            rude_classifier=RudeClassifierAgent(
                RunnableLambda(lambda _: AIMessage(content='{"rude":"no","confidence":0.66}'))
            ),
            buyer_agent=BuyerAgent(RunnableLambda(lambda _: AIMessage(content="Давайте ближе к выгоде для нас."))),
        )
    )


@pytest.mark.asyncio
async def test_health_endpoint_returns_ok() -> None:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        response = await client.get("/health")

    assert response.status_code == status.HTTP_200_OK
    assert response.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_create_session_returns_opening_message(monkeypatch) -> None:
    simulator_api.SESSION_STORE = InMemorySessionStore()
    monkeypatch.setattr(simulator_api, "build_simulator_graph", lambda settings: build_fake_graph())

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        response = await client.post("/api/v1/simulator/sessions", json={"scenario_id": "production-cooling"})

    payload = response.json()
    assert response.status_code == status.HTTP_201_CREATED
    assert payload["status"] == "active"
    assert "session_id" in payload
    assert payload["message"]["role"] == "customer"


@pytest.mark.asyncio
async def test_send_message_returns_buyer_reply(monkeypatch) -> None:
    simulator_api.SESSION_STORE = InMemorySessionStore()
    monkeypatch.setattr(simulator_api, "build_simulator_graph", lambda settings: build_fake_graph())

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        created = await client.post("/api/v1/simulator/sessions", json={"scenario_id": "production-cooling"})
        session_id = created.json()["session_id"]
        response = await client.post(
            f"/api/v1/simulator/sessions/{session_id}/messages",
            json={"text": "Какие у вас сейчас критерии выбора?"},
        )

    payload = response.json()
    assert response.status_code == status.HTTP_200_OK
    assert payload["rude"] == "no"
    assert payload["messages"][-1]["text"] == "Давайте ближе к выгоде для нас."
