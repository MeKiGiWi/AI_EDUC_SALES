# Backend

Минимальный backend симулятора собран на `FastAPI + LangChain + LangGraph`.

## Что внутри

- `app/simulator_agents.py` — оба агента
- `app/simulator_graph.py` — упрощенный граф
- `app/simulator_api.py` — API
- `app/simulator_prompts.py` — runtime-промпты, которые реально используются кодом
- `kb/prompts/` — справочные `.md`
- `kb/scenarios/scenarios.json` — реестр сценариев
- `artifacts/langgraph/` — отрисованная схема графа

## Команды

```bash
make build
make test
make render-graph
```

После `make build` схема графа появляется в:

- `artifacts/langgraph/simulator_graph.mmd`
- `artifacts/langgraph/simulator_graph.md`
