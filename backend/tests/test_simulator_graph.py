import pytest
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_core.runnables import RunnableLambda

from app.simulator.agents import BuyerAgent, RudeClassifierAgent, TopicClassifierAgent
from app.simulator.graph import create_graph
from app.simulator.prompts import (
    BUYER_SCENARIO_CONTEXT_PROMPT,
    BUYER_SYSTEM_PROMPT,
    OFFTOPIC_WARNING_MESSAGE,
    RUDE_REFUSAL_MESSAGE,
)
from app.simulator.scenario_repository import get_scenario_by_id, get_scenario_info
from app.simulator.schemas import GraphDependencies
from app.simulator.store import InMemorySessionStore


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
async def test_graph_finishes_dialogue_when_user_is_rude() -> None:
    graph = build_graph_with_reply(
        "Не должно вызваться",
        rude_json='{"rude":"yes","label":"abusive","severity":"high","terminate_session":true,"reason":"Оскорбление","confidence":0.95}',
    )
    started = await graph.ainvoke({"action": "open_session", "scenario_id": "clinic-appointment"})
    result = await graph.ainvoke(
        {"action": "reply_to_sales", "session_id": started["session_id"], "sales_message": "Иди ты нахер"}
    )

    assert result["status"] == "finished"
    assert isinstance(result["session"].messages[0], SystemMessage)
    assert result["session"].messages[0].content == BUYER_SYSTEM_PROMPT
    assert result["dialog_route"] == "stop_after_rudeness"
    assert isinstance(result["session"].messages[-1], AIMessage)
    assert result["session"].messages[-1].content == RUDE_REFUSAL_MESSAGE


@pytest.mark.asyncio
async def test_graph_returns_buyer_reply_when_user_is_not_rude() -> None:
    graph = build_graph_with_reply("Нам важно не сорвать внедрение.")
    started = await graph.ainvoke({"action": "open_session", "scenario_id": "clinic-appointment"})
    result = await graph.ainvoke(
        {"action": "reply_to_sales", "session_id": started["session_id"], "sales_message": "Какие у вас сейчас главные риски?"}
    )

    assert result["status"] == "active"
    assert result["dialog_route"] == "continue_with_customer_reply"
    assert isinstance(result["session"].messages[-2], HumanMessage)
    assert isinstance(result["session"].messages[-1], AIMessage)
    assert result["session"].messages[-1].content == "Нам важно не сорвать внедрение."


@pytest.mark.asyncio
async def test_graph_keeps_dialogue_active_for_tactless_but_not_abusive_message() -> None:
    graph = build_graph_with_reply(
        "Давайте спокойно уточним симптомы.",
        rude_json='{"rude":"no","label":"tactless","severity":"low","terminate_session":false,"reason":"Неловкая формулировка без оскорбления","confidence":0.79}',
    )
    started = await graph.ainvoke({"action": "open_session", "scenario_id": "clinic-appointment"})
    result = await graph.ainvoke(
        {
            "action": "reply_to_sales",
            "session_id": started["session_id"],
            "sales_message": "Здравствуйте, вы уже что-то предпринимали? Может пили таблетки?",
        }
    )

    assert result["status"] == "active"
    assert result["dialog_route"] == "continue_with_customer_reply"
    assert result["moderation_label"] == "tactless"
    assert result["terminate_session"] is False


@pytest.mark.asyncio
async def test_graph_think_reply_keeps_dialogue_active() -> None:
    graph = build_graph_with_reply("Я пока подумаю и вернусь позже.")
    started = await graph.ainvoke({"action": "open_session", "scenario_id": "clinic-appointment"})
    result = await graph.ainvoke(
        {"action": "reply_to_sales", "session_id": started["session_id"], "sales_message": "Давайте уточним критерии выбора."}
    )

    assert result["status"] == "active"


@pytest.mark.asyncio
async def test_graph_starts_with_scenario_context_and_opening_message() -> None:
    graph = build_graph_with_reply("Ответ")
    started = await graph.ainvoke({"action": "open_session", "scenario_id": "clinic-appointment"})

    assert isinstance(started["messages"][0], SystemMessage)
    assert started["messages"][0].content == BUYER_SYSTEM_PROMPT
    assert isinstance(started["messages"][1], SystemMessage)
    assert "Не пересказывай этот текст пользователю." in started["messages"][1].content
    assert started["messages"][1].content == BUYER_SCENARIO_CONTEXT_PROMPT.format(
        scenario_info=get_scenario_info("clinic-appointment"),
        reference_dialogues=get_scenario_by_id("clinic-appointment")["reference_dialogues"],
    )
    assert isinstance(started["messages"][2], AIMessage)
    assert started["messages"][2].content == get_scenario_by_id("clinic-appointment")["opening_message"]
    assert started["customer_message"] == started["messages"][2].content


