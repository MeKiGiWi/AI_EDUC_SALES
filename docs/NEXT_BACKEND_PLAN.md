# NEXT_BACKEND_PLAN

## Цель

Короткий план следующего этапа, в котором текущий React Native MVP начинает постепенно заменять mock service layer на отдельный Python backend без переписывания экранов.

## Этап 1. Auth + Roles

- Поднять Python auth layer.
- Вернуть `current user`, `roles`, `access scope`.
- Подключить bootstrap приложения и role switch rules.

## Этап 2. Knowledge Base

- Отдать категории и материалы базы знаний.
- Подключить search/filter endpoints.
- Заменить mock knowledge sections на real responses.

## Этап 3. AI Explanation

- Добавить endpoint для `Объясни проще`.
- Добавить endpoint для `Дай пример ответа клиенту`.
- Вернуть explanation payload в формате, совместимом с текущими bottom sheets.

## Этап 4. Dialogue Simulator

- Поднять сценарии и старт диалоговой сессии.
- Поддержать отправку реплик и возврат mock/AI-ответа клиента.
- Вернуть transcript/session state для mobile simulator.

## Этап 5. Scoring

- Подключить оценку завершенной симуляции.
- Вернуть competency breakdown, strong answer example и recommendations.
- Переключить `SimulatorScreen` с local evaluation на backend scoring result.

## Этап 6. Reports / Export

- Поднять список отчетов и preview.
- Поддержать export jobs и export status.
- Подключить scheduled report rules и send actions.

## Этап 7. Admin Settings

- Подключить users, roles, access settings.
- Поддержать knowledge import status и scenario admin list.
- Переключить admin forms с mock state на реальные update calls.
