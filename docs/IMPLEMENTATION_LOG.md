# IMPLEMENTATION_LOG

## Update 2026-04-27 — Expo landing + web shell

- Лендинг возвращен как первый экран `Expo / React Native` приложения, а не как runtime-часть Next.js.
- Старый `app/page.tsx` и `components/landing/*` использованы только как источник структуры, секций и смыслового контента.
- Добавлен typed landing content слой: `apps/mobile/src/data/landingContent.ts`.
- Добавлен новый стартовый экран: `apps/mobile/src/screens/landing/LandingScreen.tsx`.
- Начальный маршрут приложения переведен на `Landing` в `apps/mobile/src/navigation/AppNavigator.tsx`.
- Expo Web настроен в существующем mobile-приложении:
  - установлены `react-dom`, `react-native-web`, `@expo/metro-runtime`;
  - добавлены scripts `web`, `start:web`, `doctor`, `check`, `typecheck`;
  - подтвержден `expo.web.bundler = metro` в `apps/mobile/app.json`.
- Добавлена responsive foundation для mobile/tablet/desktop:
  - `apps/mobile/src/theme/breakpoints.ts`
  - `apps/mobile/src/hooks/useResponsiveLayout.ts`
- Обновлены shell и layout-паттерны:
  - `AppScreen` теперь понимает `variant="landing" | "app"`;
  - на desktop кабинеты открываются в широком контейнере, без mobile-only нижних отступов;
  - на desktop используется `DesktopSidebar`;
  - на mobile сохраняются `BottomTabs`, а возврат на лендинг идет через header.
- `AppBottomSheet` адаптирован:
  - mobile: bottom sheet;
  - desktop/web: centered modal.
- Существующие экраны доработаны под wide layout без отдельного web frontend:
  - `StudentHomeScreen`
  - `KnowledgeBaseScreen`
  - `SimulatorScreen`
  - `ManagerDashboardScreen`
  - `HrDashboardScreen`
  - `AdminScreen`
  - `ReportsScreen`
- Все CTA на лендинге теперь имеют действие:
  - переход в `StudentHome`
  - переход в `Simulator`
  - переход в `ManagerDashboard`
  - переход в `Reports`
  - открытие mock demo bottom sheet

## Команды, выполненные в рамках этого шага

- `cd apps/mobile`
- `npx expo install react-dom react-native-web @expo/metro-runtime`
- `npm run typecheck`
- `npx expo install --check`
- `npx expo-doctor`
- `npm run web`

## Результат этого шага

- Expo mobile-приложение снова имеет нормальный входной лендинг.
- Один и тот же TypeScript / TSX код запускается и на телефоне, и в браузере через Expo Web.
- Next.js не возвращен как целевая архитектура и не используется как новый frontend runtime.

## Дата

- `2026-04-27`

## Что изменено

- Проектовая документация переведена с green landing / Next.js направления в `React Native mobile-first` вектор.
- `AGENTS.md` полностью переписан под `Green AI Sales Academy — React Native Mobile MVP`.
- Добавлены документы с продуктовой рамкой, frontend-контрактом и будущим Python backend-контрактом.
- Добавлен React Native-oriented theme reference в `src/theme/tokens.ts`.
- `codex-prompts/` переписаны под mobile-first, green academy style, typed mocks и future Python backend.
- Создан отдельный `Expo + TypeScript` mobile skeleton в `apps/mobile`.
- Внутри `apps/mobile/src` собраны theme tokens, typed domain models, mock data, mock service layer, typed local navigation, layout components, UI primitives и экраны-заготовки.
- Реализован полноценный student mobile-first UX для:
  - `StudentHomeScreen`
  - `KnowledgeBaseScreen`
  - `SimulatorScreen`
- Реализованы mobile-first MVP кабинеты для:
  - `ManagerDashboardScreen`
  - `HrDashboardScreen`
  - `AdminScreen`
  - `ReportsScreen`
- Добавлены student-oriented shared components:
  - `MaterialCard`
  - `DevelopmentPlanCard`
  - `ChatBubble`
  - `ScenarioPicker`
  - `CompetencyScoreCard`
- Расширены typed models и mock data под:
  - категории базы знаний;
  - AI explanation;
  - пример ответа клиенту;
  - student level summary;
  - точки роста;
  - рекомендации ИИ;
  - mock simulator evaluation.
- Дополнительно расширены typed models и mock data под:
  - group progress;
  - skill dynamics;
  - mock transcripts;
  - best answer examples;
  - team recommendations;
  - score dynamics;
  - access role rules;
  - user access settings;
  - knowledge import status;
  - scenario admin items;
  - report preview sections;
  - mock export states.

## Обновленные и созданные документы

- `AGENTS.md`
- `docs/PROJECT_DIRECTION.md`
- `docs/BOARD_MODEL.md`
- `docs/FRONTEND_CONTRACT.md`
- `docs/PYTHON_BACKEND_CONTRACT.md`
- `docs/IMPLEMENTATION_LOG.md`
- `src/theme/tokens.ts`
- `codex-prompts/build-component.md`
- `codex-prompts/build-homepage.md`
- `codex-prompts/redesign-existing-page.md`
- `codex-prompts/review-implementation.md`

