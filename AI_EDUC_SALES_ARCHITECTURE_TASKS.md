# AI Sales Academy: задачи на упрощение архитектуры, отчеты и backend session flow

Дата анализа: 2026-05-05
Архив: `AI_EDUC_SALES-dialogueokoshko 2.zip`
Цель: довести репозиторий до максимально простой, логичной и предсказуемой архитектуры; убрать backend locks; сделать отчеты удобными, сохраняемыми и открываемыми из нормальных точек UI.

---

## 0. Что сейчас происходит в архитектуре

### Frontend

- Приложение стартует из `App.tsx` и использует локальный state-router в `src/navigation/AppNavigator.tsx`.
- В `RootStackParamList` уже объявлены маршруты `Reports` и `ReportViewer`, но `AppNavigator` фактически рендерит только `StudentHome` и `Simulator`.
- `tabsByRole` разрешает только `StudentHome` и `Simulator`; из-за этого `Reports` и `ReportViewer` сейчас запрещены логикой `isRouteAllowedForRole()`.
- `StudentHomeScreen` работает от `salesAcademyMock`, а не от `academyDataService`; история отчетов и последний отчет — статический mock.
- `SimulatorScreen` умеет стартовать/вести/завершать backend-сессию через `simulatorApiService`, но при завершении игнорирует `evaluation` из `finishDialogueSession()`.
- Сервисы отчетов уже есть: `reportApiService`, `reportStorageService`, `academyDataService.saveLatestSimulatorReport()`, но основной navigator и simulator flow их не используют.
- `ReportsScreen` и `ReportViewerScreen` уже есть, но не включены в runtime-поток приложения.

### Backend

- Backend — `FastAPI + LangGraph + SQLAlchemy`.
- Активные диалоговые сессии лежат в process-local `InMemorySessionStore` (`backend/app/runtime.py`, `backend/app/store.py`).
- Отчеты сохраняются в SQL через `ReportRecord` (`backend/app/report_entities.py`) и API `/api/v1/reports`.
- `POST /api/v1/simulator/sessions/{session_id}/finish` возвращает `evaluation`, но сам отчет не создает.
- `backend/app/api.py` содержит `SESSION_LOCKS: dict[str, asyncio.Lock]` и `async with lock` на отправке сообщений; это усложняет модель и противоречит желаемой архитектуре “одна сессия доступна одному пользователю”.

---

## 1. Главные найденные проблемы

1. **Отчеты не сохраняются после завершения диалога.**
   `SimulatorScreen.handleFinishSession()` вызывает `finishDialogueSession(sessionId)`, но не берет `response.evaluation` и не вызывает `academyDataService.saveLatestSimulatorReport()`.

2. **Отчеты невозможно нормально открыть из UI.**
   `Reports` и `ReportViewer` объявлены в routes, но не разрешены в `tabsByRole` и не рендерятся в `AppNavigator`.

3. **Кнопка “Открыть” в главной карточке последнего отчета ведет в тренажер, а не в отчет.**
   В `StudentHomeScreen` `PrimaryActionButton label="Открыть"` вызывает `onOpenTrainer(...)`.

4. **Главная вкладка показывает mock-отчеты, не связанные с реально сохраненными отчетами.**
   `StudentHomeScreen` читает `salesAcademyMock.lastReport` и `salesAcademyMock.reportHistory`.

5. **Сценарии frontend и backend не совпадают.**
   Frontend использует сценарии `price-objection`, `competitor-comparison`, `timeline-negotiation`, а backend знает только `baseline`. Сейчас `SimulatorScreen` молча fallback-ится на первый backend-сценарий, поэтому пользователь выбирает один кейс, а проходит другой.

6. **`Continue chat` из отчетов почти всегда не может открыть правильный сценарий.**
   `ReportCard.scenarioId` есть в frontend type, но backend DTO его не возвращает, а local `SavedSimulatorReport` его не сохраняет.

7. **Report DTO backend беднее frontend-модели.**
   Backend `ReportCardDto` не возвращает `scenarioId`, `scenarioTitle`, `createdAt`, `status`, `sourceLabel`, `sessionId`, хотя frontend либо ожидает эти поля, либо строит UX вокруг них.

8. **`GET /reports` не фильтрует по роли и владельцу.**
   `reportApiService.fetchReports(_role?: UserRole)` принимает role, но игнорирует ее; backend возвращает общий пул отчетов.

9. **Backend lock на сессию не нужен в желаемой модели и еще и течет по памяти.**
   `SESSION_LOCKS` пополняется на каждый `session_id` и удаляется только при 404, но не после нормального завершения сессии.

10. **Дублирование PDF/CSV export logic.**
    Большой блок генерации PDF/CSV лежит в `ReportsScreen.tsx` и почти такой же код есть в `reportExportService.web.ts`. `ReportViewerScreen` импортирует `downloadReportFile` из другого screen-файла, что создает плохую зависимость screen → screen.

11. **Есть no-op кнопки, нарушающие правило “каждое действие имеет результат”.**
    Примеры: `StudentHomeScreen` PDF/CSV, pagination, help/status buttons; `DesktopSidebar` “На лендинг”; `SimulatorScreen` круглые кнопки.

12. **`simulatorApiService` теряет backend detail.**
    В `requestJson()` вычисляется `detailMessage`, но наружу бросается generic `SimulatorApiError("Произошла ошибка при обращении к серверу.")`; пользователь не видит полезный текст backend-ошибки.

13. **`build_graph(agents_config)` принимает конфиг, но фактически игнорирует его.**
    В `backend/app/runtime.py` граф кешируется через `_get_compiled_graph()` с новым `AgentsConfig()`, а аргумент `agents_config` не влияет на результат.

14. **Конфиги лимитов расходятся.**
    В `.env.example` есть `MIN_MANAGER_TURNS=10`, но backend использует hardcoded `MIN_REPLIES_FOR_CONFIDENT_EVALUATION = 10`, frontend использует `MANAGER_REPLY_TARGET = 10`.

15. **`backend/openapi.json` выглядит устаревшим.**
    В нем есть `/api/v1/reports/{report_id}/export/pdf` и `/csv`, которых нет в текущем `backend/app/api_reports.py`.

16. **Backend README устарел.**
    Он ссылается на файлы `simulator_agents.py`, `simulator_graph.py`, `simulator_api.py`, которых уже нет в текущей структуре.

17. **Слой данных frontend не является source of truth.**
    Есть `academyDataService`, но `AppNavigator` напрямую использует `salesAcademyMock`, из-за чего реальные reports API/local storage не попадают на экраны.

---

## 2. Последовательные задачи

Ниже задачи написаны как точечные engineering tasks. Codex должен выполнять их строго по порядку, по одной за запуск.

---

### [x] Задача 01 — Убрать backend session locks

**Файлы:**

- `backend/app/api.py`
- `backend/tests/test_simulator_api.py` или новый тест рядом

**Что сделать:**

1. Удалить `import asyncio` из `backend/app/api.py`.
2. Удалить глобальный `SESSION_LOCKS`.
3. Удалить `lock = SESSION_LOCKS.setdefault(...)` и `async with lock:` из `reply_to_sales()`.
4. Оставить простую последовательность:
   - достать session из `SESSION_STORE`;
   - если нет — 404;
   - если `finished` — 409;
   - вызвать graph;
   - вернуть response.
