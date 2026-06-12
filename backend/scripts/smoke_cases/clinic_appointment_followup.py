from __future__ import annotations

from .models import SmokeCaseDefinition


CLINIC_APPOINTMENT_ALT_SMOKE = SmokeCaseDefinition(
    name="clinic_appointment_symptom_triage_alt",
    scenario_id="clinic-appointment",
    reference_note="Alternative scripted appointment dialogue with different but reference-like routing phrasing.",
    kind="scripted_reference",
    learner_messages=[
        "Здравствуйте. Постараюсь помочь спокойно разобраться, с какого специалиста удобнее и безопаснее начать запись.",
        "Скажите, пожалуйста, эти ощущения возникают только после нагрузки или бывают и в покое, и были ли у вас обмороки, сильная боль или выраженная одышка?",
        "Я правильно понимаю, что вам сейчас важно не только записаться, но и не ошибиться с первым врачом, чтобы не терять время?",
        "В такой ситуации обычно разумно начать с терапевта, чтобы он оценил общую картину и при необходимости быстро направил к профильному специалисту.",
        "Если хотите, я сразу помогу подобрать ближайшее время к терапевту и посмотрю варианты, где запись будет удобнее по времени.",
    ],
)
