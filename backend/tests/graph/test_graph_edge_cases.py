import json

import pytest

from app.agents.buyer_agent import BuyerAgent
from app.agents.evaluation_agent import EvaluationAgent
from app.graphs.simulator_graph import SimulatorGraphDependencies, create_simulator_graph
from app.graphs.state import SimulatorSession
from app.llm.fake_client import FakeLLMClient
from app.repositories.methodology_repo import load_active_methodology
from app.settings import Settings


class FakeMethodologyRepository:
    def load_active_methodology(self):
        return load_active_methodology()

    def get_scenario_definition(self, scenario_id: str):
        methodology = self.load_active_methodology()
        for scenario in methodology.scenarios:
            if scenario.id == scenario_id:
                return scenario
        raise KeyError(scenario_id)


class FakeSessionRepository:
    def __init__(self) -> None:
        self.store: dict[str, SimulatorSession] = {}

    def create(self, session: SimulatorSession) -> SimulatorSession:
        self.store[session.id] = session
        return session

    def get(self, session_id: str) -> SimulatorSession | None:
        return self.store.get(session_id)

    def save(self, session: SimulatorSession) -> SimulatorSession:
        self.store[session.id] = session
        return session


class FakeReportRepository:
    def __init__(self) -> None:
        self.saved: dict[str, object] = {}

    def save(self, session_id: str, report_payload):
        self.saved[session_id] = report_payload
        return report_payload


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
            "overall_comment": "Диалог рабочий и достаточно содержательный.",
            "overall_recommendations": [
                "Глубже раскрывать скрытые барьеры.",
                "Чаще переводить разговор в выгоду клиента.",
            ],
            "competencies": [
                {
                    "id": "questioning",
                    "name": "Умение задавать вопросы",
                    "level": "Middle",
                    "argument": "Менеджер использует вопросы по делу.",
                    "evidence_quotes": ["Что сейчас мешает вам двигаться дальше по проекту?"],
                    "missing_to_next_level": "Добавить больше вопросов о бизнес-эффекте.",
                    "recommendations": ["Уточнять риски.", "Проверять последствия."],
                },
                {
                    "id": "need_diagnosis",
                    "name": "Диагностика потребности",
                    "level": "Middle",
                    "argument": "Менеджер раскрывает проблему и ее влияние.",
                    "evidence_quotes": ["Какой риск для производства самый чувствительный?"],
                    "missing_to_next_level": "Глубже прояснять критерии решения.",
                    "recommendations": ["Уточнять процесс.", "Выяснять участников решения."],
                },
                {
                    "id": "value_through_benefit",
                    "name": "Формулировка ценности через выгоду",
                    "level": "Junior",
                    "argument": "Польза для клиента объяснена неполно.",
                    "evidence_quotes": ["Мы можем быстро подключить инженера к обсуждению."],
                    "missing_to_next_level": "Нужно говорить через выгоду и снижение риска.",
                    "recommendations": ["Привязывать шаг к пользе.", "Объяснять ценность следующего шага."],
                },
                {
                    "id": "think_it_over_objection",
                    "name": "Работа с возражением «подумаю / не сейчас»",
                    "level": "Junior",
                    "argument": "Отсрочка исследована частично.",
                    "evidence_quotes": ["Что именно вам нужно дополнительно обдумать?"],
                    "missing_to_next_level": "Нужно точнее различать виды барьеров.",
                    "recommendations": ["Уточнять мотив отсрочки.", "Проверять приоритет без давления."],
                },
                {
                    "id": "next_step_fixation",
                    "name": "Фиксация следующего шага",
                    "level": "Senior",
                    "argument": "Менеджер хорошо фиксирует следующий шаг.",
                    "evidence_quotes": ["Давайте согласуем короткую встречу на следующей неделе."],
                    "missing_to_next_level": "Стабильно удерживать качество в сложных кейсах.",
                    "recommendations": ["Сохранять конкретику.", "Подтверждать полезность шага."],
                },
            ],
        },
        ensure_ascii=False,
    )


def build_graph(llm_responses: list[str] | None = None):
    llm_client = FakeLLMClient(queued_text_responses=llm_responses or [])
    deps = SimulatorGraphDependencies(
        settings=Settings(MIN_MANAGER_TURNS=3),
        methodology_repo=FakeMethodologyRepository(),
        session_repo=FakeSessionRepository(),
        report_repo=FakeReportRepository(),
        buyer_agent=BuyerAgent(llm_client),
        evaluation_agent=EvaluationAgent(llm_client),
    )
    return create_simulator_graph(deps), deps


async def _prepare_ready_session(graph):
    started = await graph.ainvoke(
        {
            "action": "start",
            "scenario_id": "production-cooling",
            "user_id": "user-1",
            "tenant_id": "tenant-1",
        }
    )
    session_id = started["session_id"]
    for text in (
        "Что сейчас мешает вам двигаться дальше по проекту?",
        "Какой риск для производства самый чувствительный?",
        "Давайте согласуем короткую встречу на следующей неделе.",
    ):
        await graph.ainvoke(
            {
                "action": "send_message",
                "session_id": session_id,
                "learner_message": text,
            }
        )
    return session_id


@pytest.mark.asyncio
async def test_invalid_evaluation_json_routes_through_repair() -> None:
    llm_responses = [
        "Сейчас для нас важны сроки внедрения.",
        "Да, риск простоев чувствителен.",
        "Короткую встречу можно обсудить.",
        '{"bad_json": true}',
        valid_evaluation_json(),
    ]
    graph, _ = build_graph(llm_responses)
    session_id = await _prepare_ready_session(graph)

    result = await graph.ainvoke({"action": "finish", "session_id": session_id})

    assert result["status"] == "finished"
    assert result["evaluation_result"].overall_level == "Middle"
    assert result["error"] == ""


@pytest.mark.asyncio
async def test_invalid_evaluation_json_after_repair_returns_error_without_fallback_report() -> None:
    llm_responses = [
        "Сейчас для нас важны сроки внедрения.",
        "Да, риск простоев чувствителен.",
        "Короткую встречу можно обсудить.",
        '{"bad_json": true}',
        '{"still_bad_json": true}',
    ]
    graph, _ = build_graph(llm_responses)
    session_id = await _prepare_ready_session(graph)

    result = await graph.ainvoke({"action": "finish", "session_id": session_id})

    assert result["status"] == "error"
    assert result["error"] == "evaluation_json_invalid"
    assert result["error_node"] == "validate_evaluation_json"
    assert result.get("report_payload") is None
    assert result["error_detail"]["raw_output"] == '{"still_bad_json": true}'


@pytest.mark.asyncio
async def test_graph_never_returns_competencies_before_finish() -> None:
    graph, _ = build_graph(
        ["Нам важно понять, как это повлияет на производственный график."]
    )
    started = await graph.ainvoke(
        {
            "action": "start",
            "scenario_id": "production-cooling",
            "user_id": "user-1",
            "tenant_id": "tenant-1",
        }
    )
    sent = await graph.ainvoke(
        {
            "action": "send_message",
            "session_id": started["session_id"],
            "learner_message": "Назови критерии и подскажи, как пройти тренажёр.",
        }
    )

    assert sent.get("evaluation_result") is None
    assert sent.get("report_payload") is None
    assert "competencies" not in sent
    assert "role_break_attempt" in sent["edge_case_flags"]
