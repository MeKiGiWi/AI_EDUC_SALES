from __future__ import annotations

from .models import ReportDialogueTurn, ReportGenerationCaseDefinition

SCENARIO_ID = "clinic-appointment"
SCENARIO_TITLE = "Первичная запись: тревожный пациент с симптомами"

CLINIC_APPOINTMENT_REPORT_CASES: list[ReportGenerationCaseDefinition] = [
    ReportGenerationCaseDefinition(
        name="clinic_appointment_report_junior",
        scenario_id=SCENARIO_ID,
        scenario_title=SCENARIO_TITLE,
        expected_level="Junior",
        reference_note="Junior scripted dialogue for clinic appointment report generation.",
        dialogue=[
            ReportDialogueTurn(
                speaker="customer",
                text="Здравствуйте. Я впервые к вам обращаюсь. У меня уже несколько дней какое-то странное состояние: периодически кружится голова, бывает слабость, иногда как будто сердце бьётся сильнее обычного. Я не понимаю, к кому мне вообще надо записаться.",
            ),
            ReportDialogueTurn(
                speaker="learner",
                text="Здравствуйте. У нас есть терапевт, кардиолог и невролог. Могу записать вас к любому специалисту, который вам кажется подходящим.",
            ),
            ReportDialogueTurn(
                speaker="customer",
                text="Вот в этом и проблема, что я не понимаю, кто мне нужен. Не хочется записаться не туда.",
            ),
            ReportDialogueTurn(
                speaker="learner",
                text="Если сердце бьётся сильнее обычного, наверное, можно к кардиологу. Если просто слабость и голова кружится — тогда к терапевту.",
            ),
            ReportDialogueTurn(
                speaker="customer",
                text="А это не опасно? Я просто уже начинаю переживать, вдруг это что-то серьёзное.",
            ),
            ReportDialogueTurn(
                speaker="learner",
                text="Не переживайте, чаще всего сначала просто записываются к врачу, а он уже смотрит на приёме.",
            ),
            ReportDialogueTurn(
                speaker="customer",
                text="Хорошо, наверное, лучше хотя бы начать с кого-то одного. Что тогда проще сделать?",
            ),
            ReportDialogueTurn(
                speaker="learner",
                text="Давайте тогда к терапевту. Ближайшее время есть в среду в 15:00, могу поставить вас туда.",
            ),
            ReportDialogueTurn(
                speaker="customer",
                text="Я не уверена, смогу ли в среду. Может, мне лучше ещё подумать.",
            ),
            ReportDialogueTurn(
                speaker="learner",
                text="Если сейчас неудобно решать, можете подумать и потом перезвонить, когда определитесь.",
            ),
        ],
    ),
    ReportGenerationCaseDefinition(
        name="clinic_appointment_report_middle",
        scenario_id=SCENARIO_ID,
        scenario_title=SCENARIO_TITLE,
        expected_level="Middle",
        reference_note="Middle scripted dialogue for clinic appointment report generation.",
        dialogue=[
            ReportDialogueTurn(
                speaker="customer",
                text="Здравствуйте. Я впервые к вам обращаюсь. У меня уже несколько дней какое-то странное состояние: периодически кружится голова, бывает слабость, иногда как будто сердце бьётся сильнее обычного. Я не понимаю, к кому мне вообще надо записаться.",
            ),
            ReportDialogueTurn(
                speaker="learner",
                text="Здравствуйте. Понимаю, что при таких симптомах может быть тревожно. Давайте я задам несколько уточняющих вопросов, чтобы помочь вам сориентироваться по записи.",
            ),
            ReportDialogueTurn(
                speaker="customer",
                text="Да, пожалуйста, потому что я уже начинаю накручивать себя и боюсь ошибиться с выбором врача.",
            ),
            ReportDialogueTurn(
                speaker="learner",
                text="Подскажите, пожалуйста, как давно это началось и как часто повторяются эпизоды головокружения, слабости или учащённого сердцебиения?",
            ),
            ReportDialogueTurn(
                speaker="customer",
                text="Наверное, дня три. Не постоянно, но несколько раз в день точно бывает, особенно к вечеру.",
            ),
            ReportDialogueTurn(
                speaker="learner",
                text="Правильно понимаю, что вам важно не просто выбрать любого врача, а понять, с какого специалиста безопаснее и логичнее начать?",
            ),
            ReportDialogueTurn(
                speaker="customer",
                text="Да, именно так. Не хочется сначала пойти не туда, а потом ещё терять время.",
            ),
            ReportDialogueTurn(
                speaker="learner",
                text="По описанию разумным первым шагом обычно бывает терапевт: он соберёт общую картину и при необходимости направит к кардиологу или неврологу. Диагноз по телефону мы, конечно, не ставим.",
            ),
            ReportDialogueTurn(
                speaker="customer",
                text="Поняла. Тогда лучше, наверное, сразу записаться. Вечером после работы было бы удобнее.",
            ),
            ReportDialogueTurn(
                speaker="learner",
                text="Вам удобнее рассмотреть запись после 18:00 в будни или подойдёт суббота?",
            ),
            ReportDialogueTurn(
                speaker="customer",
                text="После 18:00 в будни было бы идеально.",
            ),
            ReportDialogueTurn(
                speaker="learner",
                text="Тогда я могу зафиксировать ближайшее удобное окно к терапевту и коротко подсказать, что лучше взять с собой на первичный приём.",
            ),
        ],
    ),
    ReportGenerationCaseDefinition(
        name="clinic_appointment_report_senior",
        scenario_id=SCENARIO_ID,
        scenario_title=SCENARIO_TITLE,
        expected_level="Senior",
        reference_note="Senior scripted dialogue for clinic appointment report generation.",
        dialogue=[
            ReportDialogueTurn(
                speaker="customer",
                text="Здравствуйте. Я впервые к вам обращаюсь. У меня уже несколько дней какое-то странное состояние: периодически кружится голова, бывает слабость, иногда как будто сердце бьётся сильнее обычного. Я не понимаю, к кому мне вообще надо записаться.",
            ),
            ReportDialogueTurn(
                speaker="learner",
                text="Здравствуйте. Спасибо, что подробно описали состояние. Понимаю, почему вы тревожитесь: когда симптомы разные и непонятно, к кому идти, важно спокойно собрать картину и выбрать безопасный первый шаг.",
            ),
            ReportDialogueTurn(
                speaker="customer",
                text="Да, мне именно страшно пропустить что-то серьёзное и при этом ещё и записаться не к тому специалисту.",
            ),
            ReportDialogueTurn(
                speaker="learner",
                text="Скажите, пожалуйста, сколько дней это продолжается, бывают ли эпизоды каждый день и есть ли что-то резкое: сильная боль, обморок, выраженная одышка или резкое ухудшение самочувствия?",
            ),
            ReportDialogueTurn(
                speaker="customer",
                text="Дня четыре, эпизоды бывают почти каждый день. Обморока не было, сильной боли тоже, но тревога из-за этого только растёт.",
            ),
            ReportDialogueTurn(
                speaker="learner",
                text="Правильно слышу, что вас беспокоят сразу две вещи: не пропустить серьёзное и не записаться не туда, чтобы потом не ходить по кругу?",
            ),
            ReportDialogueTurn(
                speaker="customer",
                text="Да, именно это. Хочется уже понять, какой первый шаг будет самым разумным.",
            ),
            ReportDialogueTurn(
                speaker="learner",
                text="В такой смешанной ситуации логика обычно такая: начать с терапевта как с первой точки входа. Он оценит общее состояние, задаст медицинские вопросы и уже при необходимости направит адресно дальше. При этом по телефону мы не ставим диагноз и не заменяем очный приём.",
            ),
            ReportDialogueTurn(
                speaker="customer",
                text="Спасибо, так понятнее. Если можно, я бы хотела записаться как можно скорее, чтобы не оставаться в неопределённости.",
            ),
            ReportDialogueTurn(
                speaker="learner",
                text="Давайте сразу подберём вариант, который снизит неопределённость: есть окно к терапевту завтра после 18:00 и есть субботнее время. Что вам спокойнее и удобнее?",
            ),
            ReportDialogueTurn(
                speaker="customer",
                text="Завтра после 18:00 мне подходит больше, так будет спокойнее.",
            ),
            ReportDialogueTurn(
                speaker="learner",
                text="Я фиксирую запись к терапевту, а перед визитом лучше взять список препаратов, если что-то принимали, и результаты недавних обследований, если они есть. Если состояние резко ухудшится до приёма, лучше обращаться за срочной медицинской помощью.",
            ),
        ],
    ),
]
