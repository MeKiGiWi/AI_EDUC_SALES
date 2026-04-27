import json

import pytest

from app.agents.evaluation_agent import EvaluationAgent
from app.domain.evaluation import EvaluationAgentInput, EvaluationJsonError
from app.llm.fake_client import FakeLLMClient


def build_payload() -> EvaluationAgentInput:
    return EvaluationAgentInput(
        session_completed=True,
        full_transcript=[
            {"role": "system", "text": "Сессия запущена."},
            {"role": "manager", "text": "Что сейчас мешает вам двигаться дальше по проекту?"},
            {"role": "customer", "text": "Мы пока не уверены в сроках."},
            {"role": "manager", "text": "Если оставить всё как есть, какой риск для производства самый чувствительный?"},
            {"role": "learner", "text": "Тогда давайте согласуем короткую встречу с инженером на следующей неделе."},
        ],
        scenario_context="Клиент откладывает решение по охлаждению производства и опасается срыва сроков.",
        competency_model_version="v1",
        criteria=[
            "Менеджер исследует причину отсрочки.",
            "Менеджер связывает решение с выгодой для клиента.",
        ],
        edge_cases=["client_goes_silent"],
        min_manager_turns=10,
    )


def valid_result_json(*, limitations: list[str] | None = None) -> str:
    payload = {
        "schema_version": "v1",
        "validity": {
            "is_valid_for_scoring": False,
            "manager_turn_count": 3,
            "min_manager_turns": 10,
            "short_effective_exception": True,
            "limitations": limitations or ["Диалог короткий, поэтому выводы предварительные."],
        },
        "overall_level": "Junior",
        "overall_comment": "Диалог показывает базовую диагностику, но материала для уверенной оценки пока мало.",
        "overall_recommendations": [
            "Глубже раскрывать причину отсрочки.",
            "Раньше связывать предложение с рисками клиента.",
        ],
        "competencies": [
            {
                "id": "questioning",
                "name": "Умение задавать вопросы",
                "level": "Middle",
                "argument": "Менеджер использует открытые вопросы, чтобы раскрыть контекст клиента.",
                "evidence_quotes": ["Что сейчас мешает вам двигаться дальше по проекту?"],
                "missing_to_next_level": "Нужно глубже связывать вопросы с метриками и влиянием на бизнес.",
                "recommendations": ["Уточнять приоритет проблемы.", "Проверять последствия бездействия."],
            },
            {
                "id": "need_diagnosis",
                "name": "Диагностика потребности",
                "level": "Junior",
                "argument": "Проблема обозначена, но причины и масштаб раскрыты неполно.",
                "evidence_quotes": ["Какой риск для производства самый чувствительный?"],
                "missing_to_next_level": "Нужно прояснить влияние проблемы на сроки, потери и участников решения.",
                "recommendations": ["Уточнять масштаб потерь.", "Спрашивать о текущем процессе.", "Выявлять критерии решения."],
            },
            {
                "id": "value_through_benefit",
                "name": "Формулировка ценности через выгоду",
                "level": "Junior",
                "argument": "Ценность решения пока почти не раскрыта через выгоду клиента.",
                "evidence_quotes": ["Тогда давайте согласуем короткую встречу с инженером на следующей неделе."],
                "missing_to_next_level": "Нужно показать, зачем следующий шаг полезен клиенту с точки зрения рисков и сроков.",
                "recommendations": ["Привязывать шаг к снижению риска.", "Говорить через выгоду для производства."],
            },
            {
                "id": "think_it_over_objection",
                "name": "Работа с возражением «подумаю / не сейчас»",
                "level": "Junior",
                "argument": "Менеджер начал исследовать сомнение, но не раскрыл скрытый барьер полностью.",
                "evidence_quotes": ["Что сейчас мешает вам двигаться дальше по проекту?"],
                "missing_to_next_level": "Нужно уточнить, стоит ли за отсрочкой риск внедрения, приоритет или другой фактор.",
                "recommendations": ["Уточнять истинную причину отсрочки.", "Проверять, что именно клиент хочет обдумать."],
            },
            {
                "id": "next_step_fixation",
                "name": "Фиксация следующего шага",
                "level": "Middle",
                "argument": "Менеджер предложил конкретный следующий шаг и обозначил срок.",
                "evidence_quotes": ["Давайте согласуем короткую встречу с инженером на следующей неделе."],
                "missing_to_next_level": "Нужно связать следующий шаг с ожидаемой пользой и подтвердить удобство для клиента.",
                "recommendations": ["Подтверждать ценность встречи.", "Фиксировать критерий полезности следующего шага."],
            },
        ],
    }
    return json.dumps(payload, ensure_ascii=False)


async def test_validates_complete_json() -> None:
    agent = EvaluationAgent(FakeLLMClient(queued_text_responses=[valid_result_json()]))

    result = await agent.evaluate(build_payload())

    assert result.schema_version == "v1"
    assert len(result.competencies) == 5
    assert result.competencies[0].evidence_quotes


async def test_rejects_missing_competency() -> None:
    broken = json.loads(valid_result_json())
    broken["competencies"] = broken["competencies"][:-1]
    agent = EvaluationAgent(FakeLLMClient(queued_text_responses=[json.dumps(broken, ensure_ascii=False)]))

    with pytest.raises(EvaluationJsonError):
        await agent.evaluate(build_payload())


async def test_rejects_invalid_level() -> None:
    broken = json.loads(valid_result_json())
    broken["competencies"][0]["level"] = "Lead"
    agent = EvaluationAgent(FakeLLMClient(queued_text_responses=[json.dumps(broken, ensure_ascii=False)]))

    with pytest.raises(EvaluationJsonError):
        await agent.evaluate(build_payload())


async def test_rejects_empty_evidence_quotes() -> None:
    broken = json.loads(valid_result_json())
    broken["competencies"][2]["evidence_quotes"] = []
    agent = EvaluationAgent(FakeLLMClient(queued_text_responses=[json.dumps(broken, ensure_ascii=False)]))

    with pytest.raises(EvaluationJsonError):
        await agent.evaluate(build_payload())


async def test_accepts_cautious_evaluation_for_short_transcript_when_validity_limitations_are_present() -> None:
    agent = EvaluationAgent(
        FakeLLMClient(
            queued_text_responses=[
                valid_result_json(limitations=["Диалог короткий, часть выводов носит предварительный характер."])
            ]
        )
    )

    result = await agent.evaluate(build_payload())

    assert result.validity.short_effective_exception is True
    assert result.validity.limitations
    assert result.validity.manager_turn_count == 3
