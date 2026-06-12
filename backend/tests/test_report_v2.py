from datetime import datetime, timezone

from app.reports.report_v2 import (
    adapt_legacy_evaluation_to_report_v2,
    build_fallback_report_v2,
    build_dialogue_turns,
    parse_report_v2_payload,
    validate_report_v2_content,
)
from langchain_core.messages import AIMessage, HumanMessage
from app.simulator.schemas import CompetencyLevel, EvaluationCompetencyRaw, EvaluationResultRaw


def test_parse_report_v2_payload_from_fenced_json() -> None:
    raw = """```json
    {
      "reportVersion": "2.0",
      "case": {"id": "baseline", "title": "Baseline", "scenarioTitle": "Диалог", "createdAt": "2026-05-05T20:44:00Z"},
      "summary": {"title": "Отчет", "headline": "Короткий вывод", "overallLevel": "Junior", "overallScore": 42, "shortResume": ["Кейс: Baseline"]},
      "competencies": [],
      "dialogueAnalysis": [],
      "strengths": [],
      "developmentAreas": [],
      "meta": {"generatedBy": "AI Sales Academy", "source": "dialogue_simulation", "language": "ru"}
    }
    ```"""
    report = parse_report_v2_payload(raw)
    assert report.reportVersion == "2.0"
    assert report.summary.overallLevel == "Junior"


def test_build_fallback_report_is_valid() -> None:
    report = build_fallback_report_v2(
        scenario_id="baseline",
        scenario_title="Baseline",
        session_id="session-1",
        created_at=datetime.now(timezone.utc),
        messages=[],
    )
    assert report.reportVersion == "2.0"
    assert report.meta.fallback is True
    assert report.developmentAreas


def test_legacy_evaluation_adapts_to_report_v2() -> None:
    evaluation = EvaluationResultRaw(
        overall_level=CompetencyLevel.MIDDLE,
        overall_comment="Есть рабочая структура.",
        overall_recommendations=["Фиксировать следующий шаг."],
        competencies=[
            EvaluationCompetencyRaw(
                name="Умение задавать вопросы",
                level=CompetencyLevel.MIDDLE,
                argument="Есть вопросы по ситуации клиента.",
                quote=["Какие у вас критерии выбора?"],
                recommendations=["Задавать вопросы про риски."],
            )
        ],
    )
    report = adapt_legacy_evaluation_to_report_v2(
        evaluation=evaluation,
        dialogue_turns=build_dialogue_turns([]),
        scenario_id="baseline",
        scenario_title="Baseline",
        created_at=datetime.now(timezone.utc),
    )
    assert report.summary.overallLevel == "Middle"
    assert report.competencies[0].title == "Умение задавать вопросы"
    assert len(report.strengths) >= 1
    assert len(report.developmentAreas) >= 1
    assert len(report.nextSteps) >= 1


def test_legacy_evaluation_adapts_to_full_report_sections() -> None:
    evaluation = EvaluationResultRaw(
        overall_level=CompetencyLevel.MIDDLE,
        overall_comment="Диалог в целом уверенный.",
        overall_recommendations=["Глубже исследовать последствия бездействия."],
        competencies=[
            EvaluationCompetencyRaw(
                name="Умение задавать вопросы",
                level=CompetencyLevel.MIDDLE,
                argument="Менеджер задает вопросы, но может делать их глубже.",
                quote=["Какие критерии для вас важнее всего?"],
                recommendations=["Добавить вопрос про цену ошибки и риск простоя."],
            )
        ],
    )
    report = adapt_legacy_evaluation_to_report_v2(
        evaluation=evaluation,
        dialogue_turns=build_dialogue_turns([]),
        scenario_id="baseline",
        scenario_title="Baseline",
        created_at=datetime.now(timezone.utc),
    )
    assert len(report.strengths) >= 1
    assert len(report.developmentAreas) >= 1
    assert len(report.nextSteps) >= 2


def test_validate_report_v2_content_rejects_empty_summary() -> None:
    raw = """{
      "reportVersion": "2.0",
      "case": {"id": "baseline", "title": "Baseline", "scenarioTitle": "Диалог", "createdAt": "2026-05-05T20:44:00Z"},
      "summary": {"title": "Отчет", "headline": "", "overallLevel": "Junior", "overallScore": 42, "shortResume": []},
      "competencies": [],
      "dialogueAnalysis": [],
      "strengths": [],
      "developmentAreas": [],
      "nextSteps": [],
      "meta": {"generatedBy": "AI Sales Academy", "source": "dialogue_simulation", "language": "ru"}
    }"""
    report = parse_report_v2_payload(raw)

    try:
        validate_report_v2_content(report)
    except ValueError as exc:
        assert "summary.headline" in str(exc) or "summary.shortResume" in str(exc)
    else:
        raise AssertionError("Expected empty report summary to be rejected.")


