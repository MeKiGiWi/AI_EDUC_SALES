import json

import pytest
from httpx import ASGITransport, AsyncClient

from app.agents.buyer_agent import BuyerAgent
from app.agents.evaluation_agent import EvaluationAgent
from app.api.v1 import simulator as simulator_api
from app.graphs.simulator_graph import SimulatorGraphDependencies, create_simulator_graph
from app.llm.fake_client import FakeLLMClient
from app.main import app
from app.settings import Settings, get_settings


def valid_evaluation_json() -> str:
    return json.dumps(
        {
            "schema_version": "v1",
            "validity": {
                "is_valid_for_scoring": True,
                "manager_turn_count": 3,
                "min_manager_turns": 3,
                "short_effective_exception": False,
                "limitations": [],
            },
            "overall_level": "Middle",
            "overall_comment": "Диалог достаточно содержательный для итоговой оценки.",
            "overall_recommendations": [
                "Глубже раскрывать причину отсрочки.",
                "Чаще связывать следующий шаг с выгодой клиента.",
            ],
            "competencies": [
                {
                    "id": "questioning",
                    "name": "Умение задавать вопросы",
                    "level": "Middle",
                    "argument": "Менеджер использует открытые вопросы по делу.",
                    "evidence_quotes": ["Что сейчас мешает вам двигаться дальше по проекту?"],
                    "missing_to_next_level": "Нужно чаще уточнять влияние на бизнес-метрики.",
                    "recommendations": ["Уточнять последствия.", "Проверять контекст процесса."],
                },
                {
                    "id": "need_diagnosis",
                    "name": "Диагностика потребности",
                    "level": "Middle",
                    "argument": "Менеджер раскрывает проблему и ее влияние на производство.",
                    "evidence_quotes": ["Какой риск для производства самый чувствительный?"],
                    "missing_to_next_level": "Нужно глубже прояснять участников решения.",
                    "recommendations": ["Уточнять критерии выбора.", "Проверять масштаб риска."],
                },
                {
                    "id": "value_through_benefit",
                    "name": "Формулировка ценности через выгоду",
                    "level": "Junior",
                    "argument": "Польза решения пока звучит недостаточно конкретно.",
                    "evidence_quotes": ["Мы можем быстро подключить инженера к обсуждению."],
                    "missing_to_next_level": "Нужно яснее связывать шаг с выгодой для клиента.",
                    "recommendations": ["Говорить через выгоду.", "Связывать шаг со снижением риска."],
                },
                {
                    "id": "think_it_over_objection",
                    "name": "Работа с возражением «подумаю / не сейчас»",
                    "level": "Junior",
                    "argument": "Сомнение клиента вскрыто только частично.",
                    "evidence_quotes": ["Что именно вам нужно дополнительно обдумать?"],
                    "missing_to_next_level": "Нужно лучше разделять риск, приоритет и бюджет.",
                    "recommendations": ["Уточнять барьер.", "Проверять истинную причину отсрочки."],
                },
                {
                    "id": "next_step_fixation",
                    "name": "Фиксация следующего шага",
                    "level": "Senior",
                    "argument": "Менеджер уверенно фиксирует конкретный следующий шаг.",
                    "evidence_quotes": ["Давайте согласуем короткую встречу на следующей неделе."],
                    "missing_to_next_level": "Поддерживать стабильность сильного навыка.",
                    "recommendations": ["Сохранять конкретику.", "Подтверждать полезность шага."],
                },
            ],
        },
        ensure_ascii=False,
    )


@pytest.fixture
def transport():
    yield ASGITransport(app=app)