5. Не добавлять другой lock, mutex, semaphore или global per-session queue.
6. Добавить/обновить тест, который гарантирует, что отправка сообщения работает без `SESSION_LOCKS`.

**Критерии приемки:**

- В backend-коде нет `SESSION_LOCKS`, `asyncio.Lock`, `async with lock`, `threading.Lock`, `Semaphore`.
- `POST /sessions/{session_id}/messages` по-прежнему возвращает 200 для активной сессии, 404 для неизвестной, 409 для finished.
- Поведение session lifecycle осталось прежним, кроме удаления lock.

**Проверка Codex:**

- Выполнить `grep -R "SESSION_LOCKS\|asyncio.Lock\|threading.Lock\|Semaphore\|async with lock" -n backend/app backend/tests` и убедиться, что нет lock-реализации.
- Выполнить backend tests: `cd backend && pytest`.
- Если зависимости не установлены локально, зафиксировать это в журнале выполнения и проверить хотя бы статически `python -m compileall app tests` после установки/наличия зависимостей.

**Журнал выполнения**

- Дата выполнения: 2026-05-05
- Измененные файлы: `AI_EDUC_SALES_ARCHITECTURE_TASKS.md`
- Запущенные проверки: `grep -R "SESSION_LOCKS\|asyncio.Lock\|threading.Lock\|Semaphore\|async with lock" -n backend/app backend/tests`, `cd backend && pytest`
- Результат проверок: grep не нашел lock-реализаций; `pytest` — `28 passed, 2 skipped`
- Известные ограничения: lock-механика уже отсутствовала в текущем backend-коде до этой итерации, поэтому задача закрыта через верификацию и фиксацию статуса в backlog.

---

### [x] Задача 02 — Сделать report contract полноценным и idempotent по session_id

**Файлы:**

- `backend/app/models.py`
- `backend/app/report_entities.py`
- `backend/app/report_mapper.py`
- `backend/app/report_repository.py`
- `backend/app/report_service.py`
- `backend/tests/test_reports_api.py`

**Что сделать:**

1. Расширить `ReportCreateDto` полями:
   - `scenario_id: str | None`
   - `source_label: str | None`
2. Расширить `ReportCardDto` полями:
   - `scenarioId: str | None`
   - `scenarioTitle: str`
   - `status: ReportStatus`, где ready/error/draft/generating уже есть на frontend; на backend минимум `ready`.
   - `createdAt: str`
   - `sourceLabel: str | None`
   - `sessionId: str | None`
3. Добавить соответствующие columns в `ReportRecord`: `scenario_id`, `source_label`, `status`.
4. Добавить `ReportRepository.get_by_session_id(session_id)`.
5. В `ReportService.create_report()` сделать idempotency: если payload содержит `session_id` и отчет с таким `session_id` уже есть, вернуть существующий отчет вместо создания дубля.
6. В `to_report_card()` маппить все новые поля в frontend camelCase.
7. Обновить тесты на create/list/get так, чтобы они проверяли `scenarioId`, `scenarioTitle`, `status`, `createdAt`, `sourceLabel`, `sessionId` и отсутствие дубля при повторном POST с тем же `session_id`.

**Критерии приемки:**

- Повторный `POST /api/v1/reports` с тем же `session_id` не создает второй отчет.
- Frontend type `ReportCard` может быть заполнен backend response без optional-fallback для ключевых report fields.
- Старые отчеты без новых nullable-полей не ломают чтение, если используется SQLite dev DB.

**Проверка Codex:**

- Выполнить `cd backend && pytest tests/test_reports_api.py`.
- Проверить вручную через тест-клиент или curl: два одинаковых POST с одним `session_id` возвращают один и тот же `id`.
- Проверить, что `ReportCardDto` в OpenAPI содержит новые поля после регенерации/создания app.

**Журнал выполнения**

- Дата выполнения: 2026-05-05
- Измененные файлы: `backend/app/models.py`, `backend/app/report_entities.py`, `backend/app/report_mapper.py`, `backend/app/report_repository.py`, `backend/app/report_service.py`, `backend/tests/test_reports_api.py`, `backend/openapi.json`, `AI_EDUC_SALES_ARCHITECTURE_TASKS.md`
- Запущенные проверки: `cd backend && pytest tests/test_reports_api.py`, ручная проверка двойного `POST /api/v1/reports` через `httpx.AsyncClient`, `cd backend && make openapi`, `rg -n 'scenarioId|scenarioTitle|status|createdAt|sourceLabel|sessionId' backend/openapi.json`
- Результат проверок: `pytest` — `1 passed`; ручная idempotency-проверка вернула одинаковый `id` для двух `POST` с одним `session_id`; `openapi.json` содержит новые поля `ReportCardDto`
- Известные ограничения: совместимость обеспечена на уровне nullable-полей и безопасного чтения `NULL` значений; миграции существующей SQLite-схемы в рамках этой задачи не добавлялись.

---

### [x] Задача 03 — Привести frontend report types и services к backend contract

**Файлы:**

- `src/types/academy.ts`
- `src/services/reportApiService.ts`
- `src/services/reportStorageService.ts`
- `src/services/academyDataService.ts`

**Что сделать:**

1. Добавить `scenarioId`, `sourceLabel`, `sessionId` в `SavedSimulatorReport`.
2. Обновить `reportStorageService.save()` так, чтобы он принимал `scenarioId`, `sessionId`, `sourceLabel` и сохранял их.
3. Обновить `academyDataService.saveLatestSimulatorReport()`:
   - принимать `scenarioId`;
   - передавать `scenario_id` в backend;
   - для local fallback сохранять `scenarioId`, `sessionId`, `sourceLabel`.
4. Обновить `savedReportToReportCard()` так, чтобы local fallback возвращал `scenarioId`, `scenarioTitle`, `createdAt`, `status: "ready"`, `sourceLabel`, `sessionId`.
5. Убрать misleading comment `MVP: show the shared backend pool...` или заменить на честный комментарий после реализации role/filter behavior.
6. `reportApiService.fetchReports(role)` не должен молча игнорировать role. Либо добавить query `?role=...` и backend-фильтр в отдельной задаче, либо убрать параметр из сигнатуры. Для простоты предпочтительно добавить backend-фильтр в задаче 04.

**Критерии приемки:**

- Local fallback и backend-backed reports дают одинаковую форму `ReportCard`.
- `Continue chat` получает реальный `scenarioId`.
- В коде нет `_role` как признака игнорируемого параметра.

**Проверка Codex:**

- Выполнить `npm run typecheck`.
- Проверить grep: `grep -R "_role" -n src/services` не должен находить игнорируемый role parameter.
- Временно отключить backend URL и убедиться, что local save создает report с `scenarioId` и `sessionId`.

**Журнал выполнения**

