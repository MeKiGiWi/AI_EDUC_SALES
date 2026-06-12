import pytest
from uuid import uuid4
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_core.runnables import RunnableLambda

from app.simulator.agents import RudeCheckResult, TopicCheckResult
from app.simulator.graph import create_graph
from app.simulator.prompts import RUDE_REFUSAL_MESSAGE
from app.simulator.schemas import ChatSession, GraphDependencies, GraphState

class MockSessionStore:
    def __init__(self):
        self.sessions = {}
    def create(self, session):
        self.sessions[session.id] = session
    def get(self, session_id):
        return self.sessions.get(session_id)
    def save(self, session):
        self.sessions[session.id] = session

class MockRudeClassifier:
    def __init__(self, is_rude="no", label="allowed", terminate_session=False):
        self.is_rude = is_rude
        self.label = label
        self.terminate_session = terminate_session
        self.called = False
    async def check(self, message):
        self.called = True
        return RudeCheckResult(
            rude=self.is_rude,
            label=self.label,  # type: ignore[arg-type]
            severity="high" if self.terminate_session else "none",
            terminate_session=self.terminate_session,
            reason=message,
            confidence=1.0,
        )

class MockTopicClassifier:
    def __init__(self, on_topic="yes"):
        self.on_topic = on_topic
        self.called = False
        self.received_messages = None
    async def check(self, message, messages, *, training_context=""):
        self.called = True
        self.received_messages = messages
        return TopicCheckResult(on_topic=self.on_topic, confidence=1.0)

class MockBuyerAgent:
    def __init__(self, reply_text="Mock reply"):
        self.reply_text = reply_text
        self.called = False
        self.received_kwargs = None
    async def reply(self, messages, **kwargs):
        self.called = True
        self.received_kwargs = kwargs
        return self.reply_text

@pytest.fixture
def deps():
    return GraphDependencies(
        session_store=MockSessionStore(),
        rude_classifier=MockRudeClassifier(),
        topic_classifier=MockTopicClassifier(),
        buyer_agent=MockBuyerAgent(),
    )

@pytest.mark.asyncio
async def test_on_topic_message_flow(deps):
    graph = create_graph(deps)
    session_id = str(uuid4())
    
    # 1. Open session
    state = await graph.ainvoke({
        "action": "open_session",
        "scenario_id": "baseline",
        "session_id": session_id
    })
    
    # 2. Reply to sales (on-topic)
    deps.rude_classifier.is_rude = "no"
    deps.topic_classifier.on_topic = "yes"
    
    state = await graph.ainvoke({
        "action": "reply_to_sales",
        "session_id": session_id,
        "sales_message": "Как насчет завтра?"
    })
    
    assert deps.rude_classifier.called
    assert deps.topic_classifier.called
    assert deps.buyer_agent.called
    assert state["customer_message"] == "Mock reply"
    assert state["session"].offtopic_messages_count == 0
    assert state["status"] == "active"

@pytest.mark.asyncio
async def test_rude_message_flow(deps):
    graph = create_graph(deps)
    session_id = str(uuid4())
    
    await graph.ainvoke({
        "action": "open_session",
        "scenario_id": "baseline",
        "session_id": session_id
    })
    
    deps.rude_classifier.is_rude = "yes"
    deps.rude_classifier.label = "abusive"
    deps.rude_classifier.terminate_session = True
    
    state = await graph.ainvoke({
        "action": "reply_to_sales",
        "session_id": session_id,
        "sales_message": "Ты дурак"
    })
    
    assert deps.rude_classifier.called
    assert not deps.topic_classifier.called
    assert not deps.buyer_agent.called
    assert state["customer_message"] == RUDE_REFUSAL_MESSAGE
    assert state["status"] == "finished"
    assert state["moderation_label"] == "abusive"

@pytest.mark.asyncio
async def test_offtopic_flow_limit(deps):
    graph = create_graph(deps)
    session_id = str(uuid4())
    
    await graph.ainvoke({
        "action": "open_session",
        "scenario_id": "baseline",
        "session_id": session_id
    })
    
    deps.rude_classifier.is_rude = "no"
    deps.topic_classifier.on_topic = "no"
    
    # First offtopic
    state = await graph.ainvoke({
        "action": "reply_to_sales",
        "session_id": session_id,
        "sales_message": "Напиши код"
    })
    
    assert state["session"].offtopic_messages_count == 1
    assert "возвратимся к нашему вопросу" in state["customer_message"].lower() or "вернёмся" in state["customer_message"].lower()
    assert state["status"] == "active"
    
    # Second offtopic
    state = await graph.ainvoke({
        "action": "reply_to_sales",
        "session_id": session_id,
        "sales_message": "Еще раз напиши код"
    })
    
    assert state["session"].offtopic_messages_count == 2
    assert "завершу эту сессию" in state["customer_message"].lower()
    assert state["status"] == "finished"
    assert state["session"].completed_at is not None

@pytest.mark.asyncio
async def test_topic_classifier_receives_history(deps):
    graph = create_graph(deps)
    session_id = str(uuid4())
    
    await graph.ainvoke({
        "action": "open_session",
        "scenario_id": "baseline",
        "session_id": session_id
    })
    
    await graph.ainvoke({
        "action": "reply_to_sales",
        "session_id": session_id,
        "sales_message": "Здравствуйте"
    })
    
    # Check that topic classifier received the history (opening message + "Здравствуйте")
    # Actually, opening message is AIMessage, "Здравствуйте" is HumanMessage
    messages = deps.topic_classifier.received_messages
    assert any(isinstance(m, AIMessage) for m in messages)
    assert any(isinstance(m, HumanMessage) and m.content == "Здравствуйте" for m in messages)


@pytest.mark.asyncio
async def test_exact_customer_copy_bypasses_topic_stop_and_marks_copy_guard(deps):
    graph = create_graph(deps)
    session_id = str(uuid4())

    started = await graph.ainvoke(
        {
            "action": "open_session",
            "scenario_id": "baseline",
            "session_id": session_id,
        }
    )
    opening_message = next(message.content for message in started["messages"] if isinstance(message, AIMessage))
    deps.topic_classifier.on_topic = "no"

    state = await graph.ainvoke(
        {
            "action": "reply_to_sales",
            "session_id": session_id,
            "sales_message": opening_message,
        }
    )

    assert state["status"] == "active"
    assert state["session"].offtopic_messages_count == 0
    assert not deps.topic_classifier.called
    assert deps.buyer_agent.called
    assert state["role_copy_detected"] is True
    assert deps.buyer_agent.received_kwargs["role_copy_detected"] is True
    assert deps.buyer_agent.received_kwargs["copied_customer_message"] == opening_message
