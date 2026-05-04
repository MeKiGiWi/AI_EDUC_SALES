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
npm run check:reports
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
- `backend/.env` (с ключами и конфигом `LLM_API_KEY`; при container-only deploy `DATABASE_URL` должен указывать на `postgres:5432`, а не на `localhost:5432`)

### Как работает сеть
- **Локальная разработка (`npm run web`)**: запросы идут напрямую на `http://localhost:8000` (указано в `.env.example`).
- **Docker dev (`docker-compose.dev.yml`)**: запросы идут на `http://localhost:8000`.
- **Production (`docker-compose.yml`)**: frontend собирается Dockerfile-ом в статический Expo web export и раздается только `nginx` внутри `frontend` контейнера. Этот же `nginx` проксирует `/api/` на `http://backend:8000` и `/health` на backend health endpoint. Поэтому в prod `.env` для фронта `EXPO_PUBLIC_SIMULATOR_API_URL` должен быть `/`.

### Production architecture
- `frontend`: Docker container с `nginx`, который отдает `/usr/share/nginx/html` из образа и слушает `127.0.0.1:3000 -> container:80`
- `backend`: Docker container с `FastAPI + uvicorn`, доступный внутри docker network по `backend:8000`
- `database`: Docker container `Postgres`, доступный backend-сервису по `postgres:5432`
- `host Nginx` при необходимости используется только как внешний reverse proxy на `http://127.0.0.1:3000`
- `host Nginx` не должен раздавать frontend static files из `./dist`

Production работает так:
- Host Nginx принимает публичный HTTP/HTTPS трафик, делает SSL termination и проксирует весь трафик на `http://127.0.0.1:3000`
- Docker frontend container отдает `/usr/share/nginx/html` и проксирует `/api/` в backend container по `http://backend:8000`
- Docker backend container работает внутри Docker network и подключается к Postgres по `postgres:5432`
- Docker Postgres container хранит данные в named volume и не обязан быть доступен снаружи

### Host Nginx example

Если на VPS используется системный `nginx`, он должен только проксировать трафик в frontend container:

```nginx
server {
    listen 80;
    server_name example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Для HTTPS оставляйте существующие `ssl_certificate` / `ssl_certificate_key` / Certbot include как есть и меняйте только `location`-логику на такой же `proxy_pass http://127.0.0.1:3000;`.

Готовый пример также лежит в [docs/nginx.production.example.conf](/Users/daniil/code/Sales_educ_ai/docs/nginx.production.example.conf).

Важно:
- Do not copy dist to host.
- Do not configure host Nginx root to `./dist`.
- Do not configure host Nginx root to `/opt/ai-educ-sales/dist` or `/var/www/...` for the active app domain.
- Do not add a separate host-level `location /api/` or direct `proxy_pass http://127.0.0.1:8000` for the active app domain.
- The only source of frontend static files in production is the frontend Docker image.
- All public requests, including `/api/` and `/health`, must go first to `http://127.0.0.1:3000`.
- Production deploy больше не копирует `frontend` build artifacts из контейнера на хост, и директория `./dist` на VPS не используется для раздачи фронтенда.

### Fast Docker deploys / build cache

- Обычный deploy должен использовать Docker layer cache
- Не используйте `--no-cache`, если только не отлаживаете сломанный cache или не делаете осознанную полную пересборку
- Не запускайте `docker builder prune`, `docker system prune`, `docker image prune`, `docker volume prune` в штатном deploy
- Слои установки зависимостей должны кэшироваться отдельно от application code
- Для обычного deploy используйте `docker compose build frontend backend`
- Затем используйте `docker compose up -d --remove-orphans`
- Полная clean rebuild должна быть ручной аварийной операцией, а не дефолтным путём

### Full Clean Rebuild

Для редкой полной пересборки без cache:

```bash
docker compose build --no-cache frontend backend
docker compose up -d --force-recreate
```

Используйте это только при отладке cache issues или после повреждения базового образа или зависимостей.

### Проверка после deploy
Убедитесь, что сервисы живы:
- Фронтенд: `curl http://127.0.0.1:3000/`
- Бэкенд health: `curl http://127.0.0.1:3000/health`
- Compose config: `docker compose config`
- Сборка контейнеров: `docker compose build frontend backend`
- Запуск: `docker compose up -d`
- Статус: `docker compose ps`
