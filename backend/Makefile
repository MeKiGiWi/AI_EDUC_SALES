PYTHON ?= python3.11

.PHONY: build test render-graph

build:
	$(PYTHON) -m compileall app
	$(PYTHON) -m app.render_graph

test:
	$(PYTHON) -m pytest

render-graph:
	$(PYTHON) -m app.render_graph
