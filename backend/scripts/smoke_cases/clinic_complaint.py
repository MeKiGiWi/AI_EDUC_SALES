from __future__ import annotations

from .models import SmokeCaseDefinition


# Built from the Middle/Senior reference dialogue in
# backend/kb/scenarios/clinic-complaint-reference.md.
CLINIC_COMPLAINT_SMOKE = SmokeCaseDefinition(
    name="clinic_complaint_service_recovery",
    scenario_id="clinic-complaint",
    reference_note="Derived from Middle/Senior reference dialogue for complaint intake.",
    learner_messages=[
        "Здравствуйте. Спасибо, что сказали об этом. Понимаю, что такая ситуация неприятна, и давайте я уточню детали, чтобы корректно зафиксировать обращение.",
        "Подскажите, пожалуйста, на какое время вы были записаны и примерно сколько в итоге ждали после назначенного времени?",
        "Правильно понимаю, что вас задела не только сама задержка, но и то, что вам не дали ясного понимания по срокам ожидания?",
        "Тогда я зафиксирую жалобу именно по сервисной части: длительное ожидание, отсутствие понятного информирования и то, как с вами коммуницировали сотрудники.",
        "Я отмечу, что вам важна содержательная обратная связь по итогам разбора, и сразу зафиксирую удобный канал связи, чтобы следующий шаг был понятным.",
    ],
)
