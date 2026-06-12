from __future__ import annotations

from .models import ReportDialogueTurn, ReportGenerationCaseDefinition

SCENARIO_ID = "clinic-complaint"
SCENARIO_TITLE = "Жалоба на сервис клиники и длительное ожидание"

CLINIC_COMPLAINT_REPORT_CASES: list[ReportGenerationCaseDefinition] = [
    ReportGenerationCaseDefinition(
        name="clinic_complaint_report_junior",
        scenario_id=SCENARIO_ID,
        scenario_title=SCENARIO_TITLE,
        expected_level="Junior",
        reference_note="Junior scripted dialogue for clinic complaint report generation.",
        dialogue=[
            ReportDialogueTurn(
                speaker="customer",
                text="Здравствуйте. Хотела бы оставить жалобу по поводу вчерашнего визита. Я была записана на конкретное время, приехала заранее, а в итоге очень долго ждала, и при этом мне никто толком не мог сказать, сколько ещё ждать. Для частной клиники это, честно говоря, очень странный сервис.",
            ),
            ReportDialogueTurn(
                speaker="learner",
                text="Здравствуйте. Понимаю, но врачи иногда задерживаются, такое бывает в клинике.",
            ),
            ReportDialogueTurn(
                speaker="customer",
                text="Я понимаю, что бывают задержки, но меня больше удивило, что никто ничего нормально не объяснял.",
            ),
            ReportDialogueTurn(
                speaker="learner",
                text="Скажите, пожалуйста, сколько вы ждали и на какое время были записаны?",
            ),
            ReportDialogueTurn(
                speaker="customer",
                text="Я была записана на 18:00, а в кабинет попала почти в 18:40.",
            ),
            ReportDialogueTurn(
                speaker="learner",
                text="Мы можем передать информацию администратору, но я не могу обещать, что это быстро разберут.",
            ),
            ReportDialogueTurn(
                speaker="customer",
                text="Честно говоря, звучит так, будто это вообще никого особенно не волнует.",
            ),
            ReportDialogueTurn(
                speaker="learner",
                text="Компенсации у нас обычно не предусмотрены, потому что сам приём, насколько я понимаю, всё-таки состоялся.",
            ),
            ReportDialogueTurn(
                speaker="customer",
                text="Мне не столько компенсация нужна, сколько нормальная реакция и понимание, что это не повторится.",
            ),
            ReportDialogueTurn(
                speaker="learner",
                text="Я зафиксирую, что вы недовольны ожиданием. Если понадобится, с вами свяжутся.",
            ),
        ],
    ),
    ReportGenerationCaseDefinition(
        name="clinic_complaint_report_middle",
        scenario_id=SCENARIO_ID,
        scenario_title=SCENARIO_TITLE,
        expected_level="Middle",
        reference_note="Middle scripted dialogue for clinic complaint report generation.",
        dialogue=[
            ReportDialogueTurn(
                speaker="customer",
                text="Здравствуйте. Хотела бы оставить жалобу по поводу вчерашнего визита. Я была записана на конкретное время, приехала заранее, а в итоге очень долго ждала, и при этом мне никто толком не мог сказать, сколько ещё ждать. Для частной клиники это, честно говоря, очень странный сервис.",
            ),
            ReportDialogueTurn(
                speaker="learner",
                text="Здравствуйте. Сожалею, что визит прошёл с таким ожиданием. Давайте я спокойно зафиксирую обращение и уточню детали, чтобы его можно было разобрать по существу.",
            ),
            ReportDialogueTurn(
                speaker="customer",
                text="Спасибо. Мне как раз важно, чтобы это не осталось просто формальной жалобой.",
            ),
            ReportDialogueTurn(
                speaker="learner",
                text="Подскажите, пожалуйста, на какое время вы были записаны, во сколько фактически попали на приём и примерно сколько ждали после назначенного времени?",
            ),
            ReportDialogueTurn(
                speaker="customer",
                text="Запись была на 18:00, приехала я минут за десять, а к врачу попала только около 18:40.",
            ),
            ReportDialogueTurn(
                speaker="learner",
                text="Правильно понимаю, что вас задело не только само ожидание, но и то, что сотрудники не давали понятной информации, сколько ещё ждать?",
            ),
            ReportDialogueTurn(
                speaker="customer",
                text="Да, именно это. Если бы мне хотя бы нормально объяснили ситуацию, впечатление было бы другим.",
            ),
            ReportDialogueTurn(
                speaker="learner",
                text="Я зафиксирую жалобу по сервисной части: задержка приёма, отсутствие ясного информирования и то, как с вами коммуницировали на месте.",
            ),
            ReportDialogueTurn(
                speaker="customer",
                text="Хорошо. Мне важно понять, что дальше с этим будет происходить.",
            ),
            ReportDialogueTurn(
                speaker="learner",
                text="Дальше я передам обращение ответственному администратору, чтобы ситуацию проверили, и мы вернулись к вам с обратной связью.",
            ),
            ReportDialogueTurn(
                speaker="customer",
                text="Тогда лучше написать мне сначала в мессенджер, а звонить уже днём.",
            ),
            ReportDialogueTurn(
                speaker="learner",
                text="Подскажите, пожалуйста, какой канал связи вам удобнее для ответа и в какое время лучше не звонить?",
            ),
        ],
    ),
    ReportGenerationCaseDefinition(
        name="clinic_complaint_report_senior",
        scenario_id=SCENARIO_ID,
        scenario_title=SCENARIO_TITLE,
        expected_level="Senior",
        reference_note="Senior scripted dialogue for clinic complaint report generation.",
        dialogue=[
            ReportDialogueTurn(
                speaker="customer",
                text="Здравствуйте. Хотела бы оставить жалобу по поводу вчерашнего визита. Я была записана на конкретное время, приехала заранее, а в итоге очень долго ждала, и при этом мне никто толком не мог сказать, сколько ещё ждать. Для частной клиники это, честно говоря, очень странный сервис.",
            ),
            ReportDialogueTurn(
                speaker="learner",
                text="Здравствуйте. Спасибо, что обратились с этим напрямую. Сожалею, что после записи на конкретное время вы столкнулись с долгим ожиданием и неопределённостью. Давайте разберём ситуацию внимательно и без оправданий.",
            ),
            ReportDialogueTurn(
                speaker="customer",
                text="Спасибо. Да, меня именно задело, что всё выглядело так, будто моё время вообще никто не учитывает.",
            ),
            ReportDialogueTurn(
                speaker="learner",
                text="Чтобы корректно восстановить картину, уточню несколько деталей: на какое время была запись, во сколько вы приехали, примерно когда попали к врачу и что именно вам говорили на ресепшене?",
            ),
            ReportDialogueTurn(
                speaker="customer",
                text="Запись была на 18:00, приехала я заранее, а попала примерно в 18:40. На ресепшене мне говорили только «ещё немного подождите», без конкретики.",
            ),
            ReportDialogueTurn(
                speaker="learner",
                text="Правильно понимаю, что медицинская часть могла пройти нормально, но впечатление испортилось из-за сервиса: вы заранее подстроили график, ждали без понятного срока и не чувствовали, что вас реально ориентируют?",
            ),
            ReportDialogueTurn(
                speaker="customer",
                text="Да, всё именно так. Приём сам по себе был нормальный, но после такого уже не хочется снова проходить через ту же историю.",
            ),
            ReportDialogueTurn(
                speaker="learner",
                text="Мне важно зафиксировать не только факт задержки, но и последствия для вас — потерянное время, необходимость отпрашиваться с работы и сомнение, стоит ли снова обращаться в клинику.",
            ),
            ReportDialogueTurn(
                speaker="customer",
                text="Да, мне пришлось переносить дела, и теперь есть ощущение, что клинике просто всё равно.",
            ),
            ReportDialogueTurn(
                speaker="learner",
                text="Я предлагаю такой следующий шаг: зарегистрировать обращение, передать его старшему администратору смены и вернуть вам содержательную обратную связь в обозначенный срок, а не просто формальное извинение.",
            ),
            ReportDialogueTurn(
                speaker="customer",
                text="Для меня было бы важно понять причину задержки и увидеть, что с работой ресепшена действительно что-то сделают.",
            ),
            ReportDialogueTurn(
                speaker="learner",
                text="Скажите, пожалуйста, что для вас будет признаком, что жалобу действительно восприняли серьёзно: объяснение причины задержки, комментарий по работе ресепшена, помощь с будущей записью или другой формат обратной связи?",
            ),
            ReportDialogueTurn(
                speaker="customer",
                text="Да, в первую очередь объяснение причины и нормальный разбор по сервису.",
            ),
            ReportDialogueTurn(
                speaker="learner",
                text="Тогда фиксирую обращение и удобный канал связи. Мы вернёмся к вам с результатом разбора, а если вы решите записываться снова, отдельно поможем подобрать время так, чтобы снизить риск повторения такой ситуации.",
            ),
        ],
    ),
]
