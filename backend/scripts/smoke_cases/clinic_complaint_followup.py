from __future__ import annotations

from .models import SmokeCaseDefinition


CLINIC_COMPLAINT_ALT_SMOKE = SmokeCaseDefinition(
    name="clinic_complaint_callback_recovery_alt",
    scenario_id="clinic-complaint",
    reference_note="Alternative scripted complaint dialogue with different but reference-like service recovery flow.",
    kind="scripted_reference",
    learner_messages=[
        "Здравствуйте. Спасибо, что сразу сказали о проблеме. Мне важно аккуратно зафиксировать ситуацию и понять, какой обратной связи вы ожидаете от клиники.",
        "Подскажите, пожалуйста, когда именно был визит, что произошло после приёма и каким способом вы пытались связаться с клиникой после этого?",
        "Правильно понимаю, что для вас сейчас важно не только получить ответ на вопросы по назначению, но и чтобы с вами связались без повторных попыток дозвониться?",
        "Я зафиксирую обращение так, чтобы коллеги увидели и вопросы по назначению, и саму проблему с тем, что связаться с клиникой оказалось сложно.",
        "Давайте сразу уточним удобный номер и время для обратного звонка, чтобы следующий шаг был понятен и вам не пришлось снова всё повторять.",
    ],
)
