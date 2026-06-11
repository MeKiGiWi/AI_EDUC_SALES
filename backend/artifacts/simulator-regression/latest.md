# Simulator regression report

Generated at: 2026-06-11T10:47:39.502860+00:00
Base URL: http://127.0.0.1:8000
Strict mode: false

## Summary

| Case | Scenario | API status | Heuristic status | Turns |
|---|---|---:|---|---:|
| clinic_appointment_role_copy_guard | clinic-appointment | ok | PASS | 3 |
| clinic_appointment_routing_and_next_step | clinic-appointment | ok | PASS | 5 |
| clinic_complaint_service_recovery | clinic-complaint | ok | PASS | 5 |

## Case: clinic_appointment_role_copy_guard

Scenario: clinic-appointment
Session ID: `5f539089-ddbf-42b7-8c71-cb4c57dd9aed`

### Heuristic checks

- role_drift_seller_language: PASS
- refusal_or_session_stop: PASS
- empty_customer_reply: PASS

### Transcript

1. API opening message:
- kind: live_api_payload
- actor: scenario opening returned by API
- source: default_api_opening_message
> Здравствуйте. Я впервые к вам обращаюсь. У меня уже несколько дней какое-то странное состояние: периодически кружится голова, бывает слабость, иногда как будто сердце бьётся сильнее обычного. Я не понимаю, к кому мне вообще надо записаться.

2. **User input**
- kind: test_input
- actor: learner message supplied by regression script
- source: copied_from_customer_opening
> Здравствуйте. Я впервые к вам обращаюсь. У меня уже несколько дней какое-то странное состояние: периодически кружится голова, бывает слабость, иногда как будто сердце бьётся сильнее обычного. Я не понимаю, к кому мне вообще надо записаться.

**Live LLM reply**
- kind: live_llm_output
- actor: buyer-agent / LLM response observed during this run
- source: llm_generated_via_public_api
> Мне важно держаться в рамках текущего сценария. Давайте вернёмся к сути обращения и продолжим разговор по теме.

Raw API metadata:
- status: active
- rude: no
- confidence: 0.95

3. **User input**
- kind: test_input
- actor: learner message supplied by regression script
- source: copied_from_last_llm_reply
> Мне важно держаться в рамках текущего сценария. Давайте вернёмся к сути обращения и продолжим разговор по теме.

**Live LLM reply**
- kind: live_llm_output
- actor: buyer-agent / LLM response observed during this run
- source: llm_generated_via_public_api
> Здравствуйте. Понимаю, что вы растеряны. Давайте я задам несколько вопросов, чтобы помочь вам сориентироваться и выбрать правильное направление для записи. Скажите, пожалуйста, как давно у вас появились эти симптомы?

Raw API metadata:
- status: active
- rude: no
- confidence: 0.95

4. **User input**
- kind: test_input
- actor: learner message supplied by regression script
- source: copied_from_last_llm_reply
> Здравствуйте. Понимаю, что вы растеряны. Давайте я задам несколько вопросов, чтобы помочь вам сориентироваться и выбрать правильное направление для записи. Скажите, пожалуйста, как давно у вас появились эти симптомы?

**Live LLM reply**
- kind: live_llm_output
- actor: buyer-agent / LLM response observed during this run
- source: llm_generated_via_public_api
> Наверное, уже около недели. Не постоянно, а как бы эпизодами. Особенно ближе к вечеру, когда на работе.

Raw API metadata:
- status: active
- rude: no
- confidence: 0.99


## Case: clinic_appointment_routing_and_next_step

Scenario: clinic-appointment
Session ID: `8c34809c-ae31-44d9-a50d-5def385a8549`

### Heuristic checks

- role_drift_seller_language: PASS
- refusal_or_session_stop: PASS
- empty_customer_reply: PASS

### Transcript

