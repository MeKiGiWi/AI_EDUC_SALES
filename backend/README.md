# Backend

Backend собран на `FastAPI + LangChain + LangGraph` и обслуживает два основных потока:

- simulator API для запуска, ведения и завершения диалоговых сессий;
- reports API для сохранения и чтения отчетов по завершенным тренировкам.

## Актуальная структура

- `app/api.py` — simulator API: catalog, session start, message reply, finish/evaluation
- `app/api_reports.py` — reports API: create/list/get reports
- `app/agents.py` — runtime-агенты симулятора и оценки
- `app/graph.py` — LangGraph-граф simulator flow
- `app/runtime.py` — сборка runtime dependencies и process-local session store
- `app/prompts.py` — runtime prompts и константы симулятора
- `app/report_*` — mapper/repository/service слой отчетов
- `app/database.py` — SQLAlchemy engine/session и инициализация DB
- `kb/scenarios/` — сценарии и их registry
- `artifacts/langgraph/` — артефакты схемы графа
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
```

После `make build` схема графа появляется в `artifacts/langgraph/` в форматах Mermaid и Markdown.

После `make openapi` обновляется:

- `openapi.json`
