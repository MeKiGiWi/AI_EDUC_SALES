from __future__ import annotations

from pathlib import Path

import pytest
from sqlalchemy import create_engine, text
from fastapi import status
from httpx import ASGITransport, AsyncClient

from app.database import initialize_database, reset_database_state
from app.main import app
from app.models import CompetencyLevel, EvaluationCompetencyRaw, EvaluationResultRaw


def build_evaluation_payload() -> dict[str, object]:
    evaluation = EvaluationResultRaw(
        overall_level=CompetencyLevel.MIDDLE,
        overall_comment="Диалог уверенный, но можно усилить фиксацию следующего шага.",
        overall_recommendations=[
            "Четче подтверждать договоренность по следующему контакту.",
            "Глубже уточнять бизнесовые последствия бездействия.",
        ],
        competencies=[
            EvaluationCompetencyRaw(
                name="Умение задавать вопросы",
                level=CompetencyLevel.MIDDLE,
                argument="Менеджер задает открытые вопросы и уточняет контекст.",
                quote=["Расскажите, как вы сейчас решаете этот вопрос?"],
                recommendations=["Добавить вопросы про потери и риски."],
            ),
            EvaluationCompetencyRaw(
                name="Диагностика потребности",
                level=CompetencyLevel.MIDDLE,
                argument="Уточняет задачу клиента и критерии выбора.",
                quote=["Кроме цены, что будет для вас критично?"],
                recommendations=["Фиксировать последствия текущей ситуации."],
            ),
            EvaluationCompetencyRaw(
                name="Формулировка ценности через выгоду",
                level=CompetencyLevel.SENIOR,
                argument="Связывает решение с уменьшением простоев и рисков.",
                quote=["Это поможет вам избежать простоя линии в сезон."],
                recommendations=["Подкреплять выгоду расчетом по срокам."],
            ),
            EvaluationCompetencyRaw(
                name="Работа с возражением «подумаю / не сейчас»",
                level=CompetencyLevel.MIDDLE,
                argument="Корректно исследует причины паузы и не давит.",
                quote=["Что вы хотите проверить перед окончательным решением?"],
                recommendations=["Уточнять критерии сравнения поставщиков."],
            ),
            EvaluationCompetencyRaw(
                name="Фиксация следующего шага",
                level=CompetencyLevel.JUNIOR,
                argument="Следующий шаг обозначен, но без точной даты и цели.",
                quote=["Я тогда вышлю материалы."],
                recommendations=["Сразу договариваться о времени следующего созвона."],
            ),
        ],
    )
    return evaluation.model_dump(mode="json")


@pytest.fixture()
def sqlite_database(monkeypatch, tmp_path: Path):
    database_path = tmp_path / "reports-test.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{database_path}")
    reset_database_state()
    initialize_database()
    yield database_path
    reset_database_state()


@pytest.mark.asyncio
async def test_create_list_and_get_report(sqlite_database: Path) -> None:
    student_payload = {
        "role": "student",
        "scenario_id": "baseline",
        "scenario_title": "Baseline сценарий",
        "source_label": "simulator",
        "session_id": "session-123",
        "evaluation": build_evaluation_payload(),
    }
    manager_payload = {
        "role": "manager",
        "scenario_id": "manager-scenario",
        "scenario_title": "Manager сценарий",
        "source_label": "manager-dashboard",
        "session_id": "session-456",
        "evaluation": build_evaluation_payload(),
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        created = await client.post("/api/v1/reports", json=student_payload)
        created_payload = created.json()
        created_duplicate = await client.post("/api/v1/reports", json=student_payload)
        created_duplicate_payload = created_duplicate.json()
        created_manager = await client.post("/api/v1/reports", json=manager_payload)
        created_manager_payload = created_manager.json()

        listed = await client.get("/api/v1/reports")
        listed_payload = listed.json()
        listed_student = await client.get("/api/v1/reports", params={"role": "student"})
        listed_student_payload = listed_student.json()

        report_id = created_payload["id"]
        fetched = await client.get(f"/api/v1/reports/{report_id}")
        fetched_payload = fetched.json()

    assert created.status_code == status.HTTP_201_CREATED
    assert created_payload["role"] == "student"
    assert created_payload["format"] == "pdf"
    assert created_payload["title"].startswith("Baseline сценарий")
    assert created_payload["scenarioId"] == "baseline"
    assert created_payload["scenarioTitle"] == "Baseline сценарий"
    assert created_payload["status"] == "ready"
    assert created_payload["createdAt"]
    assert created_payload["updatedAt"]
    assert created_payload["sourceLabel"] == "simulator"
    assert created_payload["sessionId"] == "session-123"
    assert any(section["title"] == "Рекомендации" for section in created_payload["previewSections"])
    assert created_payload["reportV2"]["reportVersion"] == "2.0"

    assert created_duplicate.status_code == status.HTTP_201_CREATED
    assert created_duplicate_payload["id"] == created_payload["id"]
    assert created_duplicate_payload["sessionId"] == "session-123"

    assert listed.status_code == status.HTTP_200_OK
    assert len(listed_payload["items"]) == 2
    assert {item["id"] for item in listed_payload["items"]} == {
        report_id,
        created_manager_payload["id"],
    }
    assert all(item["status"] == "ready" for item in listed_payload["items"])
    assert {item["sessionId"] for item in listed_payload["items"]} == {"session-123", "session-456"}

    assert listed_student.status_code == status.HTTP_200_OK
    assert len(listed_student_payload["items"]) == 1
    assert listed_student_payload["items"][0]["id"] == report_id
    assert listed_student_payload["items"][0]["role"] == "student"

    assert fetched.status_code == status.HTTP_200_OK
    assert fetched_payload["id"] == report_id
    assert fetched_payload["summary"] == created_payload["summary"]
    assert fetched_payload["scenarioId"] == "baseline"
    assert fetched_payload["scenarioTitle"] == "Baseline сценарий"
    assert fetched_payload["sourceLabel"] == "simulator"
    assert fetched_payload["sessionId"] == "session-123"
    assert fetched_payload["reportV2"]["summary"]["title"].startswith("Отчет по диалогу")


@pytest.mark.asyncio
async def test_initialize_database_upgrades_legacy_reports_schema(monkeypatch, tmp_path: Path) -> None:
    database_path = tmp_path / "reports-legacy.db"
    engine = create_engine(f"sqlite:///{database_path}", future=True)

    with engine.begin() as connection:
        connection.execute(
            text(
                """
                CREATE TABLE reports (
                    id VARCHAR(36) PRIMARY KEY,
                    role VARCHAR(24),
                    title VARCHAR(300),
                    scenario_title VARCHAR(300),
                    report_type VARCHAR(48),
                    summary TEXT,
                    default_format VARCHAR(16),
                    owner_label VARCHAR(100),
                    available_formats JSON,
                    preview_sections JSON,
                    evaluation_payload JSON,
                    created_at DATETIME,
                    updated_at DATETIME
                )
                """
            )
        )

    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{database_path}")
    reset_database_state()
    initialize_database()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        listed = await client.get("/api/v1/reports", params={"role": "student"})

    assert listed.status_code == status.HTTP_200_OK
    assert listed.json() == {"items": []}