def configure_runtime(
    monkeypatch: pytest.MonkeyPatch,
    llm_responses: list[str],
    min_turns: int = 3,
    simulator_debug_trace: bool = False,
    app_env: str = "development",
) -> None:
    llm_client = FakeLLMClient(queued_text_responses=llm_responses)
    session_repo = simulator_api.InMemorySessionRepository()
    report_repo = simulator_api.InMemoryReportRepository()
    methodology_repo = simulator_api.InMemoryMethodologyRepository()

    monkeypatch.setattr(simulator_api, "SESSION_REPO", session_repo)
    monkeypatch.setattr(simulator_api, "REPORT_REPO", report_repo)
    monkeypatch.setattr(simulator_api, "METHODOLOGY_REPO", methodology_repo)

    def _build_graph(settings: Settings):
        deps = SimulatorGraphDependencies(
            settings=settings,
            methodology_repo=methodology_repo,
            session_repo=session_repo,
            report_repo=report_repo,
            buyer_agent=BuyerAgent(llm_client),
            evaluation_agent=EvaluationAgent(llm_client),
        )
        return create_simulator_graph(deps)

    monkeypatch.setattr(simulator_api, "build_simulator_graph", _build_graph)
    app.dependency_overrides[get_settings] = lambda: Settings(
        MIN_MANAGER_TURNS=min_turns,
        SIMULATOR_DEBUG_TRACE=simulator_debug_trace,
        APP_ENV=app_env,
    )

async def start_session(client: AsyncClient, debug: bool = False) -> str:
    response = await client.post(
        f"/api/v1/simulator/sessions{'?debug=true' if debug else ''}",
        json={"scenario_id": "production-cooling", "difficulty": "medium"},
    )
    assert response.status_code == 201
    return response.json()["session_id"]


