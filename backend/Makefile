PYTHON ?= python3.11

.PHONY: build test render-graph openapi smoke-simulator smoke-reports

build:
	$(PYTHON) -m compileall app
	$(PYTHON) -c "from app.main import app, write_openapi_contract; from app.simulator.render_mermaid_graph import render_graph_artifacts; render_graph_artifacts(); write_openapi_contract(app)"

test:
	$(PYTHON) -m pytest

render-graph:
	$(PYTHON) -m app.simulator.render_mermaid_graph

openapi:
	$(PYTHON) -c "from app.main import app, write_openapi_contract; write_openapi_contract(app)"

smoke-simulator:
	$(PYTHON) scripts/run_simulator_regression.py

smoke-reports:
	$(PYTHON) scripts/run_report_generation_regression.py
