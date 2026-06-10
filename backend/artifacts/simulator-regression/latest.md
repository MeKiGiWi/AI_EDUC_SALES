# Simulator regression report

Generated at: 2026-06-10T21:23:38.302479+00:00
Base URL: http://127.0.0.1:8000
Strict mode: false

## Summary

| Case | Scenario | API status | Heuristic status | Turns |
|---|---|---:|---|---:|
| role_copy_guard_baseline | baseline | ok | WARN | 3 |
| realistic_baseline_discovery | baseline | ok | PASS | 5 |
| realistic_objection_and_next_step | price-objection | ok | PASS | 5 |

## Case: role_copy_guard_baseline

Scenario: baseline
Session ID: `67fef374-061a-47e1-b1f9-4bd1b4d7cdb7`

### Heuristic checks

- role_drift_seller_language: PASS
- refusal_or_session_stop: WARN
- empty_customer_reply: PASS

### Transcript

1. API opening message:
- kind: live_api_payload
- actor: scenario opening returned by API
- source: default_api_opening_message
> Добрый день. Ищу решение по кондиционированию цеха. Разослал запрос нескольким поставщикам, смотрю варианты.

2. **User input**
- kind: test_input
- actor: learner message supplied by regression script
- source: copied_from_customer_opening
> Добрый день. Ищу решение по кондиционированию цеха. Разослал запрос нескольким поставщикам, смотрю варианты.

**Live LLM reply**
- kind: live_llm_output
- actor: buyer-agent / LLM response observed during this run
- source: llm_generated_via_public_api
> Мне важно держаться в рамках рабочего разговора про задачу и продукт. Давайте вернёмся к теме разговора и продолжим обсуждать именно её.

Raw API metadata:
- status: active
- rude: no
- confidence: 0.96

3. **User input**
- kind: test_input
- actor: learner message supplied by regression script
- source: copied_from_last_llm_reply
> Мне важно держаться в рамках рабочего разговора про задачу и продукт. Давайте вернёмся к теме разговора и продолжим обсуждать именно её.

**Live LLM reply**
- kind: live_llm_output
- actor: buyer-agent / LLM response observed during this run
- source: llm_generated_via_public_api
> Добрый день. Да, я как раз ищу решение для цеха. У вас есть опыт работы с производственными помещениями?

Raw API metadata:
- status: active
- rude: no
- confidence: 0.93

4. **User input**
- kind: test_input
- actor: learner message supplied by regression script
- source: copied_from_last_llm_reply
> Добрый день. Да, я как раз ищу решение для цеха. У вас есть опыт работы с производственными помещениями?

**Live LLM reply**
- kind: live_llm_output
- actor: buyer-agent / LLM response observed during this run
- source: llm_generated_via_public_api
> Похоже, мы ушли от темы учебного диалога по продажам. Я завершу эту сессию, чтобы не продолжать разговор вне сценария.

Raw API metadata:
- status: finished
- rude: no
- confidence: 0.96


## Case: realistic_baseline_discovery

Scenario: baseline
Session ID: `ab53827f-574f-48eb-944d-8fb2962c79a3`

### Heuristic checks

- role_drift_seller_language: PASS
- refusal_or_session_stop: PASS
- empty_customer_reply: PASS

### Transcript

1. API opening message:
- kind: live_api_payload
- actor: scenario opening returned by API
- source: default_api_opening_message
> Добрый день. Ищу решение по кондиционированию цеха. Разослал запрос нескольким поставщикам, смотрю варианты.

2. **User input**
- kind: test_input
- actor: learner message supplied by regression script
- source: scripted_test_input
> Чтобы не присылать общий шаблон, подскажите, что сейчас происходит в цеху и почему задача стала актуальной?

**Live LLM reply**
- kind: live_llm_output
- actor: buyer-agent / LLM response observed during this run
- source: llm_generated_via_public_api
> В цеху стало жарко, особенно в последние месяцы. Люди жалуются, и это уже начинает сказываться на работе — производительность падает. Нужно решать вопрос, пока не пошли срывы по заказам.

Raw API metadata:
- status: active
- rude: no
- confidence: 0.96

3. **User input**
- kind: test_input
- actor: learner message supplied by regression script
- source: scripted_test_input
> Правильно понимаю, что вопрос не только в комфорте, но и в риске просадки производительности или сроков?

**Live LLM reply**
- kind: live_llm_output
- actor: buyer-agent / LLM response observed during this run
- source: llm_generated_via_public_api
> Именно так. Если температура продолжит мешать работе, мы можем не уложиться в плановые показатели. А срывы сроков — это уже серьезные убытки и репутационные риски.

Raw API metadata:
- status: active
- rude: no
- confidence: 0.98

4. **User input**
- kind: test_input
- actor: learner message supplied by regression script
- source: scripted_test_input
> Что для вас будет главным критерием: стабильность температуры, монтаж без простоя, стоимость эксплуатации или что-то ещё?

