from functools import lru_cache
from pathlib import Path

import yaml

from app.domain.methodology import (
    CompetencyModel,
    EdgeCaseRule,
    MethodologyBundle,
    ReportTemplateDefinition,
    ScenarioDefinition,
)

METHODOLOGY_DIR = Path(__file__).resolve().parent.parent / "methodology"


def _load_yaml(filename: str) -> dict:
    with (METHODOLOGY_DIR / filename).open("r", encoding="utf-8") as file:
        return yaml.safe_load(file)


@lru_cache(maxsize=1)
def load_active_methodology() -> MethodologyBundle:
    competency_model = CompetencyModel.model_validate(
        _load_yaml("competency_model_v1.yaml")
    )
    scenarios_payload = _load_yaml("scenario_production_cooling_v1.yaml")
    edge_cases_payload = _load_yaml("edge_cases_v1.yaml")
    report_template = ReportTemplateDefinition.model_validate(
        _load_yaml("report_template_v1.yaml")
    )

    scenarios = [
        ScenarioDefinition.model_validate(item)
        for item in scenarios_payload.get("scenarios", [])
    ]
    edge_cases = [
        EdgeCaseRule.model_validate(item)
        for item in edge_cases_payload.get("edge_cases", [])
    ]
    return MethodologyBundle(
        competency_model=competency_model,
        scenarios=scenarios,
        edge_cases=edge_cases,
        report_template=report_template,
    )


def get_scenario_definition(scenario_id: str) -> ScenarioDefinition:
    methodology = load_active_methodology()
    for scenario in methodology.scenarios:
        if scenario.id == scenario_id:
            return scenario
    raise KeyError(f"Scenario '{scenario_id}' was not found.")


def get_scenarios_raw() -> list[ScenarioDefinition]:
    """Return raw scenario definitions without DTO mapping."""
    methodology = load_active_methodology()
    return methodology.scenarios
