# FRONTEND_CONTRACT

## Базовые правила

- `React Native only` как целевое направление frontend-архитектуры.
- `TypeScript only` для application code.
- `Mobile-first` как базовый UX-priority.
- `No Next.js` как целевая архитектура.
- `No API routes`.
- `No server actions`.
- `No backend implementation` в этом репозитории на текущем этапе.
- `Mock data only` до подключения будущего Python backend.

## Структурные требования

- Экраны должны собираться из переиспользуемых компонентов.
- Theme и UI-решения должны идти через токены и общие mobile-oriented primitives.
- Бизнес-данные должны быть типизированы отдельными DTO / model types.
- Большие mock-массивы нельзя хранить внутри JSX.
- Mock data, screen state helpers и service adapters должны жить отдельно от view-слоя.

## Интеграционный подход

- Будущая интеграция с backend должна идти через typed service layer.
- Для каждого домена должны быть:
  - frontend DTO;
  - mock service implementation;
  - future API-backed implementation;
  - предсказуемая точка переключения.

## UX-требования

- Все пользовательские действия должны иметь результат.
- Пустые кнопки, заглушки без поведения и неактивные CTA недопустимы.
- Предпочтительные mobile-паттерны:
  - bottom sheets;
  - modals;
  - inline confirmations;
  - optimistic local state updates;
  - mock submit / mock export flows.

## Что пока не делаем

- Не создаем backend.
- Не создаем Node server.
- Не используем web-first routing как продуктовую основу.
- Не проектируем server-side flows как основную модель приложения.