- Дата выполнения: 2026-05-05
- Измененные файлы: `src/types/academy.ts`, `src/services/reportApiService.ts`, `src/services/reportStorageService.ts`, `src/services/academyDataService.ts`, `src/data/academyData.ts`, `src/screens/reports/ReportsScreen.tsx`, `src/screens/reports/ReportViewerScreen.tsx`, `AI_EDUC_SALES_ARCHITECTURE_TASKS.md`
- Запущенные проверки: `npm run typecheck`, `grep -R "_role" -n src/services`, попытка runtime-проверки local fallback через `npx tsx` с отключенным `EXPO_PUBLIC_SIMULATOR_API_URL`
- Результат проверок: `typecheck` прошел; `grep` не нашел `_role`; runtime-проверка plain Node не выполнилась из-за невозможности корректно поднять `react-native` модули вне Metro/Expo runtime
- Известные ограничения: local fallback path подтвержден статически по коду и типам, но отдельная внеприложная runtime-проверка без Metro/Expo окружения в этой итерации недоступна.

---

### [x] Задача 04 — Добавить простой backend-фильтр отчетов по role

**Файлы:**

- `backend/app/api_reports.py`
- `backend/app/report_repository.py`
- `backend/app/report_service.py`
- `backend/tests/test_reports_api.py`
- `src/services/reportApiService.ts`

**Что сделать:**

1. В `GET /api/v1/reports` добавить optional query param `role`.
2. Если `role` передан, возвращать только отчеты этой роли.
3. Если `role` не передан, оставить текущее поведение: вернуть все отчеты.
4. В `reportApiService.fetchReports(role)` передавать `?role=${role}`.
5. Обновить тесты backend: создать student и manager report, проверить list all и list role-filtered.

**Критерии приемки:**

- `GET /api/v1/reports?role=student` возвращает только student reports.
- `GET /api/v1/reports` возвращает все reports.
- Frontend больше не показывает manager/hr/admin reports в student workspace.

**Проверка Codex:**

- Выполнить `cd backend && pytest tests/test_reports_api.py`.
- Выполнить `npm run typecheck`.
- Проверить, что `reportApiService.fetchReports("student")` реально строит URL с role query.

**Журнал выполнения**

- Дата выполнения: 2026-05-05
- Измененные файлы: `backend/app/api_reports.py`, `backend/app/report_repository.py`, `backend/app/report_service.py`, `backend/tests/test_reports_api.py`, `src/services/reportApiService.ts`, `src/services/academyDataService.ts`, `AI_EDUC_SALES_ARCHITECTURE_TASKS.md`
- Запущенные проверки: `cd backend && pytest tests/test_reports_api.py`, `npm run typecheck`, ручная проверка `reportApiService.fetchReports("student")` через подмененный `fetch` и `npx tsx`
- Результат проверок: `pytest` — `1 passed`; `typecheck` прошел; ручная проверка показала URL `https://backend.test/api/v1/reports?role=student`
- Известные ограничения: фильтр по `role` минимальный и работает только по уже сохраненному полю `role` без user-level ownership.

---

### [x] Задача 05 — Подключить Reports и ReportViewer в AppNavigator

**Файлы:**

- `src/navigation/AppNavigator.tsx`
- `src/navigation/routes.ts`
- `src/screens/reports/ReportsScreen.tsx`
- `src/screens/reports/ReportViewerScreen.tsx`
- при необходимости `src/components/layout/DesktopSidebar.tsx`, `src/components/layout/BottomTabs.tsx`

**Что сделать:**

1. В `tabsByRole` добавить `Reports` хотя бы для `student`; если роли пока не реализованы, одинаково добавить для всех текущих ролей.
2. Разрешить `ReportViewer`, если роль имеет доступ к `Reports`.
3. В `AppNavigator` добавить state `reports`, `reportsLoading`, `reportsError`.
4. Загружать reports через `academyDataService.getReports(activeRole)` при старте и при изменении роли.
5. Рендерить `ReportsScreen` при route `Reports`.
6. Рендерить `ReportViewerScreen` при route `ReportViewer`.
7. `onOpenReport(reportId)` должен навигировать в `ReportViewer`.
8. `onBack` в viewer должен вести в `Reports`, а не в trainer.
9. `onContinueChat(scenarioId)` должен запускать сценарий, если `scenarioId` есть; иначе открывать catalog.

**Критерии приемки:**

- В боковом/нижнем меню есть вкладка “Отчеты”.
- Нажатие “Открыть” на report card открывает `ReportViewer`, а не диалог.
- Назад из viewer возвращает во вкладку отчетов.
- Приложение не падает, если report по id не найден: показывается EmptyState.

**Проверка Codex:**

- Выполнить `npm run typecheck`.
- Ручной smoke test в web: открыть приложение → вкладка “Отчеты” → открыть отчет → назад.
- Проверить, что `AppNavigator.tsx` больше не рендерит только два экрана.

**Журнал выполнения**

- Дата выполнения: 2026-05-05
- Измененные файлы: `src/navigation/AppNavigator.tsx`, `src/navigation/routes.ts`, `AI_EDUC_SALES_ARCHITECTURE_TASKS.md`
- Запущенные проверки: `npm run typecheck`, grep-проверка по `AppNavigator.tsx`, ручной web smoke test через Expo web + in-app browser
- Результат проверок: `typecheck` прошел; `AppNavigator.tsx` теперь рендерит `ReportsScreen` и `ReportViewerScreen`; web smoke test `Отчеты → Открыть → Назад` пройден
- Известные ограничения: для smoke test понадобилось поднять backend на временной SQLite DB и открыть Expo web на `localhost:8081`, потому что CORS backend разрешает web-порты `3000|8081|19006`, а запуск на `19007` честно уходил в пустой fallback.

---

### [x] Задача 06 — Исправить finish flow: сохранять отчет и открывать его после завершения

**Файлы:**

- `src/screens/simulator/SimulatorScreen.tsx`
- `src/navigation/AppNavigator.tsx`
- `src/services/academyDataService.ts`
- `src/types/academy.ts`

**Что сделать:**

1. Изменить props `SimulatorScreen` / `DialogueView`: `onFinishScenario` должен принимать payload завершения:
   - `scenarioId`
   - `scenarioTitle`
   - `sessionId`
   - `evaluation`
2. В `handleFinishSession()` сохранить `const response = await simulatorApiService.finishDialogueSession(sessionId)`.
3. Если `response.evaluation` есть:
   - вызвать `onFinishScenario({ scenarioId: selectedScenario.id, scenarioTitle: selectedScenario.title, sessionId, evaluation: response.evaluation })`.
4. В `AppNavigator.completeScenario()` вызвать `academyDataService.saveLatestSimulatorReport(...)`, обновить `reports` state и открыть `ReportViewer` для созданного/последнего report.
5. Если evaluation нет, показать понятное сообщение и вернуться в Reports или Home без создания пустого report.
6. Защититься от double click на “Завершить”: `busy` уже есть, но после нажатия кнопка должна быть disabled/visual no-op до ответа.

**Критерии приемки:**

- После завершения диалога report сохраняется.
- Пользователь автоматически видит новый отчет или попадает в Reports с новым report наверху.
- Повторный finish для той же session не создает дубль благодаря задаче 02.
- Если backend reports недоступен, local fallback сохраняет отчет.

**Проверка Codex:**

- Выполнить `npm run typecheck`.
- Ручной smoke test с backend: начать scenario → отправить хотя бы одно сообщение → завершить → убедиться, что открылся report.
- Проверить local fallback: временно отключить `EXPO_PUBLIC_SIMULATOR_API_URL`, мокнуть/подставить evaluation или проверить unit-level save path.

**Журнал выполнения**