def test_validate_report_v2_content_accepts_full_report() -> None:
    raw = """{
      "reportVersion": "2.0",
      "case": {"id": "baseline", "title": "Baseline", "scenarioTitle": "Диалог", "createdAt": "2026-05-05T20:44:00Z"},
      "participant": {"role": "student", "displayName": "Ученик"},
      "summary": {
        "title": "Отчет по диалогу",
        "headline": "Менеджер уверенно держит структуру, но может глубже диагностировать последствия бездействия.",
        "overallLevel": "Middle",
        "overallScore": 68,
        "shortResume": [
          "Менеджер удержал деловой фокус разговора.",
          "Лучше всего сработали уточнение критериев и фиксация следующего шага.",
          "Зону роста видно в более глубокой диагностике бизнес-рисков."
        ]
      },
      "competencies": [
        {"id": "q", "title": "Вопросы", "level": "Middle", "score": 68, "comment": "Есть хорошие уточняющие вопросы.", "evidence": []},
        {"id": "n", "title": "Диагностика", "level": "Middle", "score": 68, "comment": "Потребность раскрыта частично.", "evidence": []},
        {"id": "v", "title": "Ценность", "level": "Junior", "score": 40, "comment": "Ценность обозначена, но без достаточной конкретики.", "evidence": []}
      ],
      "dialogueAnalysis": [
        {"turnIndex": 1, "speaker": "manager", "speakerLabel": "Менеджер", "timestamp": null, "text": "Какие критерии для вас ключевые?", "analysis": {"status": "good", "comment": "Сильный диагностический вопрос.", "recommendation": null, "competencyIds": ["q"]}}
      ],
      "strengths": [
        {"title": "Диагностирует критерии", "comment": "Менеджер не уходит сразу в презентацию.", "evidence": []},
        {"title": "Держит деловой тон", "comment": "Коммуникация спокойная и профессиональная.", "evidence": []}
      ],
      "developmentAreas": [
        {"title": "Глубже раскрывать риск", "comment": "Не хватает разговора о последствиях бездействия.", "actions": ["Спросить о цене ошибки и простоя."]},
        {"title": "Усиливать ценность", "comment": "Аргументы пока общие.", "actions": ["Привязывать выгоду к ситуации клиента."]}
      ],
      "nextSteps": ["Потренировать вопросы про последствия.", "Сделать шаблон фиксации следующего шага."],
      "meta": {"generatedBy": "AI Sales Academy", "source": "dialogue_simulation", "language": "ru"}
    }"""
    report = parse_report_v2_payload(raw)
    validated = validate_report_v2_content(report, expected_dialogue_turns=1)
    assert validated.summary.overallLevel == "Middle"


