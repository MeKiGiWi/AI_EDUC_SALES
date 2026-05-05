from datetime import datetime, timezone
from uuid import uuid4

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langgraph.graph import END, START, StateGraph

from app.models import ChatSession, GraphDependencies, GraphState
from app.prompts import (
    BASELINE_OPENING_MESSAGE,
    BUYER_SCENARIO_CONTEXT_PROMPT,
    BUYER_SYSTEM_PROMPT,
    OFFTOPIC_REFUSAL_MESSAGE,
    OFFTOPIC_WARNING_MESSAGE,
    RUDE_REFUSAL_MESSAGE,
)
from app.scenario_repository import get_scenario_by_id, get_scenario_info


def create_graph(deps: GraphDependencies):
    graph = StateGraph(GraphState)

    graph.add_node("start_session_with_opening_message", _open_new_session(deps))
    graph.add_node("load_session_for_next_action", _load_existing_session(deps))
    graph.add_node("append_sales_message_to_history", _append_sales_message(deps))
    graph.add_node("check_if_sales_message_is_rude", _classify_sales_tone(deps))
    graph.add_node("append_customer_left_message", _append_customer_left_message(deps))
    graph.add_node("check_if_sales_message_is_on_topic", _classify_sales_topic(deps))
    graph.add_node("append_customer_offtopic_warning_message", _append_customer_offtopic_warning_message(deps))
    graph.add_node("append_customer_offtopic_refusal_message", _append_customer_offtopic_refusal_message(deps))
    graph.add_node("append_customer_reply_message", _append_customer_reply_message(deps))
    graph.add_node("finish_session_now", _close_existing_session(deps))

    graph.add_conditional_edges(
        START,
        lambda state: state["action"],
        {
            "open_session": "start_session_with_opening_message",
            "reply_to_sales": "load_session_for_next_action",
            "close_session": "load_session_for_next_action",
        },
    )
    graph.add_conditional_edges(
        "load_session_for_next_action",
        lambda state: state["action"],
        {
            "reply_to_sales": "append_sales_message_to_history",
            "close_session": "finish_session_now",
        },
    )
    graph.add_edge("append_sales_message_to_history", "check_if_sales_message_is_rude")
    graph.add_conditional_edges(
        "check_if_sales_message_is_rude",
        lambda state: state["dialog_route"],
        {
            "stop_after_rudeness": "append_customer_left_message",
            "go_to_topic_check": "check_if_sales_message_is_on_topic",
        },
    )
    graph.add_conditional_edges(
        "check_if_sales_message_is_on_topic",
        lambda state: state["dialog_route"],
        {
            "continue_with_customer_reply": "append_customer_reply_message",
            "continue_after_offtopic_warning": "append_customer_offtopic_warning_message",
            "stop_after_offtopic_limit": "append_customer_offtopic_refusal_message",
        },
    )
    graph.add_edge("append_customer_offtopic_warning_message", END)
    graph.add_edge("append_customer_offtopic_refusal_message", END)
    graph.add_edge("start_session_with_opening_message", END)
    graph.add_edge("append_customer_left_message", END)
    graph.add_edge("append_customer_reply_message", END)
    graph.add_edge("finish_session_now", END)

    return graph.compile()


def _open_new_session(deps: GraphDependencies):
    def node(state: GraphState) -> GraphState:
        scenario_id = state["scenario_id"]
        scenario = get_scenario_by_id(scenario_id)
        opening_message = (
            scenario["opening_message"] if scenario is not None else BASELINE_OPENING_MESSAGE
        )
        scenario_info = get_scenario_info(scenario_id)
        if scenario_info is None:
            scenario_info = f"Сценарий: {scenario_id}. Дополнительная информация недоступна."

        messages = [
            SystemMessage(content=BUYER_SYSTEM_PROMPT),
            SystemMessage(
                content=BUYER_SCENARIO_CONTEXT_PROMPT.format(scenario_info=scenario_info)
            ),
            AIMessage(content=opening_message),
        ]
        session = ChatSession(
            id=state.get("session_id", str(uuid4())),
            scenario_id=scenario_id,
            messages=messages,
        )
        deps.session_store.create(session)
        return {
            "session_id": session.id,
            "session": session,
            "messages": messages,
            "status": session.status,
            "customer_message": opening_message,
        }

    return node


def _load_existing_session(deps: GraphDependencies):
    def node(state: GraphState) -> GraphState:
        session = deps.session_store.get(state["session_id"])
        if session is None:
            raise KeyError(f"Session '{state['session_id']}' was not found.")
        return {"session": session, "messages": list(session.messages), "status": session.status}

    return node


