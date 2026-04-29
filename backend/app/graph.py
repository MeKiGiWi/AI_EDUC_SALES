from dataclasses import dataclass
from datetime import datetime, timezone
from uuid import uuid4

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langgraph.graph import END, START, StateGraph

from app.agents import BuyerAgent, RudeClassifierAgent
from app.models import GraphState, Session
from app.prompts import BASELINE_OPENING_MESSAGE, BUYER_SYSTEM_PROMPT
from app.store import InMemorySessionStore


@dataclass
class GraphDependencies:
    session_store: InMemorySessionStore
    rude_classifier: RudeClassifierAgent
    buyer_agent: BuyerAgent


def create_graph(deps: GraphDependencies):
    graph = StateGraph(GraphState)

    graph.add_node("start_session_with_opening_message", _open_new_session(deps))
    graph.add_node("load_session_for_next_action", _load_existing_session(deps))
    graph.add_node("append_sales_message_to_history", _append_sales_message(deps))
    graph.add_node("check_if_sales_message_is_rude", _classify_sales_tone(deps))
    graph.add_node("append_customer_left_message", _append_customer_left_message(deps))
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
            "continue_with_customer_reply": "append_customer_reply_message",
        },
    )
    graph.add_edge("start_session_with_opening_message", END)
    graph.add_edge("append_customer_left_message", END)
    graph.add_edge("append_customer_reply_message", END)
    graph.add_edge("finish_session_now", END)

    return graph.compile()


def _open_new_session(deps: GraphDependencies):
    def node(state: GraphState) -> GraphState:
        messages = [
            SystemMessage(content=BUYER_SYSTEM_PROMPT),
            AIMessage(content=BASELINE_OPENING_MESSAGE),
        ]
        session = Session(
            id=state.get("session_id", str(uuid4())),
            scenario_id=state["scenario_id"],
            messages=messages,
        )
        deps.session_store.create(session)
        return {
            "session_id": session.id,
            "session": session,
            "messages": messages,
            "status": session.status,
            "customer_message": BASELINE_OPENING_MESSAGE,
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
            "dialog_route": "stop_after_rudeness" if result.rude == "yes" else "continue_with_customer_reply",
            "confidence": result.confidence,
        }

    return node


def _append_customer_left_message(deps: GraphDependencies):
    def node(state: GraphState) -> GraphState:
        new_messages = [*state["messages"], AIMessage(content="КЛИЕНТ УШЕЛ")]
        updated_session = state["session"].model_copy(
            update={
                "status": "finished",
                "completed_at": datetime.now(timezone.utc),
                "messages": new_messages,
            }
        )
        deps.session_store.save(updated_session)
        return {
            "session": updated_session,
            "messages": new_messages,
            "status": updated_session.status,
            "customer_message": "КЛИЕНТ УШЕЛ",
        }

    return node


def _append_customer_reply_message(deps: GraphDependencies):
    async def node(state: GraphState) -> GraphState:
        reply = await deps.buyer_agent.reply(state["messages"])
        new_messages = [*state["messages"], AIMessage(content=reply)]
        updated_session = state["session"].model_copy(update={"messages": new_messages})
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
        return {"session": updated_session, "messages": list(state["messages"]), "status": updated_session.status}

    return node
