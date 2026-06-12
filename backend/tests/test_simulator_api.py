import pytest
from fastapi import status
from httpx import ASGITransport, AsyncClient
from langchain_core.messages import AIMessage
from langchain_core.runnables import RunnableLambda

from app.main import app
from app.routes import simulator as simulator_api
from app.simulator import runtime as simulator_runtime
from app.simulator.agents import BuyerAgent, RudeClassifierAgent, TopicClassifierAgent
from app.simulator.graph import create_graph
from app.simulator.scenario_repository import get_scenario_by_id
from app.simulator.schemas import (
    CompetencyLevel,
    EvaluationCompetencyRaw,
    EvaluationResultRaw,
    GraphDependencies,
)
from app.simulator.store import InMemorySessionStore
from app.core.settings import get_agents_config, get_settings


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
            topic_classifier=TopicClassifierAgent(
                RunnableLambda(lambda _: AIMessage(content='{"on_topic":"yes","confidence":0.77}'))
            ),
            buyer_agent=BuyerAgent(RunnableLambda(lambda _: AIMessage(content=reply_text))),
        )
    )


class FakeEvaluationAgent:
    def __init__(self, expected_min_replies: int = 10) -> None:
        self.expected_min_replies = expected_min_replies

    async def evaluate(self, dialogue: str, manager_replies: int, *, min_replies: int = 10) -> EvaluationResultRaw:
        assert dialogue
        assert manager_replies >= 1
        assert min_replies == self.expected_min_replies
        return EvaluationResultRaw(
            overall_level=CompetencyLevel.MIDDLE,
            overall_comment="Диалог структурирован, но есть зоны для усиления.",
            overall_recommendations=[
                "Углублять диагностику последствий.",
                "Четче фиксировать следующий шаг.",
            ],
            competencies=[
                EvaluationCompetencyRaw(
                    name="Умение задавать вопросы",
                    level=CompetencyLevel.MIDDLE,
                    argument="Есть открытые вопросы и уточнения по контексту.",
                    quote=["Какие у вас сейчас критерии выбора?"],
                    recommendations=["Добавлять вопросы про риски и последствия."],
                ),
                EvaluationCompetencyRaw(
                    name="Диагностика потребности",
                    level=CompetencyLevel.MIDDLE,
                    argument="Выходит за рамки исходного запроса.",
                    quote=["Что для вас важно кроме цены?"],
                    recommendations=["Добавить блок про бизнесовые последствия."],
                ),
                EvaluationCompetencyRaw(
                    name="Формулировка ценности через выгоду",
                    level=CompetencyLevel.MIDDLE,
                    argument="Есть связка решения с задачей клиента.",
                    quote=["Это снизит риск простоя линии."],
                    recommendations=["Подсвечивать эффект на сроки и потери."],
                ),
                EvaluationCompetencyRaw(
                    name="Работа с возражением «подумаю / не сейчас»",
                    level=CompetencyLevel.MIDDLE,
                    argument="Отрабатывает паузу без давления.",
                    quote=["Что вам важно уточнить перед решением?"],
                    recommendations=["Уточнять критерии сравнения вариантов."],
                ),
                EvaluationCompetencyRaw(
                    name="Фиксация следующего шага",
                    level=CompetencyLevel.JUNIOR,
                    argument="Следующий шаг обозначен недостаточно конкретно.",
                    quote=["Я отправлю материалы."],
                    recommendations=["Фиксировать дату и цель созвона."],
                ),
            ],
        )