def _append_sales_message(deps: GraphDependencies):
    def node(state: GraphState) -> GraphState:
        new_messages = [*state["messages"], HumanMessage(content=state["sales_message"])]
        updated_session = state["session"].model_copy(update={"messages": new_messages})
        deps.session_store.save(updated_session)
        return {"session": updated_session, "messages": new_messages}

    return node


def _classify_sales_tone(deps: GraphDependencies):
    async def node(state: GraphState) -> GraphState:
        result = await deps.rude_classifier.check(state["sales_message"])
        return {
            "dialog_route": "stop_after_rudeness" if result.rude == "yes" else "go_to_topic_check",
            "confidence": result.confidence,
        }

    return node


def _append_customer_left_message(deps: GraphDependencies):
    def node(state: GraphState) -> GraphState:
        new_messages = [*state["messages"], AIMessage(content=RUDE_REFUSAL_MESSAGE)]
        updated_session = state["session"].model_copy(
            update={
                "messages": new_messages,
                "status": "finished",
            }
        )
        deps.session_store.save(updated_session)
        return {
            "session": updated_session,
            "messages": new_messages,
            "status": updated_session.status,
            "customer_message": RUDE_REFUSAL_MESSAGE,
        }

    return node


def _classify_sales_topic(deps: GraphDependencies):
    async def node(state: GraphState) -> GraphState:
        result = await deps.topic_classifier.check(
            message=state["sales_message"],
            messages=state["messages"]
        )
        session = state["session"]

        if result.on_topic == "yes":
            return {
                "dialog_route": "continue_with_customer_reply",
                "topic_confidence": result.confidence,
                "confidence": result.confidence,
            }

        offtopic_count = session.offtopic_messages_count + 1
        updated_session = session.model_copy(update={"offtopic_messages_count": offtopic_count})
        deps.session_store.save(updated_session)

        route = (
            "stop_after_offtopic_limit"
            if offtopic_count >= 2
            else "continue_after_offtopic_warning"
        )

        return {
            "session": updated_session,
            "dialog_route": route,
            "topic_confidence": result.confidence,
            "confidence": result.confidence,
        }

    return node


def _append_customer_offtopic_warning_message(deps: GraphDependencies):
    def node(state: GraphState) -> GraphState:
        warning_message = OFFTOPIC_WARNING_MESSAGE
        new_messages = [*state["messages"], AIMessage(content=warning_message)]
        updated_session = state["session"].model_copy(update={"messages": new_messages})
        deps.session_store.save(updated_session)

        return {
            "session": updated_session,
            "messages": new_messages,
            "status": updated_session.status,
            "customer_message": warning_message,
        }

    return node


def _append_customer_offtopic_refusal_message(deps: GraphDependencies):
    def node(state: GraphState) -> GraphState:
        refusal_message = OFFTOPIC_REFUSAL_MESSAGE
        new_messages = [*state["messages"], AIMessage(content=refusal_message)]
        updated_session = state["session"].model_copy(
            update={
                "messages": new_messages,
                "status": "finished",
                "completed_at": datetime.now(timezone.utc),
            }
        )
        deps.session_store.save(updated_session)

        return {
            "session": updated_session,
            "messages": new_messages,
            "status": updated_session.status,
            "customer_message": refusal_message,
        }

    return node


def _append_customer_reply_message(deps: GraphDependencies):
    async def node(state: GraphState) -> GraphState:
        reply = await deps.buyer_agent.reply(state["messages"])
        new_messages = [*state["messages"], AIMessage(content=reply)]
        update_payload = {
            "messages": new_messages,
        }
        updated_session = state["session"].model_copy(update=update_payload)
        deps.session_store.save(updated_session)
        return {
            "session": updated_session,
            "messages": new_messages,
            "status": updated_session.status,
            "customer_message": reply,
        }

    return node


def _close_existing_session(deps: GraphDependencies):
    def node(state: GraphState) -> GraphState:
        session = state["session"]
        if session.status == "finished":
            return {"session": session, "messages": list(state["messages"]), "status": session.status}

        updated_session = session.model_copy(
            update={
                "status": "finished",
                "completed_at": datetime.now(timezone.utc),
                "messages": list(state["messages"]),
            }
        )
        deps.session_store.save(updated_session)
        return {
            "session": updated_session,
            "messages": list(state["messages"]),
            "status": updated_session.status,
        }

    return node