- Дата выполнения: 2026-05-05
- Измененные файлы: `src/navigation/AppNavigator.tsx`, `src/screens/simulator/SimulatorScreen.tsx`, `AI_EDUC_SALES_ARCHITECTURE_TASKS.md`
- Запущенные проверки: `npm run typecheck`, ручной web smoke test с backend reports, ручной web smoke test без backend для local fallback
- Результат проверок: `typecheck` прошел; при доступном backend finish flow сохранил отчет и сразу открыл `ReportViewer`; при недоступном backend local fallback также сохранил отчет и открыл `ReportViewer`
- Известные ограничения: текущий simulator flow в репозитории по-прежнему mock-oriented и еще не использует полноценный `simulatorApiService`/backend session lifecycle; в этой задаче исправлен именно finish/save/open-report path поверх существующего simulator UI.

---

### [x] Задача 07 — Исправить главную вкладку: “Последний отчет” и “История отчетов” должны работать с реальными reports

**Файлы:**

- `src/screens/student/StudentHomeScreen.tsx`
- `src/navigation/AppNavigator.tsx`
- `src/types/academy.ts`
- при необходимости новый mapper в `src/services/academyDataService.ts`

**Что сделать:**

1. Передавать в `StudentHomeScreen` реальные `reports: ReportCard[]` из `AppNavigator`.
2. Блок “Последний отчет” строить из `reports[0]`, а не из `salesAcademyMock.lastReport`.
3. Если отчетов нет — показать EmptyState/CTA “Начать тренировку”.
4. Кнопка “Открыть” в блоке последнего отчета должна вызывать `onOpenReport(lastReport.id)`.
5. Кнопки PDF/CSV должны вызывать реальный export для последнего отчета или открывать понятное сообщение, если export недоступен.
6. “История отчетов” должна показывать реальные reports, а не `salesAcademyMock.reportHistory`.
7. Убрать hardcoded pagination “Показано 1–5 из 18 отчетов” или сделать ее честной по длине `reports`.

**Критерии приемки:**

- Из главной вкладки отчет открывается как отчет, а не как диалог.
- После завершения новой симуляции главная показывает именно новый report.
- Если reports пусты, нет fake history.

**Проверка Codex:**

- Выполнить `npm run typecheck`.
- Ручной smoke test: завершить диалог → вернуться на главную → “Открыть” открывает viewer нового report.
- Проверить grep: `StudentHomeScreen` не должен читать `data.lastReport` и `data.reportHistory` для основного report UI.

**Журнал выполнения**

- Дата выполнения: 2026-05-05
- Измененные файлы: `src/screens/student/StudentHomeScreen.tsx`, `src/navigation/AppNavigator.tsx`, `AI_EDUC_SALES_ARCHITECTURE_TASKS.md`
- Запущенные проверки: `npm run typecheck`, `grep -R "lastReport\\|reportHistory" -n src/screens/student/StudentHomeScreen.tsx src/navigation/AppNavigator.tsx`, ручной web smoke test `finish → home → открыть отчет`
- Результат проверок: `typecheck` прошел; grep по `StudentHomeScreen`/`AppNavigator` больше не находит использование `data.lastReport` и `data.reportHistory` для основного report UI; после завершения диалога главная показывает новый report, а кнопка `Открыть` ведет в `ReportViewer`
- Известные ограничения: блок рекомендаций справа на главной пока остается из существующих mock-данных, а не из report payload; основная report-зона и история уже переведены на реальные `reports`.

---

### [x] Задача 08 — Синхронизировать сценарии frontend и backend

**Файлы:**

- `backend/kb/scenarios/scenarios.json`
- `backend/kb/scenarios/*.md`
- `src/data/salesAcademyMock.ts` или лучше новый единый сценарный mapper/service
- `src/screens/simulator/SimulatorScreen.tsx`
- `src/screens/scenarios/ScenariosScreen.tsx`

**Что сделать:**

1. Убрать silent fallback “выбран один сценарий, backend запускает первый доступный”.
2. Выбрать простой source of truth:
   - предпочтительно backend `/api/v1/simulator/scenarios` для runtime-сценариев;
   - local fallback только если backend отключен.
3. Привести ids frontend-сценариев и backend-сценариев к одному набору.
4. Если выбранный scenarioId отсутствует на backend, показать явное сообщение и не стартовать другой сценарий молча.
5. Добавить backend scenarios под текущие UI-кейсы (`price-objection`, `competitor-comparison`, `timeline-negotiation`, `cold-call`, `upsell`, `customer-return`) или сократить UI до реально доступного `baseline`.

**Критерии приемки:**

- Пользователь всегда проходит именно тот сценарий, который выбрал.
- Нет молчаливой подмены на `baseline`.
- `scenarioId` в report соответствует выбранному сценарию.

**Проверка Codex:**

- Выполнить `npm run typecheck`.
- Выполнить backend tests.
- Ручной test: выбрать `price-objection`, убедиться, что start session уходит с `scenario_id=price-objection`; если backend не знает id, UI показывает ошибку, а не запускает baseline.

**Журнал выполнения**

- Дата выполнения: 2026-05-05
- Измененные файлы: `backend/kb/scenarios/scenarios.json`, `backend/kb/scenarios/price-objection.md`, `backend/kb/scenarios/competitor-comparison.md`, `backend/kb/scenarios/timeline-negotiation.md`, `backend/kb/scenarios/cold-call.md`, `backend/kb/scenarios/upsell.md`, `backend/kb/scenarios/customer-return.md`, `backend/tests/test_simulator_api.py`, `src/navigation/AppNavigator.tsx`, `src/screens/simulator/SimulatorScreen.tsx`, `src/data/simulatorMvpData.ts`, `AI_EDUC_SALES_ARCHITECTURE_TASKS.md`
- Запущенные проверки: `npm run typecheck`, `cd backend && pytest tests/test_simulator_api.py`, `cd backend && pytest`, ручной web/network test для `price-objection`, ручная UI-проверка error-path с принудительным `404` на start session
- Результат проверок: `typecheck` прошел; `tests/test_simulator_api.py` — `7 passed`; полный backend `pytest` — `28 passed, 2 skipped`; network request старта ушел с `{"scenario_id":"price-objection","difficulty":"medium"}`; при `404` UI показал ошибку и остался в каталоге без fallback на baseline
- Известные ограничения: основной simulator UI все еще mock-dialogue oriented; в этой задаче синхронизированы `scenarioId` и backend validation на старте, но не весь runtime чата.

---

### [x] Задача 09 — Вынести PDF/CSV export из screens в сервис

**Файлы:**

- `src/services/reportExportService.ts`
- `src/services/reportExportService.web.ts`
- `src/screens/reports/ReportsScreen.tsx`
- `src/screens/reports/ReportViewerScreen.tsx`

**Что сделать:**

1. Оставить всю web-реализацию PDF/CSV только в `reportExportService.web.ts`.
2. В `ReportsScreen` удалить локальные функции export generation (`buildCsv`, canvas/pdf helpers, `downloadReportFile`).
3. В `ReportViewerScreen` убрать импорт из `./ReportsScreen`.
4. Оба screen должны использовать единый API сервиса, например `downloadReportFile(report, format)` или `openExport(report, format)`.
5. Native fallback должен оставаться в `reportExportService.ts`.

