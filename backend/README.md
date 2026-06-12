# Backend

Backend собран на `FastAPI + LangChain + LangGraph` и обслуживает два основных потока:

- simulator API для запуска, ведения и завершения диалоговых сессий;
- reports API для сохранения и чтения отчетов по завершенным тренировкам.

## Актуальная структура

- `app/main.py` — точка входа FastAPI и подключение router-ов
- `app/core/` — core-конфигурация и SQLAlchemy runtime
- `app/routes/` — публичные FastAPI router-ы без изменения URL-контракта
- `app/simulator/` — доменный слой симулятора: runtime, graph, prompts, session store, schemas
- `app/reports/` — доменный слой отчетов: entities, repository, mapper, service, schemas
- `app/leads/` — доменный слой audit leads: entities, repository, service, cleanup, schemas
- `app/models.py` — compatibility aggregator для старых импортов DTO и runtime-моделей
- `app/api.py`, `app/api_reports.py`, `app/api_leads.py` и другие плоские `app/*.py` — thin compatibility wrappers
- `kb/scenarios/` и `kb/prompts/` — knowledge-base слой, не смешивается с runtime-кодом
- `artifacts/langgraph/` — generated/runtime artifacts схемы графа
- `openapi.json` — сгенерированный OpenAPI-контракт текущего backend

## Runtime модель

- Active session state хранится в `InMemorySessionStore` и является `ephemeral per process`.
- Reports сохраняются в persistent DB через SQLAlchemy.
- В текущей архитектуре backend session locks запрещены: не добавляем `lock`, `mutex`, `semaphore` или очереди на сессию.

## Команды

```bash
make build
make test
make render-graph
make openapi
make smoke-simulator
```

После `make build` схема графа появляется в `artifacts/langgraph/` в форматах Mermaid и Markdown.

После `make openapi` обновляется:

- `openapi.json`

## Как поднять backend

```bash
uvicorn app.main:app --reload
```

По умолчанию backend доступен на `http://127.0.0.1:8000`.

## Live smoke simulator API

Smoke-скрипт запускается отдельно от `pytest`, ходит в публичный simulator API, не вызывает `/finish` по умолчанию и каждый раз перезаписывает Markdown-отчёт.

Запуск:

```bash
make smoke-simulator
```

Или напрямую:

```bash
python scripts/run_simulator_regression.py --base-url http://127.0.0.1:8000
```

Отчёт:

`artifacts/simulator-regression/latest.md`
