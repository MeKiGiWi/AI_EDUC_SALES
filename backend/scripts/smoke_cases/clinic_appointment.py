from __future__ import annotations

from .models import SmokeCaseDefinition


# Built from the Middle/Senior reference dialogue in
# backend/kb/scenarios/clinic-appointment-reference.md.
CLINIC_APPOINTMENT_SMOKE = SmokeCaseDefinition(
    name="clinic_appointment_routing_and_next_step",
    scenario_id="clinic-appointment",
    reference_note="Derived from Middle/Senior reference dialogue for primary routing.",
    learner_messages=[
        "Здравствуйте. Понимаю, что в такой ситуации легко растеряться. Давайте я задам несколько вопросов, чтобы помочь вам точнее сориентироваться по записи.",
        "Подскажите, пожалуйста, как давно это началось, как часто такие эпизоды повторяются и были ли резкие симптомы вроде сильной боли или потери сознания?",
        "Правильно понимаю, что вам сейчас важно не просто записаться куда-нибудь, а понять, с какого врача логичнее и безопаснее начать?",
        "По тому, что вы описываете, разумным первым шагом обычно бывает терапевт: он поможет собрать общую картину и при необходимости уже адресно направит дальше.",
        "Если вам удобно, я сразу посмотрю ближайшие варианты записи после 18:00 или в субботу, чтобы зафиксировать понятный следующий шаг.",
    ],
)
