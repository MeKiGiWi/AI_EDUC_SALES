from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Protocol
from uuid import uuid4

from langgraph.graph import END, START, StateGraph

from app.agents.buyer_agent import BuyerAgent, BuyerAgentInput, BuyerDialogTurn, SAFE_FALLBACK_REPLY
from app.agents.evaluation_agent import EvaluationAgent
from app.domain.evaluation import (
    COMPETENCY_NAME_BY_ID,
    EvaluationAgentInput,
    EvaluationJsonError,
    EvaluationResult,
)
from app.domain.methodology import MethodologyBundle, ScenarioDefinition
from app.graphs.state import SimulatorGraphMessage, SimulatorGraphState, SimulatorSession
from app.services.report_service import (
    ScenarioReportMetadataInput,
    SessionReportMetadataInput,
    VersionMetadataInput,
    build_report_payload,
)
from app.settings import Settings


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


def create_simulator_graph(deps: SimulatorGraphDependencies):
    graph = StateGraph(SimulatorGraphState)

    graph.add_node("route_action", lambda state: state)
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
    graph.add_edge("validate_buyer_reply", "append_customer_message")
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
        },
    )
    graph.add_edge("repair_evaluation_json", "validate_evaluation_json")
    graph.add_edge("build_report_json", "save_report")
    graph.add_edge("save_report", END)
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
        }

    return create_session


def _make_create_opening_message_node(deps: SimulatorGraphDependencies):
    def create_opening_message(state: SimulatorGraphState) -> SimulatorGraphState:
        session = state["session"]
        scenario = state["scenario"]
        opening_message = SimulatorGraphMessage(
            role="customer",
            text=scenario.introduction,
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
        }

    return create_opening_message


def _make_load_session_node(deps: SimulatorGraphDependencies):
    def load_session(state: SimulatorGraphState) -> SimulatorGraphState:
        session = deps.session_repo.get(state["session_id"])
        if session is None:
            return {"error": "session_not_found", "status": "error"}
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
        }

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
        }

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
    return {"edge_case_flags": sorted(set(flags))}


def _make_run_buyer_agent_node(deps: SimulatorGraphDependencies):
    async def run_buyer_agent(state: SimulatorGraphState) -> SimulatorGraphState:
        scenario = state["scenario"]
        session = state["session"]
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
        )
        reply = await deps.buyer_agent.generate_reply(payload)
        return {"customer_reply": reply, "status": "buyer_reply_ready"}

    return run_buyer_agent


def validate_buyer_reply(state: SimulatorGraphState) -> SimulatorGraphState:
    reply = " ".join(state.get("customer_reply", "").strip().split())
    if not reply or reply.startswith("{") or re.search(r"(?m)^\s*#", reply):
        return {"customer_reply": SAFE_FALLBACK_REPLY, "warning_message": "buyer_reply_sanitized"}
    return {"customer_reply": reply}


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
        }

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
            }
        return {
            "manager_turn_count": manager_turn_count,
            "status": "ready_for_evaluation",
        }

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
                f"{scenario.hidden_summary} "
                f"{scenario.buyer_agent_context.current_situation}"
            ),
            competency_model_version=methodology.competency_model.version,
            criteria=scenario.criteria,
            edge_cases=state.get("edge_case_flags", []),
            min_manager_turns=deps.settings.MIN_MANAGER_TURNS,
        )
        prompt = deps.evaluation_agent.build_prompt(evaluation_input)
        raw_output = await deps.evaluation_agent.llm_client.complete_text(
            prompt,
            system_prompt=deps.evaluation_agent.system_prompt,
        )
        return {
            "evaluation_input": evaluation_input.model_dump(),
            "evaluation_prompt": prompt,
            "evaluation_raw_output": raw_output,
            "status": "evaluation_generated",
        }

    return run_evaluation_agent


def _make_validate_evaluation_json_node(deps: SimulatorGraphDependencies):
    def validate_evaluation_json(state: SimulatorGraphState) -> SimulatorGraphState:
        raw_output = state.get("evaluation_raw_output", "")
        try:
            result = deps.evaluation_agent.parse_result(raw_output)
        except EvaluationJsonError:
            return {"status": "evaluation_invalid", "error": "evaluation_json_invalid"}
        return {
            "evaluation_result": result,
            "status": "evaluation_valid",
            "error": "",
        }

    return validate_evaluation_json


def _make_repair_evaluation_json_node(deps: SimulatorGraphDependencies):
    async def repair_evaluation_json(state: SimulatorGraphState) -> SimulatorGraphState:
        repair_attempt_count = state.get("repair_attempt_count", 0)
        if repair_attempt_count >= 1:
            fallback_result = _build_fallback_evaluation_result(
                messages=state["messages"],
                min_manager_turns=deps.settings.MIN_MANAGER_TURNS,
                methodology=state["methodology"],
            )
            return {
                "evaluation_raw_output": fallback_result.model_dump_json(ensure_ascii=False),
                "repair_attempt_count": repair_attempt_count + 1,
                "status": "evaluation_repaired",
            }

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
        return {
            "evaluation_raw_output": repaired_output,
            "repair_attempt_count": repair_attempt_count + 1,
            "status": "evaluation_repaired",
        }

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
        return {"report_payload": report_payload, "status": "report_built"}

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
        }

    return save_report


def return_needs_more_dialogue(state: SimulatorGraphState) -> SimulatorGraphState:
    return {
        "status": "needs_more_dialogue",
        "evaluation_result": None,
        "report_payload": None,
    }


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


def _build_fallback_evaluation_result(
    *,
    messages: list[SimulatorGraphMessage],
    min_manager_turns: int,
    methodology: MethodologyBundle,
) -> EvaluationResult:
    learner_quotes = [
        message.text.strip()
        for message in messages
        if message.role == "learner" and message.text.strip()
    ]
    default_quote = learner_quotes[0] if learner_quotes else "Диалог завершен, но модель вернула невалидный JSON."
    competencies = []
    for competency in methodology.competency_model.competencies:
        competencies.append(
            {
                "id": competency.key,
                "name": COMPETENCY_NAME_BY_ID[competency.key],
                "level": "Junior",
                "argument": "Оценка собрана в безопасном fallback-режиме после проблем с JSON-ответом модели.",
                "evidence_quotes": [default_quote],
                "missing_to_next_level": "Нужно повторить оценку с более устойчивым JSON-ответом модели.",
                "recommendations": [
                    "Сохранить структуру диалога и добавить больше уточняющих вопросов.",
                    "Связывать следующий шаг с конкретной выгодой для клиента.",
                ],
            }
        )

    return EvaluationResult.model_validate(
        {
            "schema_version": "v1",
            "validity": {
                "is_valid_for_scoring": True,
                "manager_turn_count": _count_manager_turns(messages),
                "min_manager_turns": min_manager_turns,
                "short_effective_exception": False,
                "limitations": [
                    "Первичный JSON модели не прошел валидацию, поэтому использован безопасный fallback-результат."
                ],
            },
            "overall_level": "Junior",
            "overall_comment": "Итоговая оценка собрана в fallback-режиме после невалидного JSON-ответа модели.",
            "overall_recommendations": [
                "Повторить завершение сценария после стабилизации ответа модели.",
                "Проверить, достаточно ли предметно менеджер вел диагностику и фиксировал следующий шаг.",
            ],
            "competencies": competencies,
        }
    )
