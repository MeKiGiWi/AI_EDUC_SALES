import pytest

from app.agents.buyer_agent import BuyerAgent
from app.agents.evaluation_agent import EvaluationAgent
from app.graphs.simulator_graph import SimulatorGraphDependencies, create_simulator_graph
from app.graphs.state import SimulatorSession
from app.llm.fake_client import FakeLLMClient
from app.repositories.methodology_repo import load_active_methodology
from app.services.report_service import build_report_payload
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


@pytest.mark.asyncio
async def test_start_creates_session_and_customer_opening_message() -> None:
    graph, deps = build_graph()

    result = await graph.ainvoke(
        {
            "action": "start",
            "scenario_id": "production-cooling",
            "user_id": "user-1",
            "tenant_id": "tenant-1",
        }
    )

    assert result["status"] == "session_started"
    assert result["session_id"] in deps.session_repo.store
    assert len(result["messages"]) == 1
    assert result["messages"][0].role == "customer"


@pytest.mark.asyncio
async def test_send_message_stores_learner_and_customer_messages() -> None:
    graph, deps = build_graph(
        ["Сейчас для нас важно понять, как это повлияет на сроки производства."]
    )
    started = await graph.ainvoke(
        {
            "action": "start",
            "scenario_id": "production-cooling",
            "user_id": "user-1",
            "tenant_id": "tenant-1",
        }
    )

    result = await graph.ainvoke(
        {
            "action": "send_message",
            "session_id": started["session_id"],
            "learner_message": "Что сейчас для вас главный риск по этому проекту?",
        }
    )

    assert result["status"] == "dialogue_continues"
    assert result["messages"][-2].role == "learner"
    assert result["messages"][-1].role == "customer"
    assert result.get("evaluation_result") is None


@pytest.mark.asyncio
async def test_buyer_output_is_not_evaluated_during_send_message() -> None:
    graph, _ = build_graph(
        ["Нам нужно понять, не сорвет ли внедрение производственный график."]
    )
    started = await graph.ainvoke(
        {
            "action": "start",
            "scenario_id": "production-cooling",
            "user_id": "user-1",
            "tenant_id": "tenant-1",
        }
    )

    result = await graph.ainvoke(
        {
            "action": "send_message",
            "session_id": started["session_id"],
            "learner_message": "Мы предлагаем решение, которое снизит перегрев.",
        }
    )

    assert result.get("evaluation_result") is None
    assert result.get("report_payload") is None
    assert "competencies" not in result


@pytest.mark.asyncio
async def test_invalid_buyer_reply_returns_graph_error() -> None:
    graph, _ = build_graph(['{"criteria":["leak"]}', '# leaked heading'])
    started = await graph.ainvoke(
        {
            "action": "start",
            "scenario_id": "production-cooling",
            "user_id": "user-1",
            "tenant_id": "tenant-1",
        }
    )

    result = await graph.ainvoke(
        {
            "action": "send_message",
            "session_id": started["session_id"],
            "learner_message": "Что сейчас мешает вам двигаться дальше по проекту?",
        }
    )

    assert result["status"] == "error"
    assert result["error"] == "buyer_reply_invalid"
    assert result["error_node"] == "validate_buyer_reply"
    assert result["error_detail"]["raw_output"] == "# leaked heading"


@pytest.mark.asyncio
async def test_debug_disabled_does_not_collect_debug_steps() -> None:
    graph, _ = build_graph(["Сейчас для нас важно понять, как это повлияет на сроки производства."])
    started = await graph.ainvoke(
        {
            "action": "start",
            "scenario_id": "production-cooling",
            "user_id": "user-1",
            "tenant_id": "tenant-1",
            "debug_enabled": False,
            "debug_steps": [],
        }
    )

    result = await graph.ainvoke(
        {
            "action": "send_message",
            "session_id": started["session_id"],
            "learner_message": "Что сейчас для вас главный риск по этому проекту?",
            "debug_enabled": False,
            "debug_steps": [],
        }
    )

    assert result.get("debug_steps") in (None, [])


@pytest.mark.asyncio
async def test_debug_enabled_collects_buyer_agent_trace_on_send_message() -> None:
    graph, _ = build_graph(["Сейчас для нас важно понять, как это повлияет на сроки производства."])
    started = await graph.ainvoke(
        {
            "action": "start",
            "scenario_id": "production-cooling",
            "user_id": "user-1",
            "tenant_id": "tenant-1",
            "debug_enabled": True,
            "debug_steps": [],
        }
    )

    result = await graph.ainvoke(
        {
            "action": "send_message",
            "session_id": started["session_id"],
            "learner_message": "Что сейчас для вас главный риск по этому проекту?",
            "debug_enabled": True,
            "debug_steps": [],
        }
    )

    debug_steps = result["debug_steps"]
    buyer_step = next(step for step in debug_steps if step["node"] == "run_buyer_agent")
    assert buyer_step["agent"] == "buyer_agent"
    assert buyer_step["status"] == "completed"
    assert buyer_step["prompt"]
    assert buyer_step["system_prompt"]
    assert buyer_step["raw_output"] == "Сейчас для нас важно понять, как это повлияет на сроки производства."
    assert buyer_step["parsed_output"]["validated_output"] == (
        "Сейчас для нас важно понять, как это повлияет на сроки производства."
    )
