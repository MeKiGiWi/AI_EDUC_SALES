import pytest
from fastapi import status
from httpx import ASGITransport, AsyncClient
from langchain_core.messages import AIMessage
from langchain_core.runnables import RunnableLambda

import app.api as simulator_api
import app.runtime as simulator_runtime
from app.agents import BuyerAgent, RudeClassifierAgent
from app.graph import create_graph
from app.main import app
from app.models import GraphDependencies
from app.prompts import BASELINE_OPENING_MESSAGE
from app.store import InMemorySessionStore


def build_fake_graph(reply_text: str = "Давайте ближе к выгоде для нас."):
    if not isinstance(simulator_runtime.SESSION_STORE, InMemorySessionStore):
        simulator_runtime.SESSION_STORE = InMemorySessionStore()
    simulator_api.SESSION_STORE = simulator_runtime.SESSION_STORE
    return create_graph(
        GraphDependencies(
            session_store=simulator_runtime.SESSION_STORE,
            rude_classifier=RudeClassifierAgent(
                RunnableLambda(lambda _: AIMessage(content='{"rude":"no","confidence":0.66}'))
            ),
            buyer_agent=BuyerAgent(RunnableLambda(lambda _: AIMessage(content=reply_text))),
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
    simulator_runtime.SESSION_STORE = InMemorySessionStore()
    monkeypatch.setattr(simulator_api, "SESSION_STORE", simulator_runtime.SESSION_STORE)
    monkeypatch.setattr(simulator_api, "build_graph", lambda settings: build_fake_graph())

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        response = await client.post("/api/v1/simulator/sessions", json={"scenario_id": "baseline"})

    payload = response.json()
    assert response.status_code == status.HTTP_201_CREATED
    assert payload["status"] == "active"
    assert "session_id" in payload
    assert payload["message"]["role"] == "customer"
    assert payload["message"]["text"] == BASELINE_OPENING_MESSAGE


@pytest.mark.asyncio
async def test_get_scenarios_returns_baseline() -> None:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        response = await client.get("/api/v1/simulator/scenarios")

    payload = response.json()
    assert response.status_code == status.HTTP_200_OK
    assert any(item["id"] == "baseline" for item in payload["items"])


@pytest.mark.asyncio
async def test_create_session_with_unknown_scenario_returns_404(monkeypatch) -> None:
    simulator_runtime.SESSION_STORE = InMemorySessionStore()
    monkeypatch.setattr(simulator_api, "SESSION_STORE", simulator_runtime.SESSION_STORE)
    monkeypatch.setattr(simulator_api, "build_graph", lambda settings: build_fake_graph())

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        response = await client.post("/api/v1/simulator/sessions", json={"scenario_id": "unknown-scenario"})

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["detail"] == "Сценарий не найден."


@pytest.mark.asyncio
async def test_send_message_returns_buyer_reply(monkeypatch) -> None:
    simulator_runtime.SESSION_STORE = InMemorySessionStore()
    monkeypatch.setattr(simulator_api, "SESSION_STORE", simulator_runtime.SESSION_STORE)
    monkeypatch.setattr(
        simulator_api,
        "build_graph",
        lambda settings: build_fake_graph("Давайте ближе к выгоде для нас."),
    )

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        created = await client.post("/api/v1/simulator/sessions", json={"scenario_id": "baseline"})
        session_id = created.json()["session_id"]
        response = await client.post(
            f"/api/v1/simulator/sessions/{session_id}/messages",
            json={"text": "Какие у вас сейчас критерии выбора?"},
        )

    payload = response.json()
    assert response.status_code == status.HTTP_200_OK
    assert payload["rude"] == "no"
    assert payload["status"] == "active"
    assert payload["messages"][-1]["text"] == "Давайте ближе к выгоде для нас."


@pytest.mark.asyncio
async def test_send_message_stays_active_even_for_refusal_text(monkeypatch) -> None:
    simulator_runtime.SESSION_STORE = InMemorySessionStore()
    monkeypatch.setattr(simulator_api, "SESSION_STORE", simulator_runtime.SESSION_STORE)
    monkeypatch.setattr(
        simulator_api,
        "build_graph",
        lambda settings: build_fake_graph("Не актуально, мы уже выбрали другого."),
    )

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        created = await client.post("/api/v1/simulator/sessions", json={"scenario_id": "baseline"})
        session_id = created.json()["session_id"]
        response = await client.post(
            f"/api/v1/simulator/sessions/{session_id}/messages",
            json={"text": "Могу предложить решение."},
        )

    payload = response.json()
    assert response.status_code == status.HTTP_200_OK
    assert payload["status"] == "active"