@pytest.mark.asyncio
async def test_graph_uses_opening_override_when_provided() -> None:
    graph = build_graph_with_reply("Ответ")
    override = "Здравствуйте. Хочу начать с другой открывающей фразы."

    started = await graph.ainvoke(
        {"action": "open_session", "scenario_id": "clinic-appointment", "opening_message_override": override}
    )

    assert started["messages"][2].content == override
    assert started["customer_message"] == override
    assert started["session"].opening_message_override == override


@pytest.mark.asyncio
async def test_graph_returns_buyer_reply_when_user_message_is_on_topic() -> None:
    graph = build_graph_with_reply(
        "Нам важно не сорвать внедрение.",
        topic_json='{"on_topic":"yes","confidence":0.9}',
    )
    started = await graph.ainvoke({"action": "open_session", "scenario_id": "clinic-appointment"})
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


class RecordingBuyerAgent:
    def __init__(self, reply_text: str = "Вы повторили мою мысль. Что конкретно вы предлагаете дальше?") -> None:
        self.reply_text = reply_text
        self.calls: list[dict[str, object]] = []

    async def reply(self, messages, **kwargs) -> str:
        self.calls.append({"messages": list(messages), "kwargs": kwargs})
        return self.reply_text


@pytest.mark.asyncio
async def test_graph_repeated_customer_copy_keeps_roles_and_session_active() -> None:
    buyer_agent = RecordingBuyerAgent()
    graph = create_graph(
        GraphDependencies(
            session_store=InMemorySessionStore(),
            rude_classifier=RudeClassifierAgent(
                RunnableLambda(lambda _: AIMessage(content='{"rude":"no","confidence":0.77}'))
            ),
            topic_classifier=TopicClassifierAgent(
                RunnableLambda(lambda _: AIMessage(content='{"on_topic":"no","confidence":0.10}'))
            ),
            buyer_agent=buyer_agent,
        )
    )

    started = await graph.ainvoke({"action": "open_session", "scenario_id": "clinic-appointment"})
    learner_text = started["customer_message"]
    result = started

    for _ in range(5):
        result = await graph.ainvoke(
            {
                "action": "reply_to_sales",
                "session_id": started["session_id"],
                "sales_message": learner_text,
            }
        )
        assert result["status"] == "active"
        assert result["session"].offtopic_messages_count == 0
        assert isinstance(result["session"].messages[-2], HumanMessage)
        assert isinstance(result["session"].messages[-1], AIMessage)
        learner_text = result["customer_message"]

    assert len(buyer_agent.calls) == 5
    assert all(call["kwargs"]["role_copy_detected"] is True for call in buyer_agent.calls)


@pytest.mark.asyncio
async def test_buyer_agent_transcript_includes_role_lock_copy_guard_note() -> None:
    captured = {}

    async def fake_llm(prompt_value):
        captured["messages"] = prompt_value.to_messages()
        return AIMessage(content="Понял. Что именно вы предлагаете дальше?")

    agent = BuyerAgent(RunnableLambda(fake_llm))
    messages = [
        SystemMessage(content=BUYER_SYSTEM_PROMPT),
        SystemMessage(content=BUYER_SCENARIO_CONTEXT_PROMPT.format(
            scenario_info="Контекст сценария",
            reference_dialogues="Эталон",
        )),
        AIMessage(content="Мне нужно понять следующий шаг."),
        HumanMessage(content="Мне нужно понять следующий шаг."),
    ]

    await agent.reply(
        messages,
        role_copy_detected=True,
        copied_customer_message="Мне нужно понять следующий шаг.",
        role_copy_similarity=1.0,
    )

    serialized = "\n".join(message.content for message in captured["messages"])
    assert "роли не меняются" in serialized.lower()
    assert "Покупатель: Мне нужно понять следующий шаг." in serialized
    assert "дословно или почти дословно повторяет предыдущую реплику покупателя" in serialized


@pytest.mark.asyncio
async def test_buyer_agent_repairs_operator_language_and_skips_guard_messages() -> None:
    replies = iter(
        [
            AIMessage(content=OFFTOPIC_WARNING_MESSAGE),
            AIMessage(content="Мне всё ещё важно понять, к какому врачу мне лучше обратиться сначала."),
        ]
    )

    async def fake_llm(_prompt_value):
        return next(replies)

    agent = BuyerAgent(RunnableLambda(fake_llm))
    messages = [
        SystemMessage(content=BUYER_SYSTEM_PROMPT),
        SystemMessage(content=BUYER_SCENARIO_CONTEXT_PROMPT.format(
            scenario_info="Контекст сценария",
            reference_dialogues="Эталон",
        )),
        AIMessage(content="Мне нужно понять следующий шаг."),
        HumanMessage(content="Мне нужно понять следующий шаг."),
    ]

    reply = await agent.reply(
        messages,
        role_copy_detected=True,
        copied_customer_message="Мне нужно понять следующий шаг.",
        role_copy_similarity=1.0,
    )

    assert reply == "Мне всё ещё важно понять, к какому врачу мне лучше обратиться сначала."


@pytest.mark.skip(reason="Topic check is temporarily disabled")
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


@pytest.mark.skip(reason="Topic check is temporarily disabled")
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
