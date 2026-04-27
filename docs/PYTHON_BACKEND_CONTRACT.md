# PYTHON_BACKEND_CONTRACT

## Назначение документа

Этот документ фиксирует будущий контракт интеграции между React Native frontend и отдельным Python backend. На текущем этапе backend-код не создается. Все ниже описанное пока заменяется typed mock data и mock service implementations.

## Общие правила интеграции

- Backend будет отдельным Python-слоем.
- Предпочтительный стек: `FastAPI` или аналогичный Python backend.
- В этом репозитории не создаются:
  - Python backend files;
  - Node backend;
  - API routes;
  - server actions.
- Frontend должен быть готов переключаться с mock service layer на real API без переписывания экранов.

## Текущие frontend service functions

Сейчас frontend использует mock service layer в `apps/mobile/src/services/academyMockService.ts`.

- `getCurrentUser(role)`
- `getStudentDashboard()`
- `getKnowledgeSections()`
- `getScenarios()`
- `getManagerDashboard()`
- `getHrDashboard()`
- `getAdminSettings()`
- `getReports()`

На backend-этапе именно эти функции должны постепенно заменяться на реальные API calls без переписывания screen components.

## Какие frontend функции заменить реальными API calls

Первый слой замены должен остаться на уровне service layer, а не внутри screen components.

- `getCurrentUser(role)` → `fetchCurrentUser(session)` и `fetchAvailableRoles()`
- `getStudentDashboard()` → `fetchStudentDashboard(userId)`
- `getKnowledgeSections()` → `fetchKnowledgeSections(query, categoryId)`
- `getScenarios()` → `fetchScenarioCatalog(roleLevel, topicId)`
- `getManagerDashboard()` → `fetchManagerDashboard(teamId)`
- `getHrDashboard()` → `fetchHrDashboard(orgId | groupIds)`
- `getAdminSettings()` → `fetchAdminSettings()`
- `getReports()` → `fetchReports(role, filters)`

На следующем backend-этапе в этом же слое появятся новые функции, которые сейчас еще не выделены отдельными вызовами, потому что UX закрыт mock state:

- `startDialogueSession(scenarioId, difficulty)`
- `sendDialogueMessage(sessionId, message)`
- `finishDialogueSession(sessionId)`
- `requestMaterialExplanation(materialId, complexityMode)`
- `fetchFeedback(sessionId | userId)`
- `addDevelopmentItem(userId, recommendationId | payload)`
- `exportReport(reportId, format)`
- `sendReport(reportId, audience)`
- `updateScheduledReportRule(ruleId, payload)`
- `updateUserAccessSetting(userId, payload)`

## DTO, которые уже существуют во frontend

В `apps/mobile/src/types/academy.ts` уже есть типы, которые можно использовать как стартовую основу для API DTO:

- `AcademyUser`
- `KnowledgeSection`
- `KnowledgeMaterial`
- `Scenario`
- `ScenarioMessage`
- `Competency`
- `SkillScore`
- `LearningModule`
- `FeedbackItem`
- `DevelopmentTrack`
- `StudentDashboard`
- `ManagerDashboard`
- `HrDashboard`
- `AdminSettings`
- `ReportCard`
- `ScheduledReportRule`
- `DialogueTranscript`
- `GroupProgress`
- `TeamSkillTrend`
- `ScoreTrendPoint`
- `AccessRoleRule`
- `UserAccessSetting`
- `KnowledgeImportStatus`
- `ScenarioAdminItem`
- `SimulatorEvaluation`

Эти типы уже позволяют начать mapping между Python DTO и screen models без переписывания UI. На backend-этапе часть из них может быть разделена на:

- raw API DTO;
- frontend domain model;
- mapper functions `dto -> domain`.

## Какие mock-сценарии уже покрывают UX

- Профиль и роль пользователя.
- Student dashboard и learning progress.
- Knowledge base categories, search, AI explanation и example answers.
- Scenario picker и mock dialogue flow.
- Mock simulator messages и auto customer replies.
- Mock scoring result и recommendations.
- Feedback и development plan.
- Manager team summary, people cards и dialogue transcripts.
- HR group progress, competency overview и score dynamics.
- Admin role matrix, access settings и report delivery rules.
- Reports preview, export states и scheduled report configuration.

Отдельно уже покрыты mobile UX-сценарии, которые должны сохраниться после перехода на real API:

- student home bootstrap для ученика;
- knowledge category filtering и local material open flow;
- material explanation и answer example;
- simulator start / send / finish flow;
- scoring bottom sheet после 2+ learner replies;
- feedback and development plan updates;
- manager coaching actions и transcript preview;
- HR exports, comparison flow и track assignment;
- admin role change, access setup и report rule editing;
- report preview, PDF/CSV export state и scheduled delivery configuration.

## 1. Auth / Roles

Примерные endpoints:

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`
- `GET /roles`

Frontend DTO:

- `AuthSessionDto`
- `AccessTokenDto`
- `CurrentUserDto`
- `UserRoleDto`

Сейчас заменяется mock data:

- mock current user;
- mock active role;
- mock доступные роли и права.

Позже переключить с mock на API:

- экран входа;
- выбор роли;
- bootstrap приложения;
- guards по уровню доступа.
- role switcher и header state во всех кабинетах.

## 2. Users / Profiles

Примерные endpoints:

- `GET /users/{userId}`
- `PATCH /users/{userId}`
- `GET /profiles/{userId}/summary`
- `GET /profiles/{userId}/progress`

Frontend DTO:

- `UserProfileDto`
- `LearnerSummaryDto`
- `UserProgressSnapshotDto`
- `LearningHistoryDto`
- `RoleAccessSnapshotDto`

Сейчас заменяется mock data:

- профиль ученика;
- краткое состояние обучения;
- история прогресса.

Позже переключить с mock на API:

- кабинет ученика;
- профиль пользователя;
- overview-блоки на дашбордах.
- карточки сотрудников у руководителя;
- профили пользователей в админке.

## 3. Knowledge Base

Примерные endpoints:

- `GET /knowledge/articles`
- `GET /knowledge/articles/{articleId}`
- `GET /knowledge/categories`
- `GET /knowledge/search`

Frontend DTO:

- `KnowledgeArticleDto`
- `KnowledgeCategoryDto`
- `KnowledgeSearchResultDto`
- `KnowledgeMaterialExplanationDto`
- `KnowledgeApplyExampleDto`

Сейчас заменяется mock data:

- статьи;
- категории;
- подборки;
- результаты поиска.

Позже переключить с mock на API:

- мобильная база знаний;
- поиск по знаниям;
- рекомендации материалов.
- import/status knowledge materials в админке.

## 4. Learning Modules

Примерные endpoints:

- `GET /learning/modules`
- `GET /learning/modules/{moduleId}`
- `GET /learning/tracks`
- `POST /learning/modules/{moduleId}/complete`

Frontend DTO:

- `LearningModuleDto`
- `LearningTrackDto`
- `ModuleProgressDto`

Сейчас заменяется mock data:

- список модулей;
- статус прохождения;
- треки развития.

Позже переключить с mock на API:

- каталог обучения;
- карточки модулей;
- прогресс и завершение этапов.
- student plan progression;
- треки развития HR/L&D.

## 5. Dialogue Simulator

Примерные endpoints:

- `POST /dialogues/start`
- `POST /dialogues/{dialogueId}/message`
- `POST /dialogues/{dialogueId}/voice-message`
- `GET /dialogues/{dialogueId}`
- `POST /dialogues/{dialogueId}/finish`

Frontend DTO:

- `DialogueSessionDto`
- `DialogueTurnDto`
- `DialogueScenarioDto`
- `DialogueInputPayloadDto`
- `DialoguePersonaDto`
- `DialogueTranscriptDto`

Сейчас заменяется mock data:

- сценарии симулятора;
- состояние диалога;
- mock-ответы персонажа;
- локальная история сессии.

Позже переключить с mock на API:

- мобильный симулятор диалога;
- старт сессии;
- отправка реплик;
- завершение тренировки.
- manager transcript previews;
- scenario administration.

## 6. AI Explanation

Примерные endpoints:

- `POST /ai/explanations`
- `GET /ai/explanations/{explanationId}`

Frontend DTO:

- `AiExplanationRequestDto`
- `AiExplanationDto`

Сейчас заменяется mock data:

- пояснения по ответу;
- why-this-score блоки;
- рекомендации по улучшению.

Позже переключить с mock на API:

- экран разбора ответа;
- explanation cards;
- contextual help внутри симулятора.
- `Объясни проще` и `Пример ответа` в knowledge base.

## 7. Scoring

Примерные endpoints:

- `POST /scoring/evaluate`
- `GET /scoring/sessions/{sessionId}`
- `GET /scoring/competencies`

Frontend DTO:

- `ScoreResultDto`
- `CompetencyScoreDto`
- `ScoringSessionDto`

Сейчас заменяется mock data:

- итоговые баллы;
- breakdown по компетенциям;
- уровень роли.
- примеры сильного ответа;
- рекомендации для development plan.

Позже переключить с mock на API:

- результаты после симуляции;
- score breakdown;
- competency overview.
- HR score dynamics;
- manager skill dynamics.

## 8. Feedback

Примерные endpoints:

- `GET /feedback/{sessionId}`
- `POST /feedback/{sessionId}/acknowledge`
- `GET /feedback/recommendations`

Frontend DTO:

- `FeedbackSummaryDto`
- `FeedbackCommentDto`
- `DevelopmentRecommendationDto`

Сейчас заменяется mock data:

- комментарии ИИ;
- лучшие примеры ответов;
- рекомендации по следующим шагам.

Позже переключить с mock на API:

- экран обратной связи;
- план развития;
- recommended next actions.
- best answer examples;
- team recommendations;
- manager coaching recommendations.

## 9. Reports

Примерные endpoints:

- `GET /reports/learner/{userId}`
- `GET /reports/manager/{teamId}`
- `GET /reports/hr/{orgId}`
- `POST /reports/export/pdf`
- `POST /reports/export/xlsx`

Frontend DTO:

- `LearnerReportDto`
- `ManagerReportDto`
- `HrReportDto`
- `ReportExportJobDto`
- `ScheduledReportRuleDto`
- `ReportPreviewDto`
- `ExportStatusDto`

Сейчас заменяется mock data:

- preview отчетов;
- список export-задач;
- mock статусы выгрузки.

Позже переключить с mock на API:

- раздел отчетов;
- export actions;
- история выгрузок.
- preview content;
- CSV/PDF/XLSX export status;
- scheduled report rules;
- отправка отчетов по ролям.

## 10. Admin Access Settings

Примерные endpoints:

- `GET /admin/access-settings`
- `PATCH /admin/access-settings`
- `GET /admin/users`
- `PATCH /admin/users/{userId}/role`

Frontend DTO:

- `AccessSettingsDto`
- `AdminUserRowDto`
- `RoleAssignmentDto`
- `KnowledgeImportStatusDto`
- `ScenarioAdminItemDto`
- `AccessPolicyRuleDto`

Сейчас заменяется mock data:

- настройки доступа;
- список пользователей;
- права ролей.

Позже переключить с mock на API:

- админ-панель;
- role management;
- access policy screens.

## Какие данные должны приходить с backend

На полном backend-этапе Python API должен отдавать:

- `user profile`
- `roles/access`
- `learning history`
- `knowledge materials`
- `scenario definitions`
- `simulator messages`
- `scoring result`
- `feedback`
- `reports`
- `export status`

Дополнительно для уже реализованного mobile UX понадобятся:

- `group progress`
- `team recommendations`
- `dialogue transcripts`
- `best answer examples`
- `knowledge import status`
- `scenario admin items`
- `scheduled report rules`

## Какие endpoints нужны для уже собранного mobile MVP

Минимальный набор Python endpoints, который позволит переключить текущий React Native MVP с mock на real API:

- `GET /auth/me`
- `GET /roles`
- `GET /students/{userId}/dashboard`
- `GET /knowledge/categories`
- `GET /knowledge/materials`
- `GET /knowledge/materials/{materialId}`
- `POST /knowledge/materials/{materialId}/explain`
- `POST /knowledge/materials/{materialId}/answer-example`
- `GET /scenarios`
- `POST /dialogues/start`
- `POST /dialogues/{dialogueId}/message`
- `POST /dialogues/{dialogueId}/finish`
- `GET /feedback/{sessionId}`
- `POST /development-plan/{userId}/items`
- `GET /manager/dashboard/{teamId}`
- `POST /manager/training-assignments`
- `GET /hr/dashboard`
- `POST /hr/development-tracks/assign`
- `GET /admin/settings`
- `PATCH /admin/users/{userId}/role`
- `PATCH /admin/access-settings/{userId}`
- `POST /admin/knowledge/import`
- `POST /admin/scenarios`
- `GET /reports`
- `POST /reports/export`
- `POST /reports/send`
- `PATCH /reports/scheduled-rules/{ruleId}`

## Какие части UI потом переключать в первую очередь

1. `AppNavigator` bootstrap данных и role bootstrap.
2. `StudentHomeScreen` и `KnowledgeBaseScreen`.
3. `SimulatorScreen` с lifecycle `start -> message -> finish`.
4. `ManagerDashboardScreen` и `HrDashboardScreen`.
5. `AdminScreen`.
6. `ReportsScreen`.