class FakeComplaintEvaluationAgent(FakeEvaluationAgent):
    async def evaluate(self, dialogue: str, manager_replies: int, *, min_replies: int = 10) -> EvaluationResultRaw:
        assert dialogue
        assert manager_replies >= 1
        assert min_replies == self.expected_min_replies
        return EvaluationResultRaw(
            overall_level=CompetencyLevel.MIDDLE,
            overall_comment="Жалоба обработана конструктивно, но следующий шаг можно закрепить точнее.",
            overall_recommendations=[
                "Сначала признавать неудобство.",
                "Фиксировать срок обратной связи.",
            ],
            competencies=[
                EvaluationCompetencyRaw(
                    name="Контакт в жалобной коммуникации",
                    level=CompetencyLevel.MIDDLE,
                    argument="Контакт спокойный и без эскалации.",
                    quote=["Понимаю ваше недовольство."],
                    recommendations=["Сохранять признание неудобства в начале ответа."],
                ),
                EvaluationCompetencyRaw(
                    name="Сбор фактов по жалобе",
                    level=CompetencyLevel.MIDDLE,
                    argument="Факты собираются по делу.",
                    quote=["Подскажите, пожалуйста, сколько вы ожидали?"],
                    recommendations=["Уточнять дату, время и участников."],
                ),
                EvaluationCompetencyRaw(
                    name="Эмпатия без обороны",
                    level=CompetencyLevel.JUNIOR,
                    argument="Можно меньше формальности и защиты.",
                    quote=["Сожалею, что вам пришлось ждать."],
                    recommendations=["Не оправдываться до разбора ситуации."],
                ),
                EvaluationCompetencyRaw(
                    name="Предложение решения по обращению",
                    level=CompetencyLevel.MIDDLE,
                    argument="Решение обозначено.",
                    quote=["Я передам обращение старшему администратору."],
                    recommendations=["Добавлять канал и срок ответа."],
                ),
                EvaluationCompetencyRaw(
                    name="Фиксация следующего шага",
                    level=CompetencyLevel.JUNIOR,
                    argument="Нужен более конкретный срок.",
                    quote=["Мы свяжемся с вами после проверки."],
                    recommendations=["Называть срок и ответственного."],
                ),
            ],
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
    monkeypatch.setattr(simulator_api, "build_graph", lambda: build_fake_graph())

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        response = await client.post("/api/v1/simulator/sessions", json={"scenario_id": "clinic-appointment"})

    payload = response.json()
    assert response.status_code == status.HTTP_201_CREATED
    assert payload["status"] == "active"
    assert "session_id" in payload
    assert payload["message"]["role"] == "customer"
    assert payload["message"]["text"] == get_scenario_by_id("clinic-appointment")["opening_message"]


@pytest.mark.asyncio
async def test_create_session_returns_opening_override_when_provided(monkeypatch) -> None:
    simulator_runtime.SESSION_STORE = InMemorySessionStore()
    monkeypatch.setattr(simulator_api, "SESSION_STORE", simulator_runtime.SESSION_STORE)
    monkeypatch.setattr(simulator_api, "build_graph", lambda: build_fake_graph())
    override = "Здравствуйте. У меня новая стартовая фраза для smoke теста."

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        response = await client.post(
            "/api/v1/simulator/sessions",
            json={"scenario_id": "clinic-appointment", "opening_message_override": override},
        )

    payload = response.json()
    assert response.status_code == status.HTTP_201_CREATED
    assert payload["message"]["text"] == override


@pytest.mark.asyncio
async def test_get_scenarios_returns_only_active_clinic_scenarios() -> None:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        response = await client.get("/api/v1/simulator/scenarios")

    payload = response.json()
    assert response.status_code == status.HTTP_200_OK
    assert [item["id"] for item in payload["items"]] == ["clinic-appointment", "clinic-complaint"]
    assert {item["id"] for item in payload["items"]}.isdisjoint(
        {
            "baseline",
            "price-objection",
            "competitor-comparison",
            "timeline-negotiation",
            "cold-call",
            "upsell",
            "customer-return",
        }
    )


@pytest.mark.asyncio
async def test_create_session_with_unknown_scenario_returns_404(monkeypatch) -> None:
    simulator_runtime.SESSION_STORE = InMemorySessionStore()
    monkeypatch.setattr(simulator_api, "SESSION_STORE", simulator_runtime.SESSION_STORE)
    monkeypatch.setattr(simulator_api, "build_graph", lambda: build_fake_graph())

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        response = await client.post("/api/v1/simulator/sessions", json={"scenario_id": "unknown-scenario"})

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["detail"] == "Сценарий не найден."


@pytest.mark.asyncio
async def test_create_session_with_inactive_legacy_scenario_returns_404(monkeypatch) -> None:
    simulator_runtime.SESSION_STORE = InMemorySessionStore()
    monkeypatch.setattr(simulator_api, "SESSION_STORE", simulator_runtime.SESSION_STORE)
    monkeypatch.setattr(simulator_api, "build_graph", lambda: build_fake_graph())

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        response = await client.post("/api/v1/simulator/sessions", json={"scenario_id": "baseline"})

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["detail"] == "Сценарий не найден."


@pytest.mark.asyncio
async def test_send_message_returns_buyer_reply(monkeypatch) -> None:
    simulator_runtime.SESSION_STORE = InMemorySessionStore()
    monkeypatch.setattr(simulator_api, "SESSION_STORE", simulator_runtime.SESSION_STORE)
    monkeypatch.setattr(
        simulator_api,
        "build_graph",
        lambda: build_fake_graph("Давайте ближе к выгоде для нас."),
    )

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        created = await client.post("/api/v1/simulator/sessions", json={"scenario_id": "clinic-appointment"})
        session_id = created.json()["session_id"]
        response = await client.post(
            f"/api/v1/simulator/sessions/{session_id}/messages",
            json={"text": "Какие у вас сейчас критерии выбора?"},
        )

    payload = response.json()
    assert response.status_code == status.HTTP_200_OK
    assert payload["rude"] == "no"
    assert payload["moderation_label"] in {"allowed", None}
    assert payload["terminate_session"] is False
    assert payload["status"] == "active"
    assert payload["messages"][-1]["text"] == "Давайте ближе к выгоде для нас."


@pytest.mark.asyncio
async def test_send_message_stays_active_even_for_refusal_text(monkeypatch) -> None:
    simulator_runtime.SESSION_STORE = InMemorySessionStore()
    monkeypatch.setattr(simulator_api, "SESSION_STORE", simulator_runtime.SESSION_STORE)
    monkeypatch.setattr(
        simulator_api,
        "build_graph",
        lambda: build_fake_graph("Не актуально, мы уже выбрали другого."),
    )

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        created = await client.post("/api/v1/simulator/sessions", json={"scenario_id": "clinic-appointment"})
        session_id = created.json()["session_id"]
        response = await client.post(
            f"/api/v1/simulator/sessions/{session_id}/messages",
            json={"text": "Могу предложить решение."},
        )

    payload = response.json()
    assert response.status_code == status.HTTP_200_OK
    assert payload["status"] == "active"


@pytest.mark.asyncio
async def test_repeated_customer_copy_keeps_api_roles_fixed(monkeypatch) -> None:
    simulator_runtime.SESSION_STORE = InMemorySessionStore()
    monkeypatch.setattr(simulator_api, "SESSION_STORE", simulator_runtime.SESSION_STORE)
    monkeypatch.setattr(
        simulator_api,
        "build_graph",
        lambda: build_fake_graph("Вы повторили мою мысль. Что конкретно вы предлагаете дальше?"),
    )

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        created = await client.post("/api/v1/simulator/sessions", json={"scenario_id": "clinic-appointment"})
        session_id = created.json()["session_id"]
        learner_text = created.json()["message"]["text"]
        last_payload = None

        for _ in range(5):
            response = await client.post(
                f"/api/v1/simulator/sessions/{session_id}/messages",
                json={"text": learner_text},
            )
            assert response.status_code == status.HTTP_200_OK
            last_payload = response.json()
            assert last_payload["status"] == "active"
            assert [message["role"] for message in last_payload["messages"]] == ["learner", "customer"]
            learner_text = last_payload["messages"][-1]["text"]

    assert last_payload is not None


@pytest.mark.asyncio
async def test_close_session_returns_raw_evaluation_payload(monkeypatch) -> None:
    simulator_runtime.SESSION_STORE = InMemorySessionStore()
    monkeypatch.setattr(simulator_api, "SESSION_STORE", simulator_runtime.SESSION_STORE)
    monkeypatch.setattr(simulator_api, "build_graph", lambda: build_fake_graph())
    monkeypatch.setattr(
        simulator_api,
        "build_evaluation_agent",
        lambda scenario_id: FakeEvaluationAgent(expected_min_replies=3),
    )
    monkeypatch.setenv("MIN_MANAGER_TURNS", "3")
    get_settings.cache_clear()
    log_calls: list[dict[str, str]] = []
    monkeypatch.setattr(
        simulator_api,
        "append_dialog_log",
        lambda **kwargs: log_calls.append(kwargs),
    )

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        created = await client.post("/api/v1/simulator/sessions", json={"scenario_id": "clinic-appointment"})
        session_id = created.json()["session_id"]
        await client.post(
            f"/api/v1/simulator/sessions/{session_id}/messages",
            json={"text": "Какие у вас сейчас критерии выбора?"},
        )
        response = await client.post(f"/api/v1/simulator/sessions/{session_id}/finish")

    payload = response.json()
    assert response.status_code == status.HTTP_200_OK
    assert payload["status"] == "finished"
    assert "report" not in payload
    assert payload["evaluation"]["overall_level"] == "Middle"
    assert payload["report_v2"]["reportVersion"] == "2.0"
    assert payload["report_v2"]["summary"]["headline"]
    assert len(payload["evaluation"]["competencies"]) == 5
    assert [item["name"] for item in payload["evaluation"]["competencies"]] == [
        "Умение установить спокойный контакт",
        "Умение задавать уточняющие вопросы по симптомам без постановки диагноза",
        "Первичная маршрутизация пациента к подходящему врачу",
        "Работа с тревогой и сомнениями пациента",
        "Фиксация следующего шага",
    ]
    assert len(log_calls) == 1
    assert log_calls[0]["model_name"] == get_agents_config().buyer_agent_llm_settings.LLM_MODEL
    assert log_calls[0]["scenario_name"] == "clinic-appointment"
    assert "Менеджер:" in log_calls[0]["dialogue"]
    get_settings.cache_clear()


@pytest.mark.asyncio
async def test_close_session_returns_report_v2_for_clinic_complaint(monkeypatch) -> None:
    simulator_runtime.SESSION_STORE = InMemorySessionStore()
    monkeypatch.setattr(simulator_api, "SESSION_STORE", simulator_runtime.SESSION_STORE)
    monkeypatch.setattr(simulator_api, "build_graph", lambda: build_fake_graph("Я передам обращение старшему администратору."))
    monkeypatch.setattr(
        simulator_api,
        "build_evaluation_agent",
        lambda scenario_id: FakeComplaintEvaluationAgent(expected_min_replies=1),
    )
    monkeypatch.setenv("MIN_MANAGER_TURNS", "1")
    get_settings.cache_clear()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        created = await client.post("/api/v1/simulator/sessions", json={"scenario_id": "clinic-complaint"})
        session_id = created.json()["session_id"]
        await client.post(
            f"/api/v1/simulator/sessions/{session_id}/messages",
            json={"text": "Понимаю ваше недовольство. Подскажите, пожалуйста, сколько вы ожидали?"},
        )
        response = await client.post(f"/api/v1/simulator/sessions/{session_id}/finish")

    payload = response.json()
    assert response.status_code == status.HTTP_200_OK
    assert payload["report_v2"]["case"]["id"] == "clinic-complaint"
    assert len(payload["report_v2"]["competencies"]) == 5
    assert all(item["id"] for item in payload["report_v2"]["competencies"])
    assert payload["report_v2"]["dialogueAnalysis"]
    assert [item["title"] for item in payload["report_v2"]["competencies"]] == [
        "Контакт в жалобной коммуникации",
        "Сбор фактов по жалобе",
        "Эмпатия без обороны",
        "Предложение решения по обращению",
        "Фиксация следующего шага",
    ]
    get_settings.cache_clear()