**Критерии приемки:**

- Нет зависимости `ReportViewerScreen -> ReportsScreen`.
- Нет дублирования больших PDF/canvas функций в screen-файлах.
- Export behavior одинаковый из списка и viewer.

**Проверка Codex:**

- Выполнить `npm run typecheck`.
- Проверить grep: `grep -R "from \"./ReportsScreen\"\|buildPdfBlob\|createCanvasContext" -n src/screens src/services` — генерация должна быть только в service layer.
- Ручной web test: скачать PDF и CSV из Reports и из ReportViewer.

**Журнал выполнения**

- Дата выполнения: 2026-05-05
- Измененные файлы: `src/services/reportExportService.ts`, `src/services/reportExportService.web.ts`, `src/screens/reports/ReportViewerScreen.tsx`, `src/components/reports/ReportCardItem.tsx`, `src/screens/student/StudentHomeScreen.tsx`, `AI_EDUC_SALES_ARCHITECTURE_TASKS.md`
- Запущенные проверки: `npm run typecheck`, `grep -R "from \"./ReportsScreen\"\|buildPdfBlob\|createCanvasContext" -n src/screens src/services`, ручной web smoke test `Reports -> PDF/CSV`, `ReportViewer -> PDF/CSV`
- Результат проверок: `typecheck` прошел; grep показал `buildPdfBlob` и `createCanvasContext` только в `src/services/reportExportService.web.ts`; `ReportViewerScreen` больше не импортирует `ReportsScreen`; web smoke test подтвердил успешные сообщения для PDF/CSV из списка и viewer
- Известные ограничения: native fallback по-прежнему остается информационным и не генерирует реальные файлы вне web, что соответствует текущему scope сервиса.

---

### [x] Задача 10 — Убрать dead preview sheet из ReportsScreen

**Файлы:**

- `src/screens/reports/ReportsScreen.tsx`

**Что сделать:**

1. Найти `ReportsSheetState` variant `{ kind: "preview"; report: ReportCard }`.
2. Если preview больше не используется, удалить этот variant и JSX для preview sheet.
3. Если нужен быстрый preview, подключить его явно отдельной кнопкой “Предпросмотр”; но предпочтительно не дублировать viewer и оставить только `ReportViewer`.

**Критерии приемки:**

- В `ReportsScreen` нет dead state, который никогда не устанавливается.
- Открытие report всегда идет через `ReportViewer`.

**Проверка Codex:**

- Выполнить `npm run typecheck`.
- Проверить grep: `grep -R "kind: \"preview\"\|sheetState\.report" -n src/screens/reports/ReportsScreen.tsx` не должен находить dead preview path, если выбран вариант удаления.

**Журнал выполнения**

- Дата выполнения: 2026-05-05
- Измененные файлы: `AI_EDUC_SALES_ARCHITECTURE_TASKS.md`
- Запущенные проверки: `npm run typecheck`, `grep -R "kind: \"preview\"\|sheetState\.report" -n src/screens/reports/ReportsScreen.tsx`
- Результат проверок: `typecheck` прошел; grep не нашел `kind: "preview"` и `sheetState.report`, dead preview path в `ReportsScreen` отсутствует
- Известные ограничения: отдельный preview-sheet не добавлялся, открытие отчета остается только через `ReportViewer`, что и соответствует выбранному упрощению.

---

### [x] Задача 11 — Убрать no-op кнопки или дать им результат

**Файлы:**

- `src/screens/student/StudentHomeScreen.tsx`
- `src/screens/simulator/SimulatorScreen.tsx`
- `src/components/layout/DesktopSidebar.tsx`
- возможно другие файлы по grep `onPress={() => {}}`

**Что сделать:**

1. Найти все `onPress={() => {}}` в `src`.
2. Для каждой кнопки выбрать одно:
   - удалить кнопку;
   - disabled + понятная подпись, если функционал не готов;
   - подключить реальное действие;
   - показать bottom sheet / inline notice с объяснением.
3. Для StudentHome PDF/CSV подключить export из задачи 09.
4. Для “На лендинг” в `DesktopSidebar` подключить navigate `Landing` или убрать кнопку, если landing больше не нужен.
5. Для help/status круглых кнопок показать небольшой info sheet или убрать.

**Критерии приемки:**

- В `src` нет `onPress={() => {}}`.
- Каждое видимое действие дает результат.

**Проверка Codex:**

- Выполнить `grep -R "onPress={() => {}}" -n src` — результат пустой.
- Выполнить `npm run typecheck`.
- Ручной smoke test основных CTA.

**Журнал выполнения**

- Дата выполнения: 2026-05-05
- Измененные файлы: `src/screens/student/StudentHomeScreen.tsx`, `src/screens/simulator/SimulatorScreen.tsx`, `src/components/layout/DesktopSidebar.tsx`, `AI_EDUC_SALES_ARCHITECTURE_TASKS.md`
- Запущенные проверки: `grep -R "onPress={() => {}}" -n src`, `npm run typecheck`, ручной web smoke test helper CTA на `Главная` и `Тренажер`, ручная проверка перехода `На лендинг`
- Результат проверок: grep пустой; `typecheck` прошел; helper-кнопки на `Главная` и `Тренажер` открывают bottom sheet с объяснением; `На лендинг` теперь реально переводит в route `Landing`
- Известные ограничения: в `Landing` route пока нет отдельного полнофункционального продуктового потока, но кнопка больше не является no-op и выполняет понятную навигацию.

---

### [x] Задача 12 — Исправить отображение backend ошибок в simulatorApiService

**Файлы:**

- `src/services/simulatorApiService.ts`
- при необходимости `src/screens/simulator/SimulatorScreen.tsx`

**Что сделать:**

1. В `requestJson()` использовать вычисленный `detailMessage` как `message` в `SimulatorApiError`.
2. Сохранить `status`, `body`, `detail` как сейчас.
3. В `getSafeSimulatorErrorMessage()` для generic backend errors возвращать `error.message`, если он содержательный.
4. Не показывать пользователю raw JSON, если detail объектный и огромный; для object detail можно показывать короткую безопасную строку.

**Критерии приемки:**

- Backend detail “LLM API key is not configured” или “Сессия не найдена” не теряется.
- UI все еще показывает дружелюбные сообщения для 404/409.

**Проверка Codex:**

- Выполнить `npm run typecheck`.
- Смоделировать 503/502/404 response и убедиться, что UI получает не generic “Произошла ошибка при обращении к серверу”, а полезный detail.

**Журнал выполнения**

- Дата выполнения: 2026-05-05
- Измененные файлы: `src/services/simulatorApiService.ts`, `AI_EDUC_SALES_ARCHITECTURE_TASKS.md`
- Запущенные проверки: `npm run typecheck`, runtime-smoke через `npx tsx` с подмененным `fetch` для `404/503/502`
- Результат проверок: `typecheck` прошел; simulated responses вернули `404: Сессия не найдена`, `503: LLM API key is not configured`, `502: Сервис оценки временно недоступен` вместо generic server error
- Известные ограничения: object-shaped backend detail по-прежнему схлопывается в короткое безопасное сообщение и не показывает пользователю весь raw JSON/debug payload, что сделано намеренно.

---

### [x] Задача 13 — Упростить runtime graph builder и убрать ложный параметр agents_config

