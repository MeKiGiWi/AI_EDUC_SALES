import json

from app.domain.evaluation import EvaluationResult
from app.services.report_service import (
    ScenarioReportMetadataInput,
    SessionReportMetadataInput,
    VersionMetadataInput,
    build_report_payload,
)


def build_evaluation_result() -> EvaluationResult:
    return EvaluationResult.model_validate(
        {
            "schema_version": "v1",
            "validity": {
                "is_valid_for_scoring": True,
                "manager_turn_count": 10,
                "min_manager_turns": 10,
                "short_effective_exception": False,
                "limitations": [],
            },
            "overall_level": "Middle",
            "overall_comment": "Менеджер уверенно ведет разговор, но не везде дожимает скрытые барьеры клиента.",
            "overall_recommendations": [
                "Глубже раскрывать мотив отсрочки.",
                "Яснее связывать следующий шаг с выгодой клиента.",
            ],
            "competencies": [
                {
                    "id": "questioning",
                    "name": "Умение задавать вопросы",
                    "level": "Middle",
                    "argument": "Менеджер использует последовательные вопросы и держит фокус разговора.",
                    "evidence_quotes": ["Что сейчас мешает вам двигаться дальше по проекту?"],
                    "missing_to_next_level": "Стоит чаще связывать вопросы с метриками и рисками.",
                    "recommendations": ["Уточнять бизнес-эффект.", "Проверять скрытые ограничения."],
                },
                {
                    "id": "need_diagnosis",
                    "name": "Диагностика потребности",
                    "level": "Middle",
                    "argument": "Менеджер раскрывает причину отсрочки и уточняет последствия бездействия.",
                    "evidence_quotes": ["Какой риск для производства самый чувствительный?"],
                    "missing_to_next_level": "Нужно чаще уточнять критерии принятия решения и круг участников.",
                    "recommendations": ["Выяснять критерии выбора.", "Уточнять вовлеченных лиц."],
                },
                {
                    "id": "value_through_benefit",
                    "name": "Формулировка ценности через выгоду",
                    "level": "Junior",
                    "argument": "Пока ценность решения раскрыта слишком общо и без опоры на эффект для клиента.",
                    "evidence_quotes": ["Давайте согласуем короткую встречу с инженером на следующей неделе."],
                    "missing_to_next_level": "Нужно показать, какую практическую выгоду клиент получит от следующего шага.",
                    "recommendations": ["Привязывать предложение к выгоде.", "Говорить через снижение риска."],
                },
                {
                    "id": "think_it_over_objection",
                    "name": "Работа с возражением «подумаю / не сейчас»",
                    "level": "Junior",
                    "argument": "Менеджер затронул возражение, но не до конца вскрыл истинную причину отсрочки.",
                    "evidence_quotes": ["Что именно вам нужно дополнительно обдумать?"],
                    "missing_to_next_level": "Нужно разделять вопрос приоритета, риска внедрения и бюджета.",
                    "recommendations": ["Уточнять скрытый барьер.", "Спокойно проверять приоритет клиента."],
                },
                {
                    "id": "next_step_fixation",
                    "name": "Фиксация следующего шага",
                    "level": "Senior",
                    "argument": "Менеджер предложил конкретный следующий шаг и обозначил понятный срок.",
                    "evidence_quotes": ["Тогда давайте согласуем короткую встречу с инженером на следующей неделе."],
                    "missing_to_next_level": "Поддерживать стабильность сильного навыка в более сложных кейсах.",
                    "recommendations": ["Сохранять конкретику.", "Подтверждать ценность следующего шага."],
                },
            ],
        }
    )


def build_report():
    return build_report_payload(
        evaluation_result=build_evaluation_result(),
        session_metadata=SessionReportMetadataInput(
            session_id="session-123",
            manager_name="Алексей Смирнов",
        ),
        scenario_metadata=ScenarioReportMetadataInput(
            scenario_id="production-cooling",
            scenario_title="Охлаждение на производстве",
        ),
        versions=VersionMetadataInput(
            prompt_version="evaluation_agent_v1",
            methodology_version="v1",
        ),
    )


def test_report_payload_matches_schema() -> None:
    report = build_report()

    assert report.type == "simulator_report"
    assert report.schema_version == "1.0"
    assert report.metadata.session_id == "session-123"
    assert report.transcript_quotes


def test_report_keeps_all_five_competencies() -> None:
    report = build_report()

    assert len(report.competencies) == 5


def test_report_does_not_alter_levels() -> None:
    report = build_report()
    levels = {competency.id: competency.level for competency in report.competencies}

    assert levels["questioning"] == "Middle"
    assert levels["value_through_benefit"] == "Junior"
    assert levels["next_step_fixation"] == "Senior"


def test_report_contains_visibility_after_session_finish_only() -> None:
    report = build_report()

    assert report.visibility == "after_session_finish_only"


def test_report_can_be_serialized_to_json_with_cyrillic() -> None:
    report = build_report()
    serialized = report.model_dump_json(ensure_ascii=False)
    payload = json.loads(serialized)

    assert "Охлаждение на производстве" in serialized
    assert payload["metadata"]["manager_name"] == "Алексей Смирнов"