**Live LLM reply**
- kind: live_llm_output
- actor: buyer-agent / LLM response observed during this run
- source: llm_generated_via_public_api
> В первую очередь — стабильность и надёжность. Остановки производства на долгий монтаж крайне нежелательны. И конечно, чтобы потом не было головной боли с обслуживанием.

Raw API metadata:
- status: active
- rude: no
- confidence: 0.97

5. **User input**
- kind: test_input
- actor: learner message supplied by regression script
- source: scripted_test_input
> Тогда ценность решения стоит сравнивать не только по цене, а по тому, снизит ли оно риск простоя и проблем в эксплуатации.

**Live LLM reply**
- kind: live_llm_output
- actor: buyer-agent / LLM response observed during this run
- source: llm_generated_via_public_api
> Да, логично. Мне нужен не просто кондиционер, а решение, которое реально работает в условиях цеха и не создаёт новых проблем. У вас есть опыт с такими задачами?

Raw API metadata:
- status: active
- rude: no
- confidence: 0.96

6. **User input**
- kind: test_input
- actor: learner message supplied by regression script
- source: scripted_test_input
> Предлагаю подготовить короткую сверку по вашим критериям и созвониться на 15 минут завтра после обеда. Такой формат подойдёт?

**Live LLM reply**
- kind: live_llm_output
- actor: buyer-agent / LLM response observed during this run
- source: llm_generated_via_public_api
> Да, завтра после 15:00 — подойдёт. Пришлите, пожалуйста, материалы сегодня, чтобы я успел ознакомиться.

Raw API metadata:
- status: active
- rude: no
- confidence: 0.99


## Case: realistic_objection_and_next_step

Scenario: price-objection
Session ID: `883b6939-963c-400b-9fe7-e2195c6efc86`

### Heuristic checks

- role_drift_seller_language: PASS
- refusal_or_session_stop: PASS
- empty_customer_reply: PASS

### Transcript

1. API opening message:
- kind: live_api_payload
- actor: scenario opening returned by API
- source: default_api_opening_message
> Мы сейчас рассматриваем ваше решение, но цена кажется немного высокой по сравнению с конкурентами. Почему нам не выбрать более дешевый вариант?

2. **User input**
- kind: test_input
- actor: learner message supplied by regression script
- source: scripted_test_input
> Понимаю ваше сомнение, спорить с ощущением высокой цены точно не хочу.

**Live LLM reply**
- kind: live_llm_output
- actor: buyer-agent / LLM response observed during this run
- source: llm_generated_via_public_api
> Да, я как раз и хочу понять, за что мы переплачиваем. У конкурентов вроде бы похожие характеристики, а разница в стоимости ощутимая.

Raw API metadata:
- status: active
- rude: no
- confidence: 0.96

3. **User input**
- kind: test_input
- actor: learner message supplied by regression script
- source: scripted_test_input
> Подскажите, пожалуйста, с чем именно вы сейчас сравниваете нашу цену: с другим поставщиком, внутренним бюджетом или прошлым проектом?

**Live LLM reply**
- kind: live_llm_output
- actor: buyer-agent / LLM response observed during this run
- source: llm_generated_via_public_api
> Сравниваю с двумя другими поставщиками, которые тоже прислали КП. У них цифры ниже при схожих заявленных мощностях.

Raw API metadata:
- status: active
- rude: no
- confidence: 0.94

4. **User input**
- kind: test_input
- actor: learner message supplied by regression script
- source: scripted_test_input
> Если смотреть шире цены закупки, где для вас самый чувствительный риск: простой на монтаже, нестабильная работа системы или дальнейшая эксплуатация?

**Live LLM reply**
- kind: live_llm_output
- actor: buyer-agent / LLM response observed during this run
- source: llm_generated_via_public_api
> Пожалуй, самый чувствительный — это простой на монтаже. Остановить цех даже на пару дней — это огромные убытки. Но и нестабильная работа потом тоже никому не нужна.

Raw API metadata:
- status: active
- rude: no
- confidence: 0.97

5. **User input**
- kind: test_input
- actor: learner message supplied by regression script
- source: scripted_test_input
> Предлагаю сравнить варианты на одной понятной рамке: цена входа, риск простоя, срок монтажа и стоимость эксплуатации на дистанции.

**Live LLM reply**
- kind: live_llm_output
- actor: buyer-agent / LLM response observed during this run
- source: llm_generated_via_public_api
> Это разумный подход. Но у вас по срокам монтажа что-то конкретное есть? У конкурентов обещают уложиться в выходные, чтобы не останавливать производство.

Raw API metadata:
- status: active
- rude: no
- confidence: 0.96

6. **User input**
- kind: test_input
- actor: learner message supplied by regression script
- source: scripted_test_input
> Если вам ок, я подготовлю короткое сравнение по этим критериям и завтра коротко созвонимся на 15 минут без обязательств.

**Live LLM reply**
- kind: live_llm_output
- actor: buyer-agent / LLM response observed during this run
- source: llm_generated_via_public_api
> Хорошо, подготовьте. Но только если там будут конкретные цифры по срокам и гарантиям, а не общие слова.

Raw API metadata:
- status: active
- rude: no
- confidence: 0.98