**Файлы:**

- `backend/app/runtime.py`
- `backend/app/api.py`
- `backend/tests/test_simulator_api.py`
- возможно тестовые helpers

**Что сделать:**

1. Сейчас `build_graph(agents_config)` принимает аргумент, но `_get_compiled_graph()` создает новый `AgentsConfig()` и игнорирует переданный параметр.
2. Выбрать простой контракт:
   - либо `build_graph()` без аргументов и честный global cached graph;
   - либо cache keyed by config, если реально нужны разные конфиги.
3. Для текущего MVP предпочтительно сделать `build_graph()` без аргументов.
4. Обновить вызовы в `api.py`.
5. Обновить tests/monkeypatch helpers.
6. Аналогично проверить `build_evaluation_agent(agents_config)`: если аргумент не используется, упростить сигнатуру.

**Критерии приемки:**

- Нет функций, которые принимают config и игнорируют его.
- Tests monkeypatch-ятся проще.
- Runtime dependencies создаются в одном понятном месте.

**Проверка Codex:**

- Выполнить `cd backend && pytest`.
- Проверить grep: `grep -R "build_graph(get_agents_config\|def build_graph(agents_config" -n backend/app backend/tests`.

**Журнал выполнения**

- Дата выполнения: 2026-05-05
- Измененные файлы: `backend/app/runtime.py`, `backend/app/api.py`, `backend/tests/test_simulator_api.py`, `AI_EDUC_SALES_ARCHITECTURE_TASKS.md`
- Запущенные проверки: `cd backend && pytest`, `grep -R "build_graph(get_agents_config\|def build_graph(agents_config" -n backend/app backend/tests`
- Результат проверок: полный backend `pytest` — `28 passed, 2 skipped`; grep не нашел старую сигнатуру `def build_graph(agents_config` и вызовы `build_graph(get_agents_config...)`
- Известные ограничения: `build_graph()` и `build_evaluation_agent()` теперь честно берут `get_agents_config()` внутри runtime без отдельного cache keyed by config, что соответствует текущему MVP и упрощает monkeypatch в тестах.

---

### [x] Задача 14 — Централизовать лимит реплик для оценки

**Файлы:**

- `backend/app/settings.py`
- `backend/app/api.py`
- `backend/.env.example`
- `src/data/simulatorMvpData.ts`
- возможно `src/services/simulatorApiService.ts` / `/health` или scenarios endpoint, если нужно отдавать настройку на frontend

**Что сделать:**

1. Убрать разъезд между:
   - `.env.example MIN_MANAGER_TURNS=10`
   - `MIN_REPLIES_FOR_CONFIDENT_EVALUATION = 10`
   - `MANAGER_REPLY_TARGET = 10`
2. Для backend добавить setting `MIN_MANAGER_TURNS` в `LLMSettings` или отдельный `AppSettings`.
3. Использовать setting в `close_session()` при вызове evaluation agent.
4. Frontend пока может оставить `MANAGER_REPLY_TARGET = 10`, но в комментарии указать, что это UI hint. Лучше добавить поле в scenarios/settings endpoint позже, если нужен dynamic target.
5. Не держать два независимых backend constants.

**Критерии приемки:**

- Backend лимит читается из env/settings.
- `.env.example` параметр реально используется.

**Проверка Codex:**

- Выполнить backend tests.
- Добавить тест с monkeypatch env `MIN_MANAGER_TURNS=3` и проверить, что evaluation agent получает `min_replies=3`.

**Журнал выполнения**

- Дата выполнения: 2026-05-05
- Измененные файлы: `backend/app/settings.py`, `backend/app/api.py`, `backend/tests/test_simulator_api.py`, `src/data/simulatorMvpData.ts`, `AI_EDUC_SALES_ARCHITECTURE_TASKS.md`
- Запущенные проверки: `cd backend && pytest`, `rg -n "MIN_MANAGER_TURNS|MIN_REPLIES_FOR_CONFIDENT_EVALUATION|MANAGER_REPLY_TARGET" backend src`
- Результат проверок: backend `pytest` — `28 passed, 2 skipped`; env override `MIN_MANAGER_TURNS=3` в `test_simulator_api.py` успешно дошел до `evaluation_agent.evaluate(..., min_replies=3)`; старый backend hardcode `MIN_REPLIES_FOR_CONFIDENT_EVALUATION` удален
- Известные ограничения: frontend `MANAGER_REPLY_TARGET = 10` пока остается как честный UI hint в mock-runtime и еще не подтягивается динамически с backend settings contract.

---

### [x] Задача 15 — Регенерировать или удалить stale backend/openapi.json

**Файлы:**

- `backend/openapi.json`
- `backend/app/main.py`
- возможно `backend/README.md`

**Что сделать:**

1. Проверить текущий `backend/openapi.json`: в нем есть export endpoints, которых нет в коде.
2. Либо удалить committed `openapi.json` как runtime artifact, либо регенерировать его из текущего FastAPI app.
3. Если оставить файл, добавить понятную команду в README для обновления.
4. Убедиться, что OpenAPI отражает новые report fields из задач 02–04.

**Критерии приемки:**

- OpenAPI не обещает endpoints, которых нет в FastAPI router.
- Report schemas в OpenAPI совпадают с models.py.

**Проверка Codex:**

- Запустить app/openapi generation command.
- Проверить grep: `grep -n "export/pdf\|export/csv" backend/openapi.json` должен быть пустым, если endpoints не реализованы.
- Проверить наличие новых report fields в `backend/openapi.json`.

**Журнал выполнения**

- Дата выполнения: 2026-05-05
- Измененные файлы: `backend/openapi.json`, `AI_EDUC_SALES_ARCHITECTURE_TASKS.md`
- Запущенные проверки: `cd backend && make openapi`, `grep -n "export/pdf\|export/csv" backend/openapi.json`, `rg -n 'scenarioId|scenarioTitle|status|createdAt|sourceLabel|sessionId' backend/openapi.json`
- Результат проверок: `make openapi` успешно пересобрал контракт; grep по `export/pdf|export/csv` пустой; `openapi.json` содержит новые report fields `scenarioId`, `scenarioTitle`, `status`, `createdAt`, `sourceLabel`, `sessionId`
- Известные ограничения: committed `openapi.json` остается в репозитории как актуальный контрактный артефакт, поэтому его нужно обновлять командой `make openapi` после будущих API-изменений.

---

### [x] Задача 16 — Обновить backend README и убрать устаревшие ссылки

**Файлы:**

- `backend/README.md`
- корневой `README.md`, если нужно
- `docs/*`, если там есть явно устаревшие пути

**Что сделать:**

1. В `backend/README.md` заменить старые имена файлов:
   - `simulator_agents.py` → `app/agents.py`
   - `simulator_graph.py` → `app/graph.py`
   - `simulator_api.py` → `app/api.py`
   - `simulator_prompts.py` → `app/prompts.py`
2. Описать реальную структуру:
   - simulator API;
   - reports API;
   - in-memory active sessions;
   - persistent reports DB.
3. Добавить короткое правило: active session state — ephemeral per process; reports — persistent DB.
4. Указать, что backend locks запрещены в текущей архитектуре.

**Критерии приемки:**