1. API opening message:
- kind: live_api_payload
- actor: scenario opening returned by API
- source: default_api_opening_message
> Здравствуйте. Я впервые к вам обращаюсь. У меня уже несколько дней какое-то странное состояние: периодически кружится голова, бывает слабость, иногда как будто сердце бьётся сильнее обычного. Я не понимаю, к кому мне вообще надо записаться.

2. **User input**
- kind: test_input
- actor: learner message supplied by regression script
- source: scripted_test_input
> Здравствуйте. Понимаю, что в такой ситуации легко растеряться. Давайте я задам несколько вопросов, чтобы помочь вам точнее сориентироваться по записи.

**Live LLM reply**
- kind: live_llm_output
- actor: buyer-agent / LLM response observed during this run
- source: llm_generated_via_public_api
> Да, пожалуйста. Я просто не знаю, с чего начать. В интернете столько всего написано, а я боюсь ошибиться и записаться не к тому врачу.

Raw API metadata:
- status: active
- rude: no
- confidence: 0.99

3. **User input**
- kind: test_input
- actor: learner message supplied by regression script
- source: scripted_test_input
> Подскажите, пожалуйста, как давно это началось, как часто такие эпизоды повторяются и были ли резкие симптомы вроде сильной боли или потери сознания?

**Live LLM reply**
- kind: live_llm_output
- actor: buyer-agent / LLM response observed during this run
- source: llm_generated_via_public_api
> Началось где-то неделю назад. Эпизоды бывают не каждый день, но несколько раз уже было. В основном на работе, ближе к вечеру. Сильной боли или обмороков не было, но всё равно очень тревожно.

Raw API metadata:
- status: active
- rude: no
- confidence: 0.99

4. **User input**
- kind: test_input
- actor: learner message supplied by regression script
- source: scripted_test_input
> Правильно понимаю, что вам сейчас важно не просто записаться куда-нибудь, а понять, с какого врача логичнее и безопаснее начать?

**Live LLM reply**
- kind: live_llm_output
- actor: buyer-agent / LLM response observed during this run
- source: llm_generated_via_public_api
> Да, именно так. Я не хочу ходить по кругу и платить за приёмы у нескольких врачей, если можно сразу понять, к кому идти.

Raw API metadata:
- status: active
- rude: no
- confidence: 0.99

5. **User input**
- kind: test_input
- actor: learner message supplied by regression script
- source: scripted_test_input
> По тому, что вы описываете, разумным первым шагом обычно бывает терапевт: он поможет собрать общую картину и при необходимости уже адресно направит дальше.

**Live LLM reply**
- kind: live_llm_output
- actor: buyer-agent / LLM response observed during this run
- source: llm_generated_via_public_api
> А если это всё-таки сердце? Может, лучше сразу к кардиологу? Просто я читала, что головокружение и сердцебиение могут быть связаны.

Raw API metadata:
- status: active
- rude: no
- confidence: 0.99

6. **User input**
- kind: test_input
- actor: learner message supplied by regression script
- source: scripted_test_input
> Если вам удобно, я сразу посмотрю ближайшие варианты записи после 18:00 или в субботу, чтобы зафиксировать понятный следующий шаг.

**Live LLM reply**
- kind: live_llm_output
- actor: buyer-agent / LLM response observed during this run
- source: llm_generated_via_public_api
> Да, вечером или в субботу мне было бы удобнее. А сколько примерно стоит первичный приём у терапевта?

Raw API metadata:
- status: active
- rude: no
- confidence: 0.99


## Case: clinic_complaint_service_recovery

Scenario: clinic-complaint
Session ID: `0744a9d7-0707-43f6-b8f6-3cf3983ba0f6`

### Heuristic checks

- role_drift_seller_language: PASS
- refusal_or_session_stop: PASS
- empty_customer_reply: PASS

### Transcript

