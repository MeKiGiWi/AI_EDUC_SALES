from __future__ import annotations

import re
from pathlib import Path
import sys

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from scripts.run_simulator_regression import (
    CaseResult,
    DEFAULT_OPENING_RUNS,
    DEFAULT_ROLE_COPY_RUNS,
    DEFAULT_SCRIPTED_RUNS,
    HeuristicCheck,
    TurnRecord,
    format_scenario_report,
    resolve_case_runs,
    resolve_opening_runs,
    select_cases,
    write_reports,
)
from scripts.smoke_cases.clinic_appointment import CLINIC_APPOINTMENT_SMOKE
from scripts.smoke_cases.clinic_appointment_role_copy_guard import CLINIC_APPOINTMENT_ROLE_COPY_GUARD_SMOKE
from scripts.smoke_cases.opening_variants import OPENING_VARIANT_SMOKE_CASES


def make_turn(*, learner_text: str, customer_text: str, rude: str = "no", check_status: str = "PASS") -> TurnRecord:
    return TurnRecord(
        learner_text=learner_text,
        learner_source="scripted_test_input",
        customer_text=customer_text,
        rude=rude,
        moderation_reason=None,
        status="active",
        confidence=0.88,
        checks=[HeuristicCheck(name="customer_reply_role", status=check_status, detail="ok")],
    )


def make_result(*, scenario_id: str, name: str, run_index: int, result: str) -> CaseResult:
    return CaseResult(
        name=name,
        scenario_id=scenario_id,
        case_kind="scripted_reference",
        run_index=run_index,
        result=result,
        customer_opening="Здравствуйте. Опишите, пожалуйста, что вас беспокоит.",
        transcript=[make_turn(learner_text="Здравствуйте", customer_text="Подскажите, к кому мне лучше записаться?")],
    )


def test_report_format_is_minimal_and_ordered() -> None:
    markdown = format_scenario_report(
        "clinic-appointment",
        [make_result(scenario_id="clinic-appointment", name="case_a", run_index=1, result="PASS")],
    )

    assert re.search(r"(?m)^\d+\. ", markdown) is None
    assert "## Тесты диалогов, похожих на эталонные" in markdown
    assert "**Стартовое сообщение API**" in markdown
    assert "**Сообщение пользователя**" in markdown
    assert "**Проверка на грубость:**" in markdown
    assert "**Живой ответ LLM**" in markdown
    assert "**Проверки:**" in markdown
    assert "Raw API metadata" not in markdown
    assert "kind:" not in markdown
    assert "actor:" not in markdown
    assert "source:" not in markdown
    assert "confidence:" not in markdown
    assert "status:" not in markdown
    assert markdown.index("**Сообщение пользователя**") < markdown.index("**Проверка на грубость:**") < markdown.index("**Живой ответ LLM**")
    assert "```text\nЗдравствуйте" in markdown
    assert "```text\nПодскажите, к кому мне лучше записаться?" in markdown


def test_opening_group_description_mentions_admin_replies() -> None:
    markdown = format_scenario_report(
        "clinic-appointment",
        [
            CaseResult(
                name="one_phrase_case",
                scenario_id="clinic-appointment",
                case_kind="one_phrase_opening",
                run_index=1,
                result="PASS",
                customer_opening="Здравствуйте. Я впервые к вам обращаюсь.",
                transcript=[make_turn(learner_text="Здравствуйте. Подскажите, пожалуйста, как давно это длится?", customer_text="Наверное, уже несколько дней.")],
            )
        ],
    )

    assert "однофразовых реплик администратора клиники" in markdown


def test_output_writer_splits_by_scenario(tmp_path: Path) -> None:
    results = [
        make_result(scenario_id="clinic-appointment", name="case_a", run_index=1, result="PASS"),
        make_result(scenario_id="clinic-complaint", name="case_b", run_index=1, result="WARN"),
    ]

    index_path = write_reports(base_url="http://127.0.0.1:8011", strict=True, output_dir=tmp_path, results=results)

    assert index_path == tmp_path / "index.md"
    assert (tmp_path / "index.md").exists()
    assert (tmp_path / "clinic-appointment.md").exists()
    assert (tmp_path / "clinic-complaint.md").exists()
    assert (tmp_path / "debug.json").exists()
    assert "clinic-complaint" not in (tmp_path / "clinic-appointment.md").read_text(encoding="utf-8")
    assert "clinic-appointment" not in (tmp_path / "clinic-complaint.md").read_text(encoding="utf-8")
    index_markdown = (tmp_path / "index.md").read_text(encoding="utf-8")
    assert "[clinic-appointment.md](clinic-appointment.md)" in index_markdown
    assert "[clinic-complaint.md](clinic-complaint.md)" in index_markdown


def test_opening_variants_are_well_formed() -> None:
    assert len(OPENING_VARIANT_SMOKE_CASES) == 10
    for case in OPENING_VARIANT_SMOKE_CASES:
        assert case.kind == "one_phrase_opening"
        assert case.scenario_id in {"clinic-appointment", "clinic-complaint"}
        assert len(case.learner_messages) == 1
        assert case.learner_messages[0].strip()
        assert case.opening_override is None


def test_cli_selector_and_opening_runs_behavior() -> None:
    assert resolve_opening_runs(None) == DEFAULT_OPENING_RUNS
    assert resolve_opening_runs(10) == 10
    assert resolve_case_runs(CLINIC_APPOINTMENT_SMOKE, opening_runs=7) == DEFAULT_SCRIPTED_RUNS
    assert resolve_case_runs(CLINIC_APPOINTMENT_ROLE_COPY_GUARD_SMOKE, opening_runs=7) == DEFAULT_ROLE_COPY_RUNS
    assert resolve_case_runs(OPENING_VARIANT_SMOKE_CASES[0], opening_runs=7) == 7
    assert all(case.kind == "one_phrase_opening" for case in select_cases(suite="one-phrase", case_name=None))
    assert all(case.kind == "scripted_reference" for case in select_cases(suite="scripted", case_name=None))
    assert all(case.kind == "role_copy_guard" for case in select_cases(suite="role-copy", case_name=None))
    assert len(select_cases(suite="scripted", case_name=None)) >= 4
    selected = select_cases(suite="all", case_name="clinic_complaint_service_recovery")
    assert [case.name for case in selected] == ["clinic_complaint_service_recovery"]