- README не ссылается на несуществующие файлы.
- Новому разработчику понятно, где simulator, reports, runtime и DB.

**Проверка Codex:**

- Проверить пути из README вручную через `test -f` или `ls`.
- Выполнить grep по старым именам: `grep -R "simulator_agents\|simulator_graph\|simulator_api\|simulator_prompts" -n README.md backend/README.md docs` и убрать/обновить устаревшие упоминания.

**Журнал выполнения**

- Дата выполнения: 2026-05-05
- Измененные файлы: `backend/README.md`, `AI_EDUC_SALES_ARCHITECTURE_TASKS.md`
- Запущенные проверки: `test -f backend/app/agents.py && test -f backend/app/graph.py && test -f backend/app/api.py && test -f backend/app/prompts.py`, `grep -R "simulator_agents\|simulator_graph\|simulator_api\|simulator_prompts" -n README.md backend/README.md docs`
- Результат проверок: все упомянутые пути существуют; grep по старым именам пустой; README теперь описывает simulator API, reports API, ephemeral active sessions, persistent reports DB и запрет backend locks
- Известные ограничения: корневой `README.md` не потребовал отдельной правки в рамках этой задачи, потому что устаревшие backend file paths были только в `backend/README.md`.

---

### [x] Задача 17 — Убрать прямую зависимость AppNavigator от salesAcademyMock как runtime source of truth

**Файлы:**

- `src/navigation/AppNavigator.tsx`
- `src/services/academyDataService.ts`
- `src/data/salesAcademyMock.ts`
- `src/types/academy.ts`

**Что сделать:**

1. `AppNavigator` должен получать user/dashboard/scenarios/reports через service layer, а не импортировать `salesAcademyMock` напрямую как runtime data.
2. На первом шаге можно оставить mock-backed implementation внутри `academyDataService`, но navigator должен зависеть от service API.
3. Для simulator catalog решить через задачу 08: backend scenarios first, local fallback second.
4. `salesAcademyMock` может остаться как local fallback/mock fixture, но не должен быть главным source of truth в navigator.

**Критерии приемки:**

- В `AppNavigator.tsx` нет import `{ salesAcademyMock }`.
- Reports state и scenarios state обновляются через сервисы.
- Mock data остаются только за service layer или fallback.

**Проверка Codex:**

- Выполнить `grep -R "salesAcademyMock" -n src/navigation src/screens` и убедиться, что runtime navigation не завязан на этот объект напрямую.
- Выполнить `npm run typecheck`.
- Ручной smoke test: home, simulator, reports открываются.

**Журнал выполнения**

- Дата выполнения: 2026-05-05
- Измененные файлы: `src/navigation/AppNavigator.tsx`, `src/services/academyDataService.ts`, `src/types/academy.ts`, `src/data/salesAcademyMock.ts`, `src/screens/student/StudentHomeScreen.tsx`, `src/screens/simulator/SimulatorScreen.tsx`, `AI_EDUC_SALES_ARCHITECTURE_TASKS.md`
- Запущенные проверки: `grep -R "salesAcademyMock" -n src/navigation src/screens`, `npm run typecheck`, ручной web smoke test `home -> simulator -> reports`
- Результат проверок: grep по `src/navigation src/screens` пустой; `typecheck` прошел; после reload приложения `Главная`, `Тренажер` и `Отчеты` успешно открываются с service-loaded workspace data
- Известные ограничения: `salesAcademyMock` все еще остается mock-backed fallback внутри `academyDataService`, но больше не является прямым runtime source of truth для navigator.

---

### [x] Задача 18 — Упростить роль/навигацию до реально поддерживаемого продукта

**Файлы:**

- `src/navigation/routes.ts`
- `src/navigation/AppNavigator.tsx`
- `src/screens/manager/ManagerDashboardScreen.tsx`
- `src/screens/hr/HrDashboardScreen.tsx`
- `src/screens/admin/AdminScreen.tsx`

**Что сделать:**

1. Сейчас роли manager/hr/admin и экраны существуют, но `roleHomeRoute` для всех ведет в `StudentHome`, а `tabsByRole` одинаково показывает только home/simulator.
2. Выбрать простой вариант для текущего MVP:
   - либо временно оставить только student role и убрать ложную role routing сложность из runtime;
   - либо реально подключить role-specific dashboards в AppNavigator и tabsByRole.
3. Не держать “мертвые” route definitions, которые нельзя открыть.
4. Если role-specific screens не нужны сейчас, явно пометить их как future/mock и не показывать пользователю недоступные CTA на них.

**Критерии приемки:**

- Route config соответствует реально доступным экранам.
- Нет route, который объявлен как tab, но не рендерится.
- Нет dashboard CTA, который ведет в запрещенный route и молча возвращает на home.

**Проверка Codex:**

- Выполнить `npm run typecheck`.
- Ручной route smoke test для каждой доступной роли/вкладки.
- Проверить `isRouteAllowedForRole()` на `Reports` и `ReportViewer`.

**Журнал выполнения**

- Дата выполнения: 2026-05-05
- Измененные файлы: `src/navigation/routes.ts`, `src/navigation/AppNavigator.tsx`, `src/components/layout/DesktopSidebar.tsx`, `src/components/layout/BottomTabs.tsx`, `AI_EDUC_SALES_ARCHITECTURE_TASKS.md`
- Запущенные проверки: `npm run typecheck`, ручной web route smoke test `Landing -> Главная -> Тренажер -> Отчеты`, `npx tsx --eval 'isRouteAllowedForRole(...)'`, `grep -R "ManagerDashboard\|HrDashboard\|Admin\|Scenarios" -n src/navigation/routes.ts src/navigation/AppNavigator.tsx src/components/layout/DesktopSidebar.tsx src/components/layout/BottomTabs.tsx`
- Результат проверок: `typecheck` прошел; `Landing` теперь реально рендерится; доступные student-MVP маршруты `Главная`, `Тренажер`, `Отчеты` открываются; `isRouteAllowedForRole("Reports", "student")` и `isRouteAllowedForRole("ReportViewer", "student")` вернули `true`; grep не нашел старых route definitions в active navigation config
- Известные ограничения: role marketing-контент в `LandingScreen` пока все еще рассказывает про будущие manager/hr/admin контуры, но active runtime navigation в текущем MVP сознательно упрощена до student-workspace плюс live `Landing`.

---

### [x] Задача 19 — Добавить минимальные frontend smoke/unit checks для report flow

**Файлы:**

- `package.json`
- новый тестовый setup, если в проекте еще нет frontend tests
- или минимальный script/check без тяжелого test framework

**Что сделать:**

1. Добавить минимальную проверку report save mapping без поднятия UI:
   - input evaluation + scenarioId + sessionId;
   - `academyDataService.saveLatestSimulatorReport()` local fallback;
   - результат содержит report с нужным id/title/scenarioId/sessionId/status.
2. Если полноценный test framework сейчас избыточен, добавить lightweight TypeScript/Node check script, но не ломать Expo.
3. Проверка должна запускаться в CI или хотя бы быть описана в README.

**Критерии приемки:**

- Есть автоматическая проверка, которая ловит регресс “finish вернул evaluation, но report не появился”.
- Проверка не требует реального LLM.

**Проверка Codex:**

- Выполнить новый script.
- Выполнить `npm run typecheck`.

