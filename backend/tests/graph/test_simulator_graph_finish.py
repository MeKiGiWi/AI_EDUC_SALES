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
            "overall_comment": "Диалог в целом рабочий, но еще можно глубже раскрывать барьеры клиента.",
            "overall_recommendations": [
                "Глубже исследовать причины отсрочки.",
                "Яснее связывать следующий шаг с выгодой клиента.",
            ],
            "competencies": [
                {
                    "id": "questioning",
                    "name": "Умение задавать вопросы",
                    "level": "Middle",
                    "argument": "Менеджер использует открытые вопросы и держит тему разговора.",
                    "evidence_quotes": ["Что сейчас мешает вам двигаться дальше по проекту?"],
                    "missing_to_next_level": "Нужно чаще связывать вопросы с метриками и рисками.",
                    "recommendations": ["Уточнять последствия.", "Проверять бизнес-контекст."],
                },
                {
                    "id": "need_diagnosis",
                    "name": "Диагностика потребности",
                    "level": "Middle",
                    "argument": "Менеджер уточняет природу проблемы и последствия бездействия.",
                    "evidence_quotes": ["Какой риск для производства самый чувствительный?"],
                    "missing_to_next_level": "Нужно прояснять круг участников решения.",
                    "recommendations": ["Уточнять критерии выбора.", "Проверять масштаб проблемы."],
                },
                {
                    "id": "value_through_benefit",
                    "name": "Формулировка ценности через выгоду",
                    "level": "Junior",
                    "argument": "Ценность решения пока звучит слишком общо.",
                    "evidence_quotes": ["Мы можем быстро подключить инженера к обсуждению."],
                    "missing_to_next_level": "Нужно яснее переводить предложение в пользу для клиента.",
                    "recommendations": ["Говорить через выгоду.", "Связывать шаг с рисками клиента."],
                },
                {
                    "id": "think_it_over_objection",
                    "name": "Работа с возражением «подумаю / не сейчас»",
                    "level": "Junior",
                    "argument": "Причина отсрочки раскрыта частично.",
                    "evidence_quotes": ["Что именно вам нужно дополнительно обдумать?"],
                    "missing_to_next_level": "Нужно различать риск внедрения, приоритет и бюджет.",
                    "recommendations": ["Уточнять истинную причину.", "Проверять барьер без давления."],
                },
                {
                    "id": "next_step_fixation",
                    "name": "Фиксация следующего шага",
                    "level": "Senior",
                    "argument": "Менеджер предложил конкретный следующий шаг и обозначил срок.",
                    "evidence_quotes": ["Давайте согласуем короткую встречу на следующей неделе."],
                    "missing_to_next_level": "Поддерживать стабильность сильного навыка.",
                    "recommendations": ["Сохранять конкретику.", "Проверять полезность шага."],
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


async def _start_and_send_three_turns(graph):
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
async def test_finish_before_min_turns_returns_status_needs_more_dialogue_and_no_evaluation() -> None:
    graph, _ = build_graph(["Клиенту пока неясно, как это скажется на сроках."])
    started = await graph.ainvoke(
        {
            "action": "start",
            "scenario_id": "production-cooling",
            "user_id": "user-1",
            "tenant_id": "tenant-1",
        }
    )
    await graph.ainvoke(
        {
            "action": "send_message",
            "session_id": started["session_id"],
            "learner_message": "Что сейчас мешает вам двигаться дальше по проекту?",
        }
    )

    result = await graph.ainvoke(
        {
            "action": "finish",
            "session_id": started["session_id"],
        }
    )

    assert result["status"] == "needs_more_dialogue"
    assert result.get("evaluation_result") is None
    assert result.get("report_payload") is None


@pytest.mark.asyncio
async def test_finish_after_min_turns_calls_evaluation_agent_and_report_builder() -> None:
    llm_responses = [
        "Пока для нас главный риск - не сорвать график производства.",
        "Да, риск простоев для нас очень чувствителен.",
        "Короткую встречу можно обсудить, если она будет предметной.",
        valid_evaluation_json(),
    ]
    graph, deps = build_graph(llm_responses)
    session_id = await _start_and_send_three_turns(graph)

    result = await graph.ainvoke({"action": "finish", "session_id": session_id})

    assert result["status"] == "finished"
    assert result["evaluation_result"].overall_level == "Middle"
    assert result["report_payload"].type == "simulator_report"
    assert session_id in deps.report_repo.saved
