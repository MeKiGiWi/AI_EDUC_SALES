import json
import logging
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Protocol
from uuid import uuid4

from langgraph.graph import END, START, StateGraph

from app.agents.buyer_agent import BuyerAgent, BuyerAgentInput, BuyerDialogTurn
from app.agents.evaluation_agent import EvaluationAgent
from app.domain.evaluation import (
    EvaluationAgentInput,
    EvaluationJsonError,
)
from app.domain.methodology import MethodologyBundle, ScenarioDefinition
from app.graphs.state import SimulatorGraphMessage, SimulatorGraphState, SimulatorSession
from app.services.report_service import (
    ScenarioReportMetadataInput,
    SessionReportMetadataInput,
    VersionMetadataInput,
    build_report_payload,
)
from app.observability.agent_prompt_logger import log_agent_prompt_call
from app.settings import Settings, get_settings


def _configure_workflow_logger() -> logging.Logger:
    workflow_logger = logging.getLogger("app.simulator.workflow")
    workflow_logger.setLevel(logging.INFO)

    has_stdout_handler = any(
        isinstance(handler, logging.StreamHandler) and getattr(handler, "stream", None) is sys.stdout
        for handler in workflow_logger.handlers
    )
    if not has_stdout_handler:
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(logging.INFO)
        handler.setFormatter(
            logging.Formatter(
                "%(asctime)s %(levelname)s %(name)s %(message)s"
            )
        )
        workflow_logger.addHandler(handler)

    workflow_logger.propagate = False
    return workflow_logger


logger = _configure_workflow_logger()


class MethodologyRepositoryProtocol(Protocol):
    def load_active_methodology(self) -> MethodologyBundle: ...

    def get_scenario_definition(self, scenario_id: str) -> ScenarioDefinition: ...


class SessionRepositoryProtocol(Protocol):
    def create(self, session: SimulatorSession) -> SimulatorSession: ...

    def get(self, session_id: str) -> SimulatorSession | None: ...

    def save(self, session: SimulatorSession) -> SimulatorSession: ...


class ReportRepositoryProtocol(Protocol):
    def save(self, session_id: str, report_payload): ...


@dataclass
class SimulatorGraphDependencies:
    settings: Settings
    methodology_repo: MethodologyRepositoryProtocol
    session_repo: SessionRepositoryProtocol
    report_repo: ReportRepositoryProtocol
    buyer_agent: BuyerAgent
    evaluation_agent: EvaluationAgent
    prompt_version: str = "evaluation_agent_v1"
    methodology_version: str = "v1"


def short_effective_dialog_precheck(messages: list[SimulatorGraphMessage]) -> bool:
    return False