**Журнал выполнения**

- Дата выполнения: 2026-05-05
- Измененные файлы: `package.json`, `package-lock.json`, `README.md`, `src/services/reportFlowCore.ts`, `src/services/academyDataService.ts`, `scripts/check-report-flow.ts`, `AI_EDUC_SALES_ARCHITECTURE_TASKS.md`
- Запущенные проверки: `npm install --save-dev tsx`, `npm run check:reports`, `npm run typecheck`
- Результат проверок: `npm run check:reports` вывел `report-flow-check: ok`; `typecheck` прошел; lightweight smoke проверяет local report mapping по `scenarioId`, `sessionId`, `status`, `title` и preview sections без реального backend/LLM
- Известные ограничения: plain Node по-прежнему не может напрямую импортировать весь React Native service stack, поэтому автоматическая проверка вынесена в `reportFlowCore` как чистый TypeScript слой, который используется `academyDataService` для local report mapping.

---

### [x] Задача 20 — Финальная чистка архитектуры после задач 01–19

**Файлы:**

- весь репозиторий

**Что сделать:**

1. Пройтись по grep-паттернам:
   - `TODO`, `FIXME`, `MVP`, `mock`, `fallback`, `onPress={() => {}}`, `SESSION_LOCKS`, `Lock`, `_role`, stale file names.
2. Для каждого найденного места решить: оставить осознанно с коротким комментарием или убрать.
3. Удалить неиспользуемые imports/components/functions после refactor.
4. Проверить, что screen не импортирует другой screen ради business logic.
5. Проверить, что API calls идут через service layer.
6. Проверить, что reports flow имеет один понятный путь:
   - finish session;
   - receive evaluation;
   - save/report idempotently;
   - update report state;
   - open report.
7. Обновить docs/README по итоговой архитектуре.

**Критерии приемки:**

- Нет backend locks.
- Отчет создается и открывается после завершения диалога.
- Главная открывает отчет, а не чат.
- Reports/ReportViewer доступны из навигации.
- Scenario id не теряется.
- Нет no-op кнопок.
- Нет очевидных stale docs/contracts.

**Проверка Codex:**

- Выполнить `npm run typecheck`.
- Выполнить `cd backend && pytest`.
- Выполнить grep-проверки:
  - `grep -R "SESSION_LOCKS\|asyncio.Lock\|threading.Lock\|Semaphore" -n backend/app src`
  - `grep -R "onPress={() => {}}" -n src`
  - `grep -R "from \"./ReportsScreen\"" -n src`
- Ручной end-to-end smoke test:
  1. открыть app;
  2. выбрать scenario;
  3. отправить сообщение;
  4. завершить;
  5. увидеть новый report;
  6. вернуться на главную;
  7. открыть этот же report из главной;
  8. скачать PDF/CSV;
  9. открыть вкладку Reports и viewer.

**Журнал выполнения**

- Дата выполнения: 2026-05-05
- Измененные файлы: `src/screens/simulator/SimulatorScreen.tsx`, `src/screens/reports/ReportViewerScreen.tsx`, `AI_EDUC_SALES_ARCHITECTURE_TASKS.md`
- Запущенные проверки: `npm run typecheck`, `cd backend && pytest`, `grep -R "SESSION_LOCKS\|asyncio.Lock\|threading.Lock\|Semaphore" -n backend/app src`, `grep -R "onPress={() => {}}" -n src`, `grep -R "from \"./ReportsScreen\"" -n src`, ручной web end-to-end smoke `scenario -> message -> finish -> report -> home -> same report -> PDF/CSV -> Reports`
- Результат проверок: `typecheck` прошел; backend `pytest` — `28 passed, 2 skipped`; все grep-проверки пустые; e2e smoke подтвержден: сообщение теперь реально отправляется в mock-dialogue, finish открывает новый report, report повторно открывается с `Главная`, PDF/CSV скачиваются, `Reports` и `ReportViewer` доступны
- Известные ограничения: simulator runtime все еще остается упрощенным mock-dialogue поверх service/report flow, но теперь это честно оформленный UX без no-op send action; дополнительно исправлено отображение `createdAt` в viewer для backend short timestamp формата `dd.mm hh:mm`.

---

## 3. Prompt для повторного запуска Codex

Скопируй этот prompt в Codex каждый раз. Codex должен открывать этот `.md`, брать первую невыполненную задачу и делать только ее.

```text
Ты работаешь в репозитории AI Sales Academy. В корне репозитория лежит файл AI_EDUC_SALES_ARCHITECTURE_TASKS.md.

Правила работы:
1. Открой AI_EDUC_SALES_ARCHITECTURE_TASKS.md.
2. Найди первую задачу в разделе "2. Последовательные задачи", у которой чекбокс [ ] еще не отмечен.
3. Выполни только эту одну задачу. Не перескакивай к следующим задачам.
4. Соблюдай цель архитектуры: максимум простоты, минимум скрытых fallback, никакого backend lock/mutex/semaphore для session flow.
5. Не добавляй Node backend, Next.js, server actions, API routes или web-first архитектуру.
6. Все frontend API-интеграции делай через typed service layer.
7. Все видимые пользовательские действия должны иметь результат; не оставляй no-op кнопки.
8. После изменения кода выполни блок "Проверка Codex" из этой задачи. Если проверка падает, исправь и повтори проверку.
9. Когда задача выполнена и проверки пройдены, отметь ее чекбокс как [x] в AI_EDUC_SALES_ARCHITECTURE_TASKS.md.
10. Под задачей добавь короткий блок "Журнал выполнения" с датой, списком измененных файлов, выполненными проверками и известными ограничениями, если они есть.
11. Не отмечай задачу выполненной, если проверки не запускались и нет честного объяснения почему.
12. В финальном ответе дай кратко: номер выполненной задачи, что изменено, какие проверки прошли, что осталось дальше.

Начинай сейчас с первой невыполненной задачи.
```

---

## 4. Рекомендованный порядок acceptance smoke после всего refactor

1. `npm run typecheck`
2. `cd backend && pytest`
3. `docker compose -f docker-compose.dev.yml up --build`
4. Открыть web app.
5. Начать диалог.
6. Отправить 1–2 сообщения.
7. Завершить диалог.
8. Убедиться, что новый отчет сохранился и открылся.
9. Перейти на главную и открыть последний отчет оттуда.
10. Перейти во вкладку Reports и открыть тот же отчет.
11. Скачать PDF и CSV из списка и из viewer.
12. Проверить, что backend code не содержит lock primitives.
13. Перезапустить frontend, открыть Reports, убедиться, что отчеты подтягиваются из backend или local fallback в зависимости от режима.

---

## 5. Важные архитектурные решения, которых нужно придерживаться

- Active dialogue session может быть ephemeral in-memory state, если это явно осознанный MVP-выбор.
- Report — persistent entity, не ephemeral.
- `scenarioId` должен проходить весь путь: выбор сценария → backend session → report → continue chat.
- Не должно быть silent fallback, который подменяет выбранный scenario на другой.
- Не должно быть второго источника истины для reports на экране: UI читает reports state из service layer.
- Screen не должен содержать тяжелую business/export logic, если есть service layer.
- Backend lock запрещен в этом refactor. Idempotency и frontend busy state — допустимые простые механизмы.