@pytest.mark.asyncio
async def test_scenario_catalog_hides_competencies(
    transport: ASGITransport,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    configure_runtime(monkeypatch, [])
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get("/api/v1/simulator/scenarios")

    assert response.status_code == 200
    payload = response.json()
    assert payload["items"]
    first = payload["items"][0]
    assert first["customer"]["name"] == "Игорь Соколов"
    assert first["customer"]["roleTitle"] == "Руководитель производства"
    assert "target_competencies" not in first
    assert "criteria" not in first
    assert "suggestedActions" not in first
    assert "quickReplies" not in first
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_start_session_returns_opening_message(
    transport: ASGITransport,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    configure_runtime(monkeypatch, [])
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.post(
            "/api/v1/simulator/sessions",
            json={"scenario_id": "production-cooling", "difficulty": "medium"},
        )

    assert response.status_code == 201
    payload = response.json()
    assert payload["status"] == "active"
    assert payload["message"]["role"] == "customer"
    assert payload["manager_turn_count"] == 0
    assert payload["can_finish"] is False
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_send_message_returns_customer_reply(
    transport: ASGITransport,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    configure_runtime(monkeypatch, ["Для нас сейчас критичны сроки внедрения."])
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        session_id = await start_session(client)
        response = await client.post(
            f"/api/v1/simulator/sessions/{session_id}/messages",
            json={"text": "Что сейчас для вас главный риск?"},
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "active"
    assert payload["messages"][0]["role"] == "learner"
    assert payload["messages"][1]["role"] == "customer"
    assert payload["messages"][1]["text"] == "Для нас сейчас критичны сроки внедрения."
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_finish_too_early_returns_needs_more_dialogue(
    transport: ASGITransport,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    configure_runtime(monkeypatch, ["Нам пока неясно, как это скажется на графике производства."])
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        session_id = await start_session(client)
        await client.post(
            f"/api/v1/simulator/sessions/{session_id}/messages",
            json={"text": "Что сейчас мешает вам двигаться дальше по проекту?"},
        )
        response = await client.post(f"/api/v1/simulator/sessions/{session_id}/finish")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "needs_more_dialogue"
    assert payload["manager_turn_count"] == 1
    assert payload["min_manager_turns"] == 3
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_finish_complete_session_returns_report_json(
    transport: ASGITransport,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    configure_runtime(
        monkeypatch,
        [
            "Для нас критично не сорвать производственный график.",
            "Да, риск простоев для нас очень чувствителен.",
            "Короткую встречу можно обсудить, если она будет предметной.",
            valid_evaluation_json(),
        ],
    )
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        session_id = await start_session(client)
        for text in (
            "Что сейчас мешает вам двигаться дальше по проекту?",
            "Какой риск для производства самый чувствительный?",
            "Давайте согласуем короткую встречу на следующей неделе.",
        ):
            await client.post(
                f"/api/v1/simulator/sessions/{session_id}/messages",
                json={"text": text},
            )
        response = await client.post(f"/api/v1/simulator/sessions/{session_id}/finish")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "evaluated"
    assert payload["report"]["type"] == "simulator_report"
    assert payload["report"]["visibility"] == "after_session_finish_only"
    assert len(payload["report"]["competencies"]) == 5
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_report_endpoint_returns_saved_report(
    transport: ASGITransport,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    configure_runtime(
        monkeypatch,
        [
            "Для нас критично не сорвать производственный график.",
            "Да, риск простоев для нас очень чувствителен.",
            "Короткую встречу можно обсудить, если она будет предметной.",
            valid_evaluation_json(),
        ],
    )
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        session_id = await start_session(client)
        for text in (
            "Что сейчас мешает вам двигаться дальше по проекту?",
            "Какой риск для производства самый чувствительный?",
            "Давайте согласуем короткую встречу на следующей неделе.",
        ):
            await client.post(
                f"/api/v1/simulator/sessions/{session_id}/messages",
                json={"text": text},
            )
        await client.post(f"/api/v1/simulator/sessions/{session_id}/finish")
        response = await client.get(f"/api/v1/simulator/sessions/{session_id}/report")

    assert response.status_code == 200
    payload = response.json()
    assert payload["type"] == "simulator_report"
    assert payload["metadata"]["session_id"] == session_id
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_runtime_api_without_llm_key_returns_503(
    transport: ASGITransport,
) -> None:
    app.dependency_overrides[get_settings] = lambda: Settings(
        LLM_PROVIDER="fake",
        LLM_API_KEY="",
        MIN_MANAGER_TURNS=3,
    )
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.post(
            "/api/v1/simulator/sessions",
            json={"scenario_id": "production-cooling", "difficulty": "medium"},
        )

    assert response.status_code == 503
    assert response.json()["detail"] == (
        "LLM provider is not configured. Set LLM_PROVIDER=openrouter and LLM_API_KEY."
    )
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_send_message_returns_502_with_graph_error_detail(
    transport: ASGITransport,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    configure_runtime(monkeypatch, ['{"criteria":["leak"]}', "# leaked heading"])
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        session_id = await start_session(client)
        response = await client.post(
            f"/api/v1/simulator/sessions/{session_id}/messages",
            json={"text": "Что сейчас мешает вам двигаться дальше по проекту?"},
        )

    assert response.status_code == 502
    payload = response.json()["detail"]
    assert payload["code"] == "buyer_reply_invalid"
    assert payload["node"] == "validate_buyer_reply"
    assert payload["raw_output"] == "# leaked heading"
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_finish_returns_502_when_evaluation_json_remains_invalid(
    transport: ASGITransport,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    configure_runtime(
        monkeypatch,
        [
            "Для нас критично не сорвать производственный график.",
            "Да, риск простоев для нас очень чувствителен.",
            "Короткую встречу можно обсудить, если она будет предметной.",
            '{"bad_json": true}',
            '{"still_bad_json": true}',
        ],
    )
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        session_id = await start_session(client)
        for text in (
            "Что сейчас мешает вам двигаться дальше по проекту?",
            "Какой риск для производства самый чувствительный?",
            "Давайте согласуем короткую встречу на следующей неделе.",
        ):
            await client.post(
                f"/api/v1/simulator/sessions/{session_id}/messages",
                json={"text": text},
            )
        response = await client.post(f"/api/v1/simulator/sessions/{session_id}/finish")

    assert response.status_code == 502
    payload = response.json()["detail"]
    assert payload["code"] == "evaluation_json_invalid"
    assert payload["node"] == "validate_evaluation_json"
    assert payload["raw_output"] == '{"still_bad_json": true}'
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_debug_query_returns_debug_steps_when_runtime_debug_enabled(
    transport: ASGITransport,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    configure_runtime(monkeypatch, [], simulator_debug_trace=True)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.post(
            "/api/v1/simulator/sessions?debug=true",
            json={"scenario_id": "production-cooling", "difficulty": "medium"},
        )

    assert response.status_code == 201
    payload = response.json()
    assert payload["debug_steps"]
    assert any(step["node"] == "create_opening_message" for step in payload["debug_steps"])
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_without_debug_query_response_does_not_include_debug_steps(
    transport: ASGITransport,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    configure_runtime(monkeypatch, [], simulator_debug_trace=True)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.post(
            "/api/v1/simulator/sessions",
            json={"scenario_id": "production-cooling", "difficulty": "medium"},
        )

    assert response.status_code == 201
    assert "debug_steps" not in response.json()
    app.dependency_overrides.clear()
