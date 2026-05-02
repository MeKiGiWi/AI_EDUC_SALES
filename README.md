# AI Sales Academy

Репозиторий содержит основное приложение `Expo + React Native + TypeScript` для `AI Sales Academy`, а также упрощенный Python backend для simulator-flow.

## Что в репозитории

- `App.tsx`, `app.json`, `src/` — корневое Expo-приложение
- `design-system/` — токены, рецепты компонентов и layout-правила для зелёной визуальной системы
- `docs/` — продуктовые и контрактные документы
- `backend/` — минимальный `FastAPI + LangChain + LangGraph` backend для симулятора
- `codex-prompts/` — вспомогательные промпты

## Продуктовый контур

- сверху открыт презентационный лендинг с кнопкой `Войти`
- вход ведёт в выбор роли: ученик, руководитель, HR / L&D, администратор
- после выбора роли открывается соответствующее рабочее пространство
- данные сейчас приходят из типизированных локальных данных через сервисный слой

## Команды

```bash
npm run start
npm run ios
npm run android
npm run web
npm run typecheck
npm run doctor
```

## Docker dev с hot reload

Для локальной разработки через Docker есть отдельный dev-контур:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
docker compose -f docker-compose.dev.yml up --build
```

- Expo web с hot reload: `http://localhost:19006`
- FastAPI backend с `uvicorn --reload`: `http://localhost:8000`

Продовый compose остаётся в [docker-compose.yml](/Users/daniil/code/Sales_educ_ai/docker-compose.yml).

## Дальнейшее развитие

- держать архитектуру в рамках React Native / Expo
- не возвращать в репозиторий Next.js-контур и backend-код
- использовать `AGENTS.md`, `docs/` и `design-system/` как основные ориентиры

## Деплой на VPS (Production)

Развертывание на VPS осуществляется автоматически через GitHub Actions при push в `main`.

### Структура на VPS
Для успешного деплоя на сервере в `/opt/ai-educ-sales` (или в директории деплоя) должны лежать секретные файлы:
- `.env` (для frontend, с `EXPO_PUBLIC_SIMULATOR_API_URL=/`)
- `backend/.env` (с ключами и конфигом `LLM_API_KEY`)

### Как работает сеть
- **Локальная разработка (`npm run web`)**: запросы идут напрямую на `http://localhost:8000` (указано в `.env.example`).
- **Docker dev (`docker-compose.dev.yml`)**: запросы идут на `http://localhost:8000`.
- **Production (`docker-compose.yml`)**: frontend собирается в статику и раздается nginx. Nginx также проксирует запросы на `/api/` в backend и `/health`. Поэтому в prod `.env` для фронта `EXPO_PUBLIC_SIMULATOR_API_URL` должен быть `/`.

### Проверка после deploy
Убедитесь, что сервисы живы:
- Фронтенд: `curl http://127.0.0.1:3000/`
- Бэкенд health: `curl http://127.0.0.1:3000/health`
