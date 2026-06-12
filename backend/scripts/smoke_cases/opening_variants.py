from __future__ import annotations

from .models import SmokeCaseDefinition


OPENING_VARIANT_SMOKE_CASES = [
    SmokeCaseDefinition(
        name="one_phrase_appointment_dizzy_heart",
        scenario_id="clinic-appointment",
        reference_note="One-phrase admin reply regression for appointment routing.",
        kind="one_phrase_opening",
        learner_messages=[
            "Здравствуйте. Подскажите, пожалуйста, как давно у вас держится такое состояние?"
        ],
    ),
    SmokeCaseDefinition(
        name="one_phrase_appointment_weakness_after_work",
        scenario_id="clinic-appointment",
        reference_note="One-phrase admin reply regression for appointment routing.",
        kind="one_phrase_opening",
        learner_messages=[
            "Скажите, пожалуйста, эти симптомы появились недавно или такое уже бывало раньше?"
        ],
    ),
    SmokeCaseDefinition(
        name="one_phrase_appointment_headache_numbness",
        scenario_id="clinic-appointment",
        reference_note="One-phrase admin reply regression for appointment routing.",
        kind="one_phrase_opening",
        learner_messages=[
            "Что уже предпринимали сами: отдыхали, измеряли давление или принимали какие-то лекарства?"
        ],
    ),
    SmokeCaseDefinition(
        name="one_phrase_appointment_nausea_week",
        scenario_id="clinic-appointment",
        reference_note="One-phrase admin reply regression for appointment routing.",
        kind="one_phrase_opening",
        learner_messages=[
            "Правильно понимаю, что вам сейчас важно понять, к какому врачу лучше записаться в первую очередь?"
        ],
    ),
    SmokeCaseDefinition(
        name="one_phrase_appointment_chest_pressure",
        scenario_id="clinic-appointment",
        reference_note="One-phrase admin reply regression for appointment routing.",
        kind="one_phrase_opening",
        learner_messages=[
            "Если вам удобно, я сначала уточню пару моментов, чтобы помочь сориентироваться по записи."
        ],
    ),
    SmokeCaseDefinition(
        name="one_phrase_complaint_waited_hour",
        scenario_id="clinic-complaint",
        reference_note="One-phrase admin reply regression for complaint handling.",
        kind="one_phrase_opening",
        learner_messages=[
            "Здравствуйте. Мне жаль, что так получилось. Подскажите, пожалуйста, на какое время вы были записаны?"
        ],
    ),
    SmokeCaseDefinition(
        name="one_phrase_complaint_reception_tone",
        scenario_id="clinic-complaint",
        reference_note="One-phrase admin reply regression for complaint handling.",
        kind="one_phrase_opening",
        learner_messages=[
            "Понимаю, что ситуация неприятная. Можете коротко сказать, что именно вас больше всего задело?"
        ],
    ),
    SmokeCaseDefinition(
        name="one_phrase_complaint_short_consultation",
        scenario_id="clinic-complaint",
        reference_note="One-phrase admin reply regression for complaint handling.",
        kind="one_phrase_opening",
        learner_messages=[
            "Спасибо, что сказали об этом. Я уточню детали, чтобы корректно зафиксировать ваше обращение."
        ],
    ),
    SmokeCaseDefinition(
        name="one_phrase_complaint_late_without_warning",
        scenario_id="clinic-complaint",
        reference_note="One-phrase admin reply regression for complaint handling.",
        kind="one_phrase_opening",
        learner_messages=[
            "Правильно понимаю, что проблема была не только в задержке, но и в том, что вас не предупредили заранее?"
        ],
    ),
    SmokeCaseDefinition(
        name="one_phrase_complaint_no_callback",
        scenario_id="clinic-complaint",
        reference_note="One-phrase admin reply regression for complaint handling.",
        kind="one_phrase_opening",
        learner_messages=[
            "Давайте я зафиксирую ваш запрос на обратную связь и уточню, как с вами удобнее связаться."
        ],
    ),
]