def _normalize_debug_value(value: Any) -> Any:
    if value is None:
        return None
    if hasattr(value, "model_dump"):
        return value.model_dump()
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, dict):
        return {str(key): _normalize_debug_value(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [_normalize_debug_value(item) for item in value]
    return value


def append_debug_step(
    state: SimulatorGraphState,
    node: str,
    agent: str,
    status: str,
    input_summary: dict[str, Any] | str | None = None,
    prompt: str | None = None,
    system_prompt: str | None = None,
    raw_output: str | None = None,
    parsed_output: dict[str, Any] | None = None,
    error: dict[str, Any] | str | None = None,
    metadata: dict[str, Any] | None = None,
) -> dict[str, list[dict[str, Any]]]:
    log_workflow_event(
        node=node,
        agent=agent,
        status=status,
        input_summary=input_summary,
        prompt=prompt,
        system_prompt=system_prompt,
        raw_output=raw_output,
        parsed_output=parsed_output,
        error=error,
        metadata=metadata,
    )
    if not state.get("debug_enabled", False):
        return {}

    current = list(state.get("debug_steps", []))
    current.append(
        {
            "step_id": str(uuid4()),
            "ts": datetime.now(timezone.utc),
            "node": node,
            "agent": agent,
            "status": status,
            "input_summary": _normalize_debug_value(input_summary),
            "prompt": prompt,
            "system_prompt": system_prompt,
            "raw_output": raw_output,
            "parsed_output": _normalize_debug_value(parsed_output),
            "error": _normalize_debug_value(error),
            "metadata": _normalize_debug_value(metadata) or {},
        }
    )
    return {"debug_steps": current}


def log_workflow_event(
    *,
    node: str,
    agent: str,
    status: str,
    input_summary: dict[str, Any] | str | None = None,
    prompt: str | None = None,
    system_prompt: str | None = None,
    raw_output: str | None = None,
    parsed_output: dict[str, Any] | None = None,
    error: dict[str, Any] | str | None = None,
    metadata: dict[str, Any] | None = None,
) -> None:
    if not get_settings().SIMULATOR_WORKFLOW_LOG_ENABLED:
        return

    payload = {
        "node": node,
        "agent": agent,
        "status": status,
        "input_summary": _normalize_debug_value(input_summary),
        "prompt": prompt,
        "system_prompt": system_prompt,
        "raw_output": raw_output,
        "parsed_output": _normalize_debug_value(parsed_output),
        "error": _normalize_debug_value(error),
        "metadata": _normalize_debug_value(metadata) or {},
    }
    sections: list[str] = [
        f"[SIMULATOR] {node} | {agent} | {status}"
    ]

    for label in (
        "input_summary",
        "prompt",
        "system_prompt",
        "raw_output",
        "parsed_output",
        "error",
        "metadata",
    ):
        value = payload.get(label)
        if value in (None, "", {}, []):
            continue
        if isinstance(value, str):
            rendered = value
        else:
            rendered = json.dumps(value, ensure_ascii=False, indent=2, default=str)
        sections.append(f"{label}:\n{rendered}")

    logger.info(
        "\n%s\n%s",
        "=" * 72,
        "\n\n".join(sections),
    )


def _route_action_node(state: SimulatorGraphState) -> SimulatorGraphState:
    return {
        **state,
        **append_debug_step(
            state,
            node="route_action",
            agent="system",
            status="completed",
            input_summary={"action": state["action"]},
            metadata={"session_id": state.get("session_id"), "scenario_id": state.get("scenario_id")},
        ),
    }


def create_simulator_graph(deps: SimulatorGraphDependencies):
    graph = StateGraph(SimulatorGraphState)

    graph.add_node("route_action", _route_action_node)
    graph.add_node("create_session", _make_create_session_node(deps))
    graph.add_node("create_opening_message", _make_create_opening_message_node(deps))
    graph.add_node("load_session", _make_load_session_node(deps))
    graph.add_node("append_learner_message", _make_append_learner_message_node(deps))
    graph.add_node("detect_edge_cases", detect_edge_cases)
    graph.add_node("run_buyer_agent", _make_run_buyer_agent_node(deps))
    graph.add_node("validate_buyer_reply", validate_buyer_reply)
    graph.add_node("append_customer_message", _make_append_customer_message_node(deps))
    graph.add_node("check_scoring_readiness", _make_check_scoring_readiness_node(deps))
    graph.add_node("run_evaluation_agent", _make_run_evaluation_agent_node(deps))
    graph.add_node("validate_evaluation_json", _make_validate_evaluation_json_node(deps))
    graph.add_node("repair_evaluation_json", _make_repair_evaluation_json_node(deps))
    graph.add_node("build_report_json", _make_build_report_json_node(deps))
    graph.add_node("save_report", _make_save_report_node(deps))
    graph.add_node("return_needs_more_dialogue", return_needs_more_dialogue)
    graph.add_node("return_error", lambda state: state)

    graph.add_edge(START, "route_action")
    graph.add_conditional_edges(
        "route_action",
        route_action,
        {
            "start": "create_session",
            "send_message": "load_session",
            "finish": "load_session",
        },
    )

    graph.add_edge("create_session", "create_opening_message")
    graph.add_edge("create_opening_message", END)

    graph.add_conditional_edges(
        "load_session",
        lambda state: state["action"],
        {
            "send_message": "append_learner_message",
            "finish": "check_scoring_readiness",
        },
    )
    graph.add_edge("append_learner_message", "detect_edge_cases")
    graph.add_edge("detect_edge_cases", "run_buyer_agent")
    graph.add_edge("run_buyer_agent", "validate_buyer_reply")
    graph.add_conditional_edges(
        "validate_buyer_reply",
        lambda state: state["status"],
        {
            "buyer_reply_valid": "append_customer_message",
            "error": "return_error",
        },
    )
    graph.add_edge("append_customer_message", END)

    graph.add_conditional_edges(
        "check_scoring_readiness",
        lambda state: state["status"],
        {
            "needs_more_dialogue": "return_needs_more_dialogue",
            "ready_for_evaluation": "run_evaluation_agent",
        },
    )
    graph.add_edge("return_needs_more_dialogue", END)
    graph.add_edge("run_evaluation_agent", "validate_evaluation_json")
    graph.add_conditional_edges(
        "validate_evaluation_json",
        lambda state: state["status"],
        {
            "evaluation_valid": "build_report_json",
            "evaluation_invalid": "repair_evaluation_json",
            "error": "return_error",
        },
    )
    graph.add_conditional_edges(
        "repair_evaluation_json",
        lambda state: state["status"],
        {
            "evaluation_repaired": "validate_evaluation_json",
            "error": "return_error",
        },
    )
    graph.add_edge("build_report_json", "save_report")
    graph.add_edge("save_report", END)
    graph.add_edge("return_error", END)
    return graph.compile()


def route_action(state: SimulatorGraphState) -> str:
    return state["action"]


def _make_create_session_node(deps: SimulatorGraphDependencies):
    def create_session(state: SimulatorGraphState) -> SimulatorGraphState:
        methodology = deps.methodology_repo.load_active_methodology()
        scenario = deps.methodology_repo.get_scenario_definition(state["scenario_id"])
        session = SimulatorSession(
            id=state.get("session_id", str(uuid4())),
            scenario_id=scenario.id,
            user_id=state["user_id"],
            tenant_id=state["tenant_id"],
            current_stage="opening",
            min_manager_turns=deps.settings.MIN_MANAGER_TURNS,
        )
        deps.session_repo.create(session)
        return {
            "session_id": session.id,
            "session": session,
            "scenario": scenario,
            "methodology": methodology,
            "messages": session.messages,
            "manager_turn_count": 0,
            "current_stage": session.current_stage,
            "edge_case_flags": [],
            "repair_attempt_count": 0,
            "status": "session_created",
        } | append_debug_step(
            state,
            node="create_session",
            agent="system",
            status="completed",
            input_summary={
                "scenario_id": scenario.id,
                "user_id": state["user_id"],
                "tenant_id": state["tenant_id"],
            },
            metadata={
                "session_id": session.id,
                "min_manager_turns": session.min_manager_turns,
                "current_stage": session.current_stage,
            },
        )

    return create_session


def _make_create_opening_message_node(deps: SimulatorGraphDependencies):
    def create_opening_message(state: SimulatorGraphState) -> SimulatorGraphState:
        session = state["session"]
        scenario = state["scenario"]
        opening_message = SimulatorGraphMessage(
            role="customer",
            text=scenario.opening_message,
        )
        updated_session = session.model_copy(
            update={
                "messages": [*session.messages, opening_message],
                "current_stage": "discovery",
            }
        )
        deps.session_repo.save(updated_session)
        return {
            "session": updated_session,
            "messages": updated_session.messages,
            "customer_reply": opening_message.text,
            "current_stage": "discovery",
            "status": "session_started",
        } | append_debug_step(
            state,
            node="create_opening_message",
            agent="system",
            status="completed",
            input_summary={"scenario_id": scenario.id, "opening_message": scenario.opening_message},
            raw_output=opening_message.text,
            metadata={"session_id": updated_session.id, "message_id": opening_message.id},
        )

    return create_opening_message


def _make_load_session_node(deps: SimulatorGraphDependencies):
    def load_session(state: SimulatorGraphState) -> SimulatorGraphState:
        session = deps.session_repo.get(state["session_id"])
        if session is None:
            return _build_graph_error(
                state=state,
                code="session_not_found",
                message="Simulator session was not found.",
                node="load_session",
                agent="system",
                detail={"session_id": state["session_id"]},
            )
        methodology = deps.methodology_repo.load_active_methodology()
        scenario = deps.methodology_repo.get_scenario_definition(session.scenario_id)
        messages = session.messages
        manager_turn_count = _count_manager_turns(messages)
        return {
            "session": session,
            "scenario": scenario,
            "methodology": methodology,
            "messages": messages,
            "manager_turn_count": manager_turn_count,
            "current_stage": session.current_stage,
            "edge_case_flags": state.get("edge_case_flags", []),
            "repair_attempt_count": state.get("repair_attempt_count", 0),
        } | append_debug_step(
            state,
            node="load_session",
            agent="system",
            status="completed",
            input_summary={"session_id": session.id, "action": state["action"]},
            metadata={
                "scenario_id": session.scenario_id,
                "manager_turn_count": manager_turn_count,
                "message_count": len(messages),
                "current_stage": session.current_stage,
            },
        )

    return load_session


def _make_append_learner_message_node(deps: SimulatorGraphDependencies):
    def append_learner_message(state: SimulatorGraphState) -> SimulatorGraphState:
        session = state["session"]
        learner_message = SimulatorGraphMessage(role="learner", text=state["learner_message"])
        next_stage = _infer_stage(state["learner_message"], state.get("current_stage", "discovery"))
        updated_session = session.model_copy(
            update={
                "messages": [*session.messages, learner_message],
                "current_stage": next_stage,
            }
        )
        deps.session_repo.save(updated_session)
        return {
            "session": updated_session,
            "messages": updated_session.messages,
            "manager_turn_count": _count_manager_turns(updated_session.messages),
            "current_stage": next_stage,
        } | append_debug_step(
            state,
            node="append_learner_message",
            agent="system",
            status="completed",
            input_summary={"learner_message": state["learner_message"]},
            metadata={
                "session_id": updated_session.id,
                "message_id": learner_message.id,
                "current_stage": next_stage,
            },
        )

    return append_learner_message


def detect_edge_cases(state: SimulatorGraphState) -> SimulatorGraphState:
    message = state.get("learner_message", "").casefold()
    flags = list(state.get("edge_case_flags", []))
    if any(token in message for token in ("критери", "компетенц", "инструк", "тренаж")):
        flags.append("role_break_attempt")
    if any(token in message for token in ("мы предлагаем", "наше решение", "наш продукт")) and state.get(
        "manager_turn_count", 0
    ) <= 1:
        flags.append("early_presentation")
    if any(token in message for token in ("нужно сегодня", "сейчас подпис", "без вариантов")):
        flags.append("manager_pushes_too_hard")
    edge_case_flags = sorted(set(flags))

    # Build dialogue_signals for Buyer Agent fallback logic
    dialogue_signals = {
        "profanity_or_insult": any(
            token in message for token in ("сука", "бля", "идиот", "дебил", "тупой", "придурок", "мудак")
        ),
        "price_before_value": "цена" in message or "стоимость" in message or "дорого" in message,
        "repeated_pitch": False,  # Will be set by checking conversation history
        "asked_about_equipment": "оборудован" in message or "установк" in message or "что стоит" in message,
        "asked_about_peak_problem": "пик" in message or "перегрев" in message or "температур" in message,
        "scheduling_attempt": "когда удобно" in message or "встретитьс" in message or "созвонитьс" in message,
        "proposed_date_or_time": None,  # Will be extracted from conversation history
    }

    # Check for repeated pitch (manager repeating same promises)
    messages = state.get("messages", [])
    manager_messages = [m.text.casefold() for m in messages if m.role == "learner"]
    if len(manager_messages) >= 2:
        # Simple check: if last two manager messages are similar
        last_two = manager_messages[-2:]
        if len(set(last_two)) == 1 or (len(last_two[0]) > 20 and last_two[0][:20] == last_two[1][:20]):
            dialogue_signals["repeated_pitch"] = True

    # Extract proposed_date_or_time from conversation history
    for msg in reversed(messages):
        if msg.role == "learner":
            text_lower = msg.text.casefold()
            if "завтра" in text_lower or "сегодня" in text_lower or "в 11" in text_lower or "в 14" in text_lower:
                # Extract time/date mention
                for word in ["завтра", "сегодня", "понедельник", "вторник", "среда", "четверг", "пятница"]:
                    if word in text_lower:
                        dialogue_signals["proposed_date_or_time"] = word
                        break
                if not dialogue_signals["proposed_date_or_time"]:
                    # Check for time pattern like "в 11:00" or "в 14 часов"
                    import re
                    time_match = re.search(r"в\s*(\d{1,2}:\d{2}|\d{1,2}\s*час)", text_lower)
                    if time_match:
                        dialogue_signals["proposed_date_or_time"] = time_match.group(0)
                break

    return {
        "edge_case_flags": edge_case_flags,
        "dialogue_signals": dialogue_signals,
    } | append_debug_step(
        state,
        node="detect_edge_cases",
        agent="system",
        status="completed",
        input_summary={"learner_message": state.get("learner_message", "")},
        parsed_output={"edge_case_flags": edge_case_flags, "dialogue_signals": dialogue_signals},
    )


def _build_graph_error(
    *,
    state: SimulatorGraphState,
    code: str,
    message: str,
    node: str,
    agent: str = "system",
    detail: dict | None = None,
) -> SimulatorGraphState:
    error_detail = detail or {}
    return {
        "status": "error",
        "error": code,
        "error_message": message,
        "error_node": node,
        "error_detail": error_detail,
    } | append_debug_step(
        state,
        node=node,
        agent=agent,
        status="error",
        error={"code": code, "message": message, **error_detail},
        metadata={"error_code": code},
    )


def _make_run_buyer_agent_node(deps: SimulatorGraphDependencies):
    async def run_buyer_agent(state: SimulatorGraphState) -> SimulatorGraphState:
        scenario = state["scenario"]
        session = state["session"]
        dialogue_signals = state.get("dialogue_signals") or {}
        payload = BuyerAgentInput(
            scenario_private_context=scenario,
            public_context={
                "scenario_id": scenario.id,
                "title": scenario.title,
                "goal": scenario.goal,
            },
            current_stage=state.get("current_stage", session.current_stage),
            dialog_history=[
                BuyerDialogTurn(role=message.role, text=message.text)
                for message in session.messages
            ],
            edge_case_flags=state.get("edge_case_flags", []),
            dialogue_signals=dialogue_signals,
        )
        trace = await deps.buyer_agent.generate_reply_with_trace(payload)
        metadata = {
            "used_repair": trace.repaired_prompt is not None,
            "repaired_prompt": trace.repaired_prompt,
            "repaired_raw_output": trace.repaired_raw_output,
            "repaired_validated_output": trace.repaired_validated_output,
            "used_fallback": trace.used_fallback,
            "fallback_reason": trace.fallback_reason,
            "validation_reasons": trace.validation_reasons,
        }
        log_agent_prompt_call(
            settings=deps.settings,
            agent="buyer_agent",
            node="run_buyer_agent",
            status="completed",
            session_id=session.id,
            scenario_id=scenario.id,
            prompt=trace.prompt,
            system_prompt=trace.system_prompt,
            raw_output=trace.raw_output,
            parsed_output={
                "validated_output": trace.validated_output,
                "validation_reasons": trace.validation_reasons,
                "used_fallback": trace.used_fallback,
                "fallback_reason": trace.fallback_reason,
            },
            metadata={
                "current_stage": state.get("current_stage", session.current_stage),
                "edge_case_flags": state.get("edge_case_flags", []),
                "dialog_turn_count": len(session.messages),
                "dialogue_signals": dialogue_signals,
                "used_fallback": trace.used_fallback,
                "fallback_reason": trace.fallback_reason,
            },
        )
        return {
            "customer_reply": trace.validated_output,
            "status": "buyer_reply_ready",
        } | append_debug_step(
            state,
            node="run_buyer_agent",
            agent="buyer_agent",
            status="completed",
            input_summary={
                "scenario_id": scenario.id,
                "current_stage": state.get("current_stage", session.current_stage),
                "edge_case_flags": state.get("edge_case_flags", []),
                "dialog_turn_count": len(session.messages),
                "dialogue_signals": dialogue_signals,
            },
            prompt=trace.prompt,
            system_prompt=trace.system_prompt,
            raw_output=trace.raw_output,
            parsed_output={
                "validated_output": trace.validated_output,
                "validation_reasons": trace.validation_reasons,
                "used_fallback": trace.used_fallback,
                "fallback_reason": trace.fallback_reason,
            },
            metadata=metadata,
        )

    return run_buyer_agent


def validate_buyer_reply(state: SimulatorGraphState) -> SimulatorGraphState:
    # Validation is now done inside BuyerAgent.generate_reply_with_trace()
    # This node just passes through since validation already happened
    
    # Check if we need to force fallback due to dialogue signals (e.g., profanity/insult)
    # In these cases, even a valid LLM reply should be replaced with appropriate boundary response
    dialogue_signals = state.get("dialogue_signals") or {}
    customer_reply = state.get("customer_reply", "").strip()
    
    # If profanity_or_insult signal is set and reply doesn't match boundary response, use fallback
    if dialogue_signals.get("profanity_or_insult"):
        expected_boundary = "В таком тоне я не готов продолжать обсуждение. Если вернемся к предметному разговору о рисках и сроках, можем продолжить."
        if customer_reply != expected_boundary:
            # Force boundary reply
            return {
                "customer_reply": expected_boundary,
                "status": "buyer_reply_valid",
            } | append_debug_step(
                state,
                node="validate_buyer_reply",
                agent="buyer_agent",
                status="completed",
                input_summary={"raw_reply": customer_reply, "forced_fallback": "profanity_or_insult"},
                parsed_output={"validated_reply": expected_boundary, "forced_fallback": True},
            )
    
    if not customer_reply:
        return _build_graph_error(
            state=state,
            code="buyer_reply_invalid",
            message="Buyer reply is empty after validation.",
            node="validate_buyer_reply",
            agent="buyer_agent",
            detail={"raw_output": state.get("customer_reply", "")},
        )
    return {"customer_reply": customer_reply, "status": "buyer_reply_valid"} | append_debug_step(
        state,
        node="validate_buyer_reply",
        agent="buyer_agent",
        status="completed",
        input_summary={"raw_reply": customer_reply},
        parsed_output={"validated_reply": customer_reply},
    )


def _make_append_customer_message_node(deps: SimulatorGraphDependencies):
    def append_customer_message(state: SimulatorGraphState) -> SimulatorGraphState:
        session = state["session"]
        customer_message = SimulatorGraphMessage(role="customer", text=state["customer_reply"])
        updated_session = session.model_copy(update={"messages": [*session.messages, customer_message]})
        deps.session_repo.save(updated_session)
        return {
            "session": updated_session,
            "messages": updated_session.messages,
            "status": "dialogue_continues",
            "manager_turn_count": _count_manager_turns(updated_session.messages),
        } | append_debug_step(
            state,
            node="append_customer_message",
            agent="system",
            status="completed",
            input_summary={"customer_reply": state["customer_reply"]},
            metadata={"session_id": updated_session.id, "message_id": customer_message.id},
        )

    return append_customer_message


def _make_check_scoring_readiness_node(deps: SimulatorGraphDependencies):
    def check_scoring_readiness(state: SimulatorGraphState) -> SimulatorGraphState:
        messages = state["messages"]
        manager_turn_count = _count_manager_turns(messages)
        is_ready = (
            manager_turn_count >= deps.settings.MIN_MANAGER_TURNS
            or short_effective_dialog_precheck(messages)
        )
        if not is_ready:
            return {
                "manager_turn_count": manager_turn_count,
                "status": "needs_more_dialogue",
                "warning_message": "Нужно больше реплик менеджера перед итоговой оценкой.",
            } | append_debug_step(
                state,
                node="check_scoring_readiness",
                agent="system",
                status="completed",
                input_summary={"manager_turn_count": manager_turn_count},
                metadata={
                    "ready_for_evaluation": False,
                    "min_manager_turns": deps.settings.MIN_MANAGER_TURNS,
                },
            )
        return {
            "manager_turn_count": manager_turn_count,
            "status": "ready_for_evaluation",
        } | append_debug_step(
            state,
            node="check_scoring_readiness",
            agent="system",
            status="completed",
            input_summary={"manager_turn_count": manager_turn_count},
            metadata={
                "ready_for_evaluation": True,
                "min_manager_turns": deps.settings.MIN_MANAGER_TURNS,
            },
        )

    return check_scoring_readiness


def _make_run_evaluation_agent_node(deps: SimulatorGraphDependencies):
    async def run_evaluation_agent(state: SimulatorGraphState) -> SimulatorGraphState:
        scenario = state["scenario"]
        methodology = state["methodology"]
        evaluation_input = EvaluationAgentInput(
            session_completed=True,
            full_transcript=[
                {"role": message.role, "text": message.text}
                for message in state["messages"]
            ],
            scenario_context=(
                f"{scenario.introduction} "
                f"{scenario.buyer_agent_context.current_situation}"
            ),
            competency_model_version=methodology.competency_model.version,
            competency_rubrics=EvaluationAgentInput.rubrics_from_competencies(
                methodology.competency_model.competencies
            ),
            criteria=scenario.criteria,
            edge_cases=state.get("edge_case_flags", []),
            min_manager_turns=deps.settings.MIN_MANAGER_TURNS,
        )
        trace_result = await deps.evaluation_agent.evaluate_with_trace(evaluation_input)
        log_agent_prompt_call(
            settings=deps.settings,
            agent="evaluation_agent",
            node="run_evaluation_agent",
            status="completed" if trace_result["parsed_result"] else "failed",
            session_id=state["session"].id,
            scenario_id=scenario.id,
            prompt=trace_result["prompt"],
            system_prompt=trace_result["system_prompt"],
            raw_output=trace_result["raw_output"],
            parsed_output=trace_result["parsed_result"],
            metadata={
                "edge_case_flags": state.get("edge_case_flags", []),
                "manager_turn_count": evaluation_input.manager_turn_count,
                "error": trace_result["error"],
            },
        )
        return {
            "evaluation_input": evaluation_input.model_dump(),
            "evaluation_prompt": trace_result["prompt"],
            "evaluation_raw_output": trace_result["raw_output"],
            "evaluation_parsed_result": trace_result["parsed_result"],
            "evaluation_error": trace_result["error"],
            "status": "evaluation_generated" if trace_result["parsed_result"] else "evaluation_failed",
        } | append_debug_step(
            state,
            node="run_evaluation_agent",
            agent="evaluation_agent",
            status="completed" if trace_result["parsed_result"] else "failed",
            input_summary={
                "scenario_id": scenario.id,
                "edge_case_flags": state.get("edge_case_flags", []),
                "manager_turn_count": evaluation_input.manager_turn_count,
            },
            prompt=trace_result["prompt"],
            system_prompt=trace_result["system_prompt"],
            raw_output=trace_result["raw_output"],
            parsed_output=trace_result["parsed_result"],
            error=trace_result["error"],
        )

    return run_evaluation_agent


def _make_validate_evaluation_json_node(deps: SimulatorGraphDependencies):
    def validate_evaluation_json(state: SimulatorGraphState) -> SimulatorGraphState:
        evaluation_error = state.get("evaluation_error")
        if evaluation_error:
            if state.get("repair_attempt_count", 0) >= 1:
                return _build_graph_error(
                    state=state,
                    code="evaluation_json_invalid",
                    message=f"Evaluation failed: {evaluation_error}",
                    node="validate_evaluation_json",
                    agent="evaluation_agent",
                    detail={"error": evaluation_error},
                )
            return {
                "status": "evaluation_invalid",
                "error": "evaluation_json_invalid",
            } | append_debug_step(
                state,
                node="validate_evaluation_json",
                agent="evaluation_agent",
                status="error",
                error={"code": "evaluation_json_invalid", "message": evaluation_error},
                metadata={"repair_attempt_count": state.get("repair_attempt_count", 0)},
            )

        result = state.get("evaluation_parsed_result")
        if not result:
            return _build_graph_error(
                state=state,
                code="evaluation_missing_result",
                message="Evaluation result is missing.",
                node="validate_evaluation_json",
                agent="evaluation_agent",
            )

        return {
            "evaluation_result": result,
            "evaluation_parsed_result": result,
            "status": "evaluation_valid",
            "error": "",
        } | append_debug_step(
            state,
            node="validate_evaluation_json",
            agent="evaluation_agent",
            status="completed",
            parsed_output=result,
            metadata={"repair_attempt_count": state.get("repair_attempt_count", 0)},
        )

    return validate_evaluation_json


def _make_repair_evaluation_json_node(deps: SimulatorGraphDependencies):
    async def repair_evaluation_json(state: SimulatorGraphState) -> SimulatorGraphState:
        repair_attempt_count = state.get("repair_attempt_count", 0)
        if repair_attempt_count >= 1:
            return _build_graph_error(
                state=state,
                code="evaluation_json_invalid",
                message="Evaluation JSON is invalid after one repair attempt.",
                node="repair_evaluation_json",
                agent="json_repair",
                detail={"raw_output": state.get("evaluation_raw_output", "")},
            )

        prompt = (
            "Исправь JSON так, чтобы он строго соответствовал схеме EvaluationResult. "
            "Никакого markdown и пояснений вне JSON.\n\n"
            f"Исходный prompt:\n{state.get('evaluation_prompt', '')}\n\n"
            f"Невалидный JSON:\n{state.get('evaluation_raw_output', '')}"
        )
        repaired_output = await deps.evaluation_agent.llm_client.complete_text(
            prompt,
            system_prompt=deps.evaluation_agent.system_prompt,
        )
        repair_validation_error = None
        repair_parsed_output = None
        try:
            repair_parsed_output = deps.evaluation_agent.parse_result(repaired_output).model_dump()
        except EvaluationJsonError:
            repair_validation_error = {
                "code": "evaluation_json_invalid",
                "message": "Repaired evaluation JSON is still invalid.",
            }
        log_agent_prompt_call(
            settings=deps.settings,
            agent="json_repair",
            node="repair_evaluation_json",
            status="completed" if repair_validation_error is None else "error",
            session_id=state["session"].id,
            scenario_id=state["scenario"].id,
            prompt=prompt,
            system_prompt=deps.evaluation_agent.system_prompt,
            raw_output=repaired_output,
            parsed_output=repair_parsed_output,
            metadata={
                "repair_attempt_count": repair_attempt_count,
                "error": repair_validation_error,
            },
        )
        return {
            "evaluation_raw_output": repaired_output,
            "repair_attempt_count": repair_attempt_count + 1,
            "status": "evaluation_repaired",
        } | append_debug_step(
            state,
            node="repair_evaluation_json",
            agent="json_repair",
            status="completed" if repair_validation_error is None else "error",
            input_summary={"repair_attempt_count": repair_attempt_count},
            prompt=prompt,
            system_prompt=deps.evaluation_agent.system_prompt,
            raw_output=repaired_output,
            parsed_output=repair_parsed_output,
            error=repair_validation_error,
            metadata={"next_repair_attempt_count": repair_attempt_count + 1},
        )

    return repair_evaluation_json


def _make_build_report_json_node(deps: SimulatorGraphDependencies):
    def build_report_json(state: SimulatorGraphState) -> SimulatorGraphState:
        session = state["session"]
        scenario = state["scenario"]
        report_payload = build_report_payload(
            evaluation_result=state["evaluation_result"],
            session_metadata=SessionReportMetadataInput(
                session_id=session.id,
                manager_name=session.user_id,
            ),
            scenario_metadata=ScenarioReportMetadataInput(
                scenario_id=scenario.id,
                scenario_title=scenario.title,
            ),
            versions=VersionMetadataInput(
                prompt_version=deps.prompt_version,
                methodology_version=deps.methodology_version,
            ),
        )
        return {
            "report_payload": report_payload,
            "status": "report_built",
        } | append_debug_step(
            state,
            node="build_report_json",
            agent="report_builder",
            status="completed",
            input_summary={"session_id": session.id, "scenario_id": scenario.id},
            parsed_output=report_payload.model_dump(),
        )

    return build_report_json


def _make_save_report_node(deps: SimulatorGraphDependencies):
    def save_report(state: SimulatorGraphState) -> SimulatorGraphState:
        session = state["session"].model_copy(
            update={
                "status": "finished",
                "completed_at": datetime.now(timezone.utc),
            }
        )
        deps.session_repo.save(session)
        deps.report_repo.save(session.id, state["report_payload"])
        return {
            "session": session,
            "status": "finished",
        } | append_debug_step(
            state,
            node="save_report",
            agent="report_builder",
            status="completed",
            input_summary={"session_id": session.id},
            metadata={"status": session.status, "completed_at": session.completed_at},
        )

    return save_report


def return_needs_more_dialogue(state: SimulatorGraphState) -> SimulatorGraphState:
    return {
        "status": "needs_more_dialogue",
        "evaluation_result": None,
        "report_payload": None,
    } | append_debug_step(
        state,
        node="return_needs_more_dialogue",
        agent="system",
        status="completed",
        metadata={"warning_message": state.get("warning_message", "")},
    )


def _count_manager_turns(messages: list[SimulatorGraphMessage]) -> int:
    return sum(1 for message in messages if message.role in {"manager", "learner"})


def _infer_stage(message: str, current_stage: str) -> str:
    lowered = message.casefold()
    if "встреч" in lowered or "следующ" in lowered:
        return "next_step"
    if "подума" in lowered or "не сейчас" in lowered:
        return "objection"
    if "риск" in lowered or "мешает" in lowered:
        return "diagnosis"
    return current_stage or "discovery"