## Созданная mobile-структура

- `apps/mobile/App.tsx`
- `apps/mobile/app.json`
- `apps/mobile/package.json`
- `apps/mobile/tsconfig.json`
- `apps/mobile/src/theme/*`
- `apps/mobile/src/types/academy.ts`
- `apps/mobile/src/data/mockAcademyData.ts`
- `apps/mobile/src/services/academyMockService.ts`
- `apps/mobile/src/navigation/*`
- `apps/mobile/src/components/ui/*`
- `apps/mobile/src/components/layout/*`
- `apps/mobile/src/screens/*`

## Текущий статус проекта

- Текущий статус: `mixed`, с новым рабочим `Expo / React Native` skeleton в `apps/mobile`.
- Признаки:
  - `package.json` содержит только `next dev`, `next build`, `next start`, `next lint`;
  - зависимости ориентированы на `next`, `react`, `react-dom`, `tailwindcss`;
  - `app/` содержит web App Router structure;
  - `tsconfig.json` в root содержит Next-specific plugin и web-oriented JSX settings;
  - новый мобильный контур живет отдельно в `apps/mobile`;
  - в `apps/mobile` есть Expo runtime setup, app entry, package scripts и typed TSX app structure.

## Архитектурное решение

- Выбран безопасный monorepo-путь: `apps/mobile`.
- Root не переинициализировался и не ломался.
- Next.js не рассматривается как основная продуктовая цель.
- Навигация выбрана локальная и строго типизированная через `AppNavigator` и `RootStackParamList`, без тяжелых внешних UI/navigation библиотек.
- Все данные для экранов лежат в typed mock data и отдаются через mock service layer.

## Где лежат mock data и сервисы

- Typed domain models: `apps/mobile/src/types/academy.ts`
- Mock data: `apps/mobile/src/data/mockAcademyData.ts`
- Mock service layer: `apps/mobile/src/services/academyMockService.ts`
- Навигация: `apps/mobile/src/navigation/AppNavigator.tsx` и `apps/mobile/src/navigation/routes.ts`

## Что сделано для ученика

- `StudentHomeScreen` теперь содержит:
  - приветствие;
  - текущий уровень;
  - общий прогресс;
  - ближайшую практику;
  - активные модули;
  - последние оценки по компетенциям;
  - точки роста;
  - рекомендации ИИ;
  - персональный план развития.
- `KnowledgeBaseScreen` теперь содержит:
  - горизонтальный фильтр категорий;
  - локальный поиск;
  - карточки материалов;
  - блок про AI explanation;
  - краткое объяснение;
  - применение в диалоге;
  - пример ответа клиенту.
- `SimulatorScreen` теперь содержит:
  - выбор сценария;
  - карточку клиента;
  - чат-область;
  - быстрые варианты ответа;
  - поле ввода;
  - завершение и оценку;
  - bottom sheet с mock scoring и рекомендациями.

## Реализованные mock interactions

- `Продолжить обучение` открывает детали текущего модуля в bottom sheet.
- `Начать симуляцию` ведет в `Simulator`.
- `Объяснить материал` ведет в `KnowledgeBase` с предвыбранной категорией / материалом.
- `Посмотреть обратную связь` открывает feedback bottom sheet.
- `Добавить в план` меняет local state и показывает success.
- `Скачать план` открывает mock export bottom sheet.
- В `KnowledgeBase` работают local search и category filters.
- `Открыть материал`, `Объясни проще`, `Дай пример ответа клиенту`, `Добавить в план развития`, `Начать тренировку по теме` все имеют поведение.
- В `Simulator` работают:
  - запуск сценария;
  - переключение сценария;
  - отправка реплики;
  - быстрые replies;
  - mock ответ клиента;
  - смена сложности;
  - показ подсказки;
  - оценка после 2+ реплик;
  - добавление рекомендаций в план;
  - повтор сценария.

## Что сделано для manager / HR / admin / reports

- `ManagerDashboardScreen` теперь содержит:
  - team summary;
  - прогресс группы;
  - skill dynamics;
  - карточки сотрудников;
  - точки роста команды;
  - последние диалоги;
  - примеры лучших ответов;
  - рекомендации руководителю.
- `HrDashboardScreen` теперь содержит:
  - прогресс групп;
  - доходимость;
  - отчет по компетенциям;
  - score dynamics;
  - треки развития;
  - team recommendations;
  - risk groups.
- `AdminScreen` теперь содержит:
  - профили пользователей;
  - матрицу ролей;
  - настройки доступа;
  - knowledge import status;
  - сценарии и кейсы;
  - системные настройки MVP.
- `ReportsScreen` теперь содержит:
  - PDF-отчеты;
  - HR/L&D статистику;
  - динамику показателей оценки;
  - командные отчеты;
  - отчет ученика;
  - scheduled reports и настройки регулярности.

## Реализованные mock exports