def test_clinic_appointment_report_v2_uses_stable_ids_and_dialogue_analysis() -> None:
    evaluation = EvaluationResultRaw(
        overall_level=CompetencyLevel.MIDDLE,
        overall_comment="Контакт спокойный, но можно мягче отрабатывать тревогу.",
        overall_recommendations=["Подтверждать тревогу пациента.", "Четче фиксировать запись."],
        competencies=[
            EvaluationCompetencyRaw(name="Умение установить спокойный контакт", level=CompetencyLevel.MIDDLE, argument="Контакт спокойный.", quote=["Здравствуйте, понимаю, что вам тревожно."], recommendations=["Сохранять поддержку в начале диалога."]),
            EvaluationCompetencyRaw(name="Умение задавать уточняющие вопросы по симптомам без постановки диагноза", level=CompetencyLevel.MIDDLE, argument="Вопросы по симптомам уместные.", quote=["Подскажите, как давно держится температура?"], recommendations=["Чаще уточнять длительность симптомов."]),
            EvaluationCompetencyRaw(name="Первичная маршрутизация пациента к подходящему врачу", level=CompetencyLevel.MIDDLE, argument="Маршрутизация намечена.", quote=["Предлагаю начать с терапевта."], recommendations=["Коротко пояснять маршрут."]),
            EvaluationCompetencyRaw(name="Работа с тревогой и сомнениями пациента", level=CompetencyLevel.JUNIOR, argument="Эмпатия проявлена не во всех репликах.", quote=["Давайте спокойно разберёмся."], recommendations=["Явно признавать тревогу пациента."]),
            EvaluationCompetencyRaw(name="Фиксация следующего шага", level=CompetencyLevel.JUNIOR, argument="Нужна конкретнее запись.", quote=["Я подберу для вас ближайшее окно."], recommendations=["Фиксировать время записи."]),
        ],
    )
    dialogue_turns = build_dialogue_turns(
        [
            AIMessage(content="Я очень переживаю и не понимаю, к кому мне записаться."),
            HumanMessage(content="Здравствуйте, понимаю, что вам тревожно. Подскажите, как давно держится температура?"),
            AIMessage(content="Пару дней, и я уже пила таблетки."),
            HumanMessage(content="Спасибо, давайте тогда подберём запись к терапевту на сегодня."),
        ]
    )

    report = adapt_legacy_evaluation_to_report_v2(
        evaluation=evaluation,
        dialogue_turns=dialogue_turns,
        scenario_id="clinic-appointment",
        scenario_title="Первичная запись: тревожный пациент с симптомами",
        created_at=datetime.now(timezone.utc),
    )

    assert [item.id for item in report.competencies] == [
        "calm_contact",
        "symptom_questions_without_diagnosis",
        "patient_routing",
        "anxiety_handling",
        "next_step",
    ]
    assert len(report.dialogueAnalysis) == 4
    assert all(item.analysis.comment for item in report.dialogueAnalysis)
    serialized = report.model_dump_json()
    for legacy_term in ("КП", "смета", "простой", "выезд"):
        assert legacy_term not in serialized


def test_clinic_complaint_report_v2_uses_stable_ids_and_dialogue_analysis() -> None:
    evaluation = EvaluationResultRaw(
        overall_level=CompetencyLevel.MIDDLE,
        overall_comment="Жалоба обработана конструктивно.",
        overall_recommendations=["Сначала признавать неудобство.", "Фиксировать срок обратной связи."],
        competencies=[
            EvaluationCompetencyRaw(name="Контакт в жалобной коммуникации", level=CompetencyLevel.MIDDLE, argument="Контакт спокойный.", quote=["Понимаю ваше недовольство."], recommendations=["Сохранять спокойный тон."]),
            EvaluationCompetencyRaw(name="Сбор фактов по жалобе", level=CompetencyLevel.MIDDLE, argument="Факты собраны.", quote=["Уточните, пожалуйста, сколько вы ожидали?"], recommendations=["Фиксировать дату и время."]),
            EvaluationCompetencyRaw(name="Эмпатия без обороны", level=CompetencyLevel.JUNIOR, argument="Можно меньше защиты.", quote=["Сожалею, что вам пришлось ждать."], recommendations=["Не оправдываться до сбора фактов."]),
            EvaluationCompetencyRaw(name="Предложение решения по обращению", level=CompetencyLevel.MIDDLE, argument="Решение предложено.", quote=["Я передам обращение старшему администратору."], recommendations=["Обозначать срок ответа."]),
            EvaluationCompetencyRaw(name="Фиксация следующего шага", level=CompetencyLevel.JUNIOR, argument="Нужен срок обратной связи.", quote=["Мы свяжемся с вами после проверки."], recommendations=["Фиксировать ответственного и срок."]),
        ],
    )
    dialogue_turns = build_dialogue_turns(
        [
            AIMessage(content="Я ждала почти сорок минут и никто ничего не объяснял."),
            HumanMessage(content="Понимаю ваше недовольство. Подскажите, пожалуйста, сколько по времени вы ожидали и кто вас оформлял?"),
            AIMessage(content="Меня оформляла администратор Анна."),
            HumanMessage(content="Спасибо, я передам обращение старшему администратору и вернусь к вам сегодня."),
        ]
    )

    report = adapt_legacy_evaluation_to_report_v2(
        evaluation=evaluation,
        dialogue_turns=dialogue_turns,
        scenario_id="clinic-complaint",
        scenario_title="Жалоба на сервис клиники и длительное ожидание",
        created_at=datetime.now(timezone.utc),
    )

    assert [item.id for item in report.competencies] == [
        "complaint_contact",
        "complaint_fact_gathering",
        "empathy_without_defensiveness",
        "complaint_solution",
        "next_step",
    ]
    assert len(report.dialogueAnalysis) == 4
    serialized = report.model_dump_json()
    for legacy_term in ("КП", "смета", "простой", "выезд"):
        assert legacy_term not in serialized