1. API opening message:
- kind: live_api_payload
- actor: scenario opening returned by API
- source: default_api_opening_message
> Здравствуйте. Хотела бы оставить жалобу по поводу вчерашнего визита. Я была записана на конкретное время, приехала заранее, а в итоге очень долго ждала, и при этом мне никто толком не мог сказать, сколько ещё ждать. Для частной клиники это, честно говоря, очень странный сервис.

2. **User input**
- kind: test_input
- actor: learner message supplied by regression script
- source: scripted_test_input
> Здравствуйте. Спасибо, что сказали об этом. Понимаю, что такая ситуация неприятна, и давайте я уточню детали, чтобы корректно зафиксировать обращение.

**Live LLM reply**
- kind: live_llm_output
- actor: buyer-agent / LLM response observed during this run
- source: llm_generated_via_public_api
> Спасибо. Я была записана на 18:00. Приём начался где-то около 18:40. Но дело не только в самой задержке — меня больше возмутило, что на ресепшене мне несколько раз говорили «ещё немного», но без конкретики. Я отпрашивалась с работы, подстраивала график, а в итоге просто сидела без понимания, что происходит.

Raw API metadata:
- status: active
- rude: no
- confidence: 0.99

3. **User input**
- kind: test_input
- actor: learner message supplied by regression script
- source: scripted_test_input
> Подскажите, пожалуйста, на какое время вы были записаны и примерно сколько в итоге ждали после назначенного времени?

**Live LLM reply**
- kind: live_llm_output
- actor: buyer-agent / LLM response observed during this run
- source: llm_generated_via_public_api
> Я уже сказала — на 18:00, ждала около 40 минут. Но, повторюсь, проблема не только в цифрах. Меня не проинформировали нормально, не объяснили причину. Сотрудники говорили очень формально, без попытки реально сориентировать. Для платной клиники это странно.

Raw API metadata:
- status: active
- rude: no
- confidence: 0.99

4. **User input**
- kind: test_input
- actor: learner message supplied by regression script
- source: scripted_test_input
> Правильно понимаю, что вас задела не только сама задержка, но и то, что вам не дали ясного понимания по срокам ожидания?

**Live LLM reply**
- kind: live_llm_output
- actor: buyer-agent / LLM response observed during this run
- source: llm_generated_via_public_api
> Именно так. Если бы мне честно сказали: «Извините, будет задержка минут 40, потому что…», я бы, возможно, просто вышла погулять или перестроила планы. А так я просто сидела в неведении, и это очень портило впечатление. Сам врач, кстати, был вполне нормальный, но сервисная часть всё испортила.

Raw API metadata:
- status: active
- rude: no
- confidence: 0.99

5. **User input**
- kind: test_input
- actor: learner message supplied by regression script
- source: scripted_test_input
> Тогда я зафиксирую жалобу именно по сервисной части: длительное ожидание, отсутствие понятного информирования и то, как с вами коммуницировали сотрудники.

**Live LLM reply**
- kind: live_llm_output
- actor: buyer-agent / LLM response observed during this run
- source: llm_generated_via_public_api
> Хорошо. А что дальше? Просто зафиксировать — это одно. Мне важно, чтобы это не осталось просто записью где-то в базе. Я сейчас сомневаюсь, стоит ли вообще снова к вам обращаться.

Raw API metadata:
- status: active
- rude: no
- confidence: 0.99

6. **User input**
- kind: test_input
- actor: learner message supplied by regression script
- source: scripted_test_input
> Я отмечу, что вам важна содержательная обратная связь по итогам разбора, и сразу зафиксирую удобный канал связи, чтобы следующий шаг был понятным.

**Live LLM reply**
- kind: live_llm_output
- actor: buyer-agent / LLM response observed during this run
- source: llm_generated_via_public_api
> Да, лучше по телефону. И хотелось бы понимать, в какие сроки ждать ответа. Просто «мы разберёмся» — это слишком размыто.

Raw API metadata:
- status: active
- rude: no
- confidence: 0.99