- Manager:
  - mock PDF export команды.
- HR/L&D:
  - mock export статистики;
  - mock export динамики оценки.
- Admin:
  - mock rules review для report delivery.
- Reports:
  - preview report content;
  - mock PDF export;
  - mock CSV prepared state;
  - local schedule mode switching.

## Что НЕ делалось специально

- Не создавался Python backend.
- Не создавался Node backend.
- Не создавались API routes.
- Не предпринималась попытка хаотично мигрировать текущую Next.js сборку в React Native в рамках этого шага.

## Команды, которые запускались

- `pwd`
- `ls -la`
- `rg --files package.json AGENTS.md design-system codex-prompts app components lib`
- `find design-system -maxdepth 2 -type f | sort`
- `find codex-prompts -maxdepth 2 -type f | sort`
- `find . -maxdepth 2 -type d \\( -name docs -o -name src \\) -print`
- `find apps -maxdepth 3 -type f -o -type d | sort`
- `sed -n '1,220p' package.json`
- `sed -n '1,260p' AGENTS.md`
- `sed -n '1,220p' tsconfig.json`
- `sed -n '1,240p' README.md`
- `npm run typecheck`
- `mkdir -p apps/mobile/...`
- `npm install` in `apps/mobile`
- `npm run typecheck` in `apps/mobile`
- `npx expo start --offline` in `apps/mobile`
- `npm run typecheck` in `apps/mobile` after student UX update
- `npx expo start --offline` in `apps/mobile` after student UX update
- `npm run typecheck` in `apps/mobile` after manager/hr/admin/reports update
- `npx expo start --offline` in `apps/mobile` after manager/hr/admin/reports update

## Результат проверки

- `npm run typecheck` выполнен успешно.
- В `apps/mobile` успешно выполнен `npm run typecheck`.
- `Expo` проект в `apps/mobile` стартовал через `npx expo start --offline`, после чего сервер был остановлен вручную.
- Отдельного `lint` script в `apps/mobile` сейчас нет.

## Следующий шаг

Следующий шаг должен развивать уже созданный mobile skeleton:

1. Добавить реальные typed screen sections для student simulator flow.
2. Вынести screen-level state в более явные adapters / hooks.
3. Подготовить typed DTO mapping под будущий Python backend contract.
4. Подготовить финальный QA-pass по всем ролям и mobile flows.
5. Подготовить typed DTO mapping под будущие Python API domains для manager / HR / admin / reports.
6. Решить судьбу legacy Next.js артефактов в root: архивировать, удалить или временно оставить как reference.
7. При необходимости добавить визуальные polish-слои для phone/tablet layout без ухода от mobile-first.

## Blockers

- Root репозитория по-прежнему содержит legacy Next.js structure.
- Mobile skeleton пока использует mock services и local typed navigation, без real backend integration.

## Финальный QA-pass для demo-ready MVP

- Проверена навигация по всем основным экранам:
  - `StudentHome`
  - `KnowledgeBase`
  - `Simulator`
  - `ManagerDashboard`
  - `HrDashboard`
  - `Admin`
  - `Reports`
- Уточнены short labels нижней навигации, чтобы mobile tabs были понятнее на телефоне.
- `BottomTabs` получили более явный active/accessibility state.
- `AppButton` получил typed `disabled` и accessibility states.
- `AppScreen` получил центрированный `maxWidth` для tablet / wide mode без потери mobile-first layout.
- Обновлен `docs/PYTHON_BACKEND_CONTRACT.md` с явным списком service functions, endpoints и DTO handoff.
- Созданы:
  - `docs/NEXT_BACKEND_PLAN.md`
  - `docs/QA_REPORT.md`

## Что осталось для backend-этапа

- Заменить mock service layer на Python API client без переписывания screen components.
- Добавить auth/bootstrap layer.
- Подключить real knowledge materials, dialogue sessions, scoring, feedback, reports и admin updates.
- Проработать реальные loading/error states после появления backend.

## Какие места потом подключать к Python API

- `apps/mobile/src/services/academyMockService.ts`
- `apps/mobile/src/navigation/AppNavigator.tsx`
- `apps/mobile/src/screens/student/StudentHomeScreen.tsx`
- `apps/mobile/src/screens/knowledge/KnowledgeBaseScreen.tsx`
- `apps/mobile/src/screens/simulator/SimulatorScreen.tsx`
- `apps/mobile/src/screens/manager/ManagerDashboardScreen.tsx`
- `apps/mobile/src/screens/hr/HrDashboardScreen.tsx`
- `apps/mobile/src/screens/admin/AdminScreen.tsx`
- `apps/mobile/src/screens/reports/ReportsScreen.tsx`
- Следующий backend-этап должен подключать:
  - reports exports;
  - access settings;
  - team dashboards;
  - HR score dynamics;
  - dialogue transcripts;
  - scheduled report rules
  через отдельный Python API layer.
- Нужна отдельная продуктовая команда на следующий шаг: удаляем ли web-first артефакты сейчас или держим их временно рядом с `apps/mobile`.
