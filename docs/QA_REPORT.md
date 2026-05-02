# QA_REPORT

## Update 2026-04-27 — Landing + Expo Web

### Mobile checklist

- [x] Landing открывается первым экраном.
- [x] Hero CTA ведут в `StudentHome`, `Simulator`, `ManagerDashboard`.
- [x] Bottom tabs продолжают работать в кабинетах.
- [x] Simulator flow работает с local state и mock evaluation.
- [x] Bottom sheets закрываются по кнопке и по overlay.

### Desktop/Web checklist

- [x] `npm run web` запускает Expo Web dev server.
- [x] Landing отображается как desktop landing, а не как узкий телефонный экран.
- [x] Кабинеты получают широкий контейнер и desktop navigation через sidebar.
- [x] Desktop navigation работает мышью.
- [x] Simulator разложен в desktop-friendly двухколоночный shell.
- [x] Во время запуска не выявлено dependency/config errors.
- [x] Во время bundling не выявлено web-only runtime errors в консольном старте.

### Команды проверки

- [x] `npm run typecheck`
- [x] `npx expo install --check`
- [x] `npx expo-doctor`
- [x] `npm run web`

### Фактические результаты

- `npm run typecheck`: пройдено успешно.
- `npx expo install --check`: `Dependencies are up to date`.
- `npx expo-doctor`: `17/17 checks passed. No issues detected!`
- `npm run web`: Metro и web bundler стартовали, приложение собрано, `Web Bundled` без dependency/config ошибок.

### Что проверить руками дополнительно

- Landing на реальном телефоне: удобство первого экрана и читаемость hero CTA.
- Перекрытие клавиатурой ввода в симуляторе на iPhone / Android.
- Длинные тексты в FAQ и demo bottom sheet на узких экранах.
- Внешний вид desktop sidebar и landing на широком мониторе.
- Поведение навигации при быстрой смене роли и возврате на лендинг.

## Проверенные экраны

- `StudentHome`
- `Simulator`
- `ManagerDashboard`
- `HrDashboard`
- `Admin`
- `Reports`

## Проверенные действия

- Переключение ролей через `RoleSwitcher`.
- Навигация по `BottomTabs`.
- Открытие bottom sheets на всех основных экранах.
- Mock exports: PDF / CSV / HR выгрузки / team PDF.
- Local success states для student plan, recommendations, admin save, HR track assign и report sending.
- Simulator flow: start, send, hint, finish, evaluation, add to plan, restart.
- Knowledge flow: category filter, local search, material open, explain simply, answer example, add to plan, start training.

## Найденные проблемы

- Нижняя навигация использовала слишком общие auto labels из route titles.
- Для wide/tablet режима контент тянулся на всю ширину и начинал выглядеть слишком web-like.
- У `AppButton` не было явного `disabled` state и accessibility state.
- У табов не было явно выраженного accessibility selected state.
- Для manager / hr / admin роль tabs были перегружены одинаково, хотя на телефоне это ухудшало восприятие.

## Исправленные проблемы

- Нижняя навигация переведена на явные короткие labels: `Домой`, `База`, `Практика`, `Команда`, `HR/L&D`, `Админ`, `Отчеты`.
- `AppScreen` ограничен центрированным `maxWidth`, чтобы tablet / wide mode выглядел аккуратно, не ломая mobile.
- `AppButton` получил `disabled`, `accessibilityLabel` и `accessibilityState`.
- `BottomTabs` получили `accessibilityRole="tab"` и `accessibilityState.selected`.
- Наборы tabs сокращены по ролям, чтобы телефонная навигация не была перегруженной.
- Все основные CTA сохранены как рабочие действия: navigation, bottom sheet, local update, mock submit или mock export.

## Команды проверки

- `npm run typecheck` в `root`
- `npx expo start --offline` в `root`

## Что осталось проверить руками на реальном устройстве

- Высоту и комфорт touch targets на iPhone SE / Android compact screens.
- Поведение клавиатуры в `SimulatorScreen` при длинном вводе.
- Поведение bottom sheet при очень длинных русских текстах.
- Визуальную посадку нижней навигации над home indicator.
- Сценарий быстрой смены ролей и возврата в `Reports`.

## Риски перед demo

- Все данные все еще mock-only и не подтверждают backend latency / error states.
- Не добавлен отдельный test stack, поэтому уверенность строится на typecheck и ручном QA-проходе.
- Root репозитория по-прежнему содержит legacy Next.js артефакты, хотя mobile MVP уже живет отдельно в `root`.
