from __future__ import annotations

from pathlib import Path

from scripts.report_generation_cases import ALL_REPORT_GENERATION_CASES
from scripts.run_report_generation_regression import (
    ReportCheck,
    ReportGenerationCaseResult,
    aggregate_check_status,
    build_case_check,
    build_pdf_filename,
    format_scenario_report,
    write_reports,
)


def make_result(
    *,
    name: str,
    scenario_id: str,
    level: str,
    pdf_filename: str,
) -> ReportGenerationCaseResult:
    return ReportGenerationCaseResult(
        name=name,
        scenario_id=scenario_id,
        scenario_title="Scenario title",
        expected_level=level,
        evaluation_level=level,
        report_level=level,
        result="PASS",
        session_id=f"session-{name}",
        report_id=f"report-{name}",
        report_title=f"{scenario_id} report",
        pdf_filename=pdf_filename,
        customer_opening="Стартовое сообщение клиента",
        dialogue_turns=[],
        checks=[ReportCheck("ok", "PASS", "ok")],
        debug={
            "report_create_response": {
                "status": "ready",
                "format": "pdf",
                "ownerLabel": "Ученик",
                "sourceLabel": "Report generation regression",
                "createdAt": "05.05 12:00",
                "updatedAt": "05.05 12:00",
                "previewSections": [{"title": "Краткое резюме", "lines": ["Строка 1", "Строка 2"]}],
            },
            "finish_response": {
                "report_v2": {
                    "summary": {
                        "title": "Отчёт",
                        "headline": "Краткий вывод",
                        "overallScore": 68,
                        "shortResume": ["A", "B", "C"],
                    },
                    "competencies": [{"id": "c1"}],
                    "dialogueAnalysis": [{"turnIndex": 1}],
                    "strengths": [{"title": "Сильная сторона", "comment": "Комментарий"}],
                    "developmentAreas": [{"title": "Зона роста", "comment": "Комментарий", "actions": ["Шаг 1"]}],
                    "nextSteps": ["Шаг 1", "Шаг 2"],
                }
            },
            "report_v2_payload": {
                "summary": {
                    "title": "Отчёт",
                    "headline": "Краткий вывод",
                    "overallScore": 68,
                    "shortResume": ["A", "B", "C"],
                },
                "competencies": [{"title": "Компетенция", "level": "Middle", "score": 68, "comment": "Комментарий", "evidence": []}],
                "dialogueAnalysis": [{"turnIndex": 1, "speakerLabel": "Менеджер", "text": "Текст", "analysis": {"status": "good", "comment": "Комментарий", "competencyIds": []}}],
                "strengths": [{"title": "Сильная сторона", "comment": "Комментарий", "evidence": []}],
                "developmentAreas": [{"title": "Зона роста", "comment": "Комментарий", "actions": ["Шаг 1"]}],
                "nextSteps": ["Шаг 1", "Шаг 2"],
            },
        },
    )


def test_all_report_generation_cases_cover_two_scenarios_and_three_levels() -> None:
    assert len(ALL_REPORT_GENERATION_CASES) == 6

    by_scenario: dict[str, set[str]] = {}
    for case in ALL_REPORT_GENERATION_CASES:
        by_scenario.setdefault(case.scenario_id, set()).add(case.expected_level)

    assert by_scenario == {
        "clinic-appointment": {"Junior", "Middle", "Senior"},
        "clinic-complaint": {"Junior", "Middle", "Senior"},
    }


def test_build_pdf_filename_matches_frontend_logic() -> None:
    assert build_pdf_filename("Первичная запись: тревожный пациент с симптомами 05.05") == (
        "первичная-запись-тревожный-пациент-с-симптома.pdf"
    )
    assert build_pdf_filename("") == "report.pdf"
    assert build_pdf_filename("!!!") == "report.pdf"


def test_format_scenario_report_contains_all_levels_and_pdf_section() -> None:
    report = format_scenario_report(
        "clinic-appointment",
        [
            make_result(
                name="clinic_appointment_report_middle",
                scenario_id="clinic-appointment",
                level="Middle",
                pdf_filename="middle.pdf",
            ),
            make_result(
                name="clinic_appointment_report_senior",
                scenario_id="clinic-appointment",
                level="Senior",
                pdf_filename="senior.pdf",
            ),
            make_result(
                name="clinic_appointment_report_junior",
                scenario_id="clinic-appointment",
                level="Junior",
                pdf_filename="junior.pdf",
            ),
        ],
    )

    assert "## Диалог Junior" in report
    assert "## Диалог Middle" in report
    assert "## Диалог Senior" in report
    assert "**PDF-файл отчёта:**" in report
    assert "### Карточка отчёта" in report
    assert "### Competencies" in report
    assert "### Dialogue Analysis" in report
    assert ".pdf" in report


def test_write_reports_creates_expected_files_and_keeps_scenarios_separate(tmp_path: Path) -> None:
    results = [
        make_result(
            name="clinic_appointment_report_junior",
            scenario_id="clinic-appointment",
            level="Junior",
            pdf_filename="appointment.pdf",
        ),
        make_result(
            name="clinic_appointment_report_middle",
            scenario_id="clinic-appointment",
            level="Middle",
            pdf_filename="appointment-middle.pdf",
        ),
        make_result(
            name="clinic_appointment_report_senior",
            scenario_id="clinic-appointment",
            level="Senior",
            pdf_filename="appointment-senior.pdf",
        ),
        make_result(
            name="clinic_complaint_report_junior",
            scenario_id="clinic-complaint",
            level="Junior",
            pdf_filename="complaint.pdf",
        ),
        make_result(
            name="clinic_complaint_report_middle",
            scenario_id="clinic-complaint",
            level="Middle",
            pdf_filename="complaint-middle.pdf",
        ),
        make_result(
            name="clinic_complaint_report_senior",
            scenario_id="clinic-complaint",
            level="Senior",
            pdf_filename="complaint-senior.pdf",
        ),
    ]

    write_reports(base_url="http://127.0.0.1:8000", strict=False, output_dir=tmp_path, results=results)

    assert (tmp_path / "index.md").exists()
    assert (tmp_path / "clinic-appointment.md").exists()
    assert (tmp_path / "clinic-complaint.md").exists()
    assert (tmp_path / "debug.json").exists()

    appointment_report = (tmp_path / "clinic-appointment.md").read_text(encoding="utf-8")
    complaint_report = (tmp_path / "clinic-complaint.md").read_text(encoding="utf-8")
    assert "clinic_appointment_report_junior" in appointment_report
    assert "clinic_complaint_report_junior" not in appointment_report
    assert "clinic_complaint_report_junior" in complaint_report
    assert "clinic_appointment_report_junior" not in complaint_report


def test_strict_logic_converts_level_mismatch_from_warn_to_error() -> None:
    warn_check = build_case_check(
        "evaluation_level_matches",
        False,
        detail="evaluation level mismatch",
        error_on_failure=False,
        strict=False,
    )
    error_check = build_case_check(
        "evaluation_level_matches",
        False,
        detail="evaluation level mismatch",
        error_on_failure=False,
        strict=True,
    )

    assert warn_check.status == "WARN"
    assert error_check.status == "ERROR"
    assert aggregate_check_status([warn_check]) == "WARN"
    assert aggregate_check_status([error_check]) == "ERROR"
