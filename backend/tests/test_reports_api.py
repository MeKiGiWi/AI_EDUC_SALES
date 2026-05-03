from __future__ import annotations

from pathlib import Path

import pytest
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
async def test_create_list_and_export_report(sqlite_database: Path) -> None:
    payload = {
        "role": "student",
        "scenario_title": "Baseline сценарий",
        "session_id": "session-123",
        "evaluation": build_evaluation_payload(),
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        created = await client.post("/api/v1/reports", json=payload)
        created_payload = created.json()

        listed = await client.get("/api/v1/reports", params={"role": "student"})
        listed_payload = listed.json()

        report_id = created_payload["id"]
        pdf_response = await client.get(f"/api/v1/reports/{report_id}/export/pdf")
        csv_response = await client.get(f"/api/v1/reports/{report_id}/export/csv")

    assert created.status_code == status.HTTP_201_CREATED
    assert created_payload["role"] == "student"
    assert created_payload["format"] == "pdf"
    assert created_payload["title"].startswith("Baseline сценарий")
    assert any(section["title"] == "Рекомендации" for section in created_payload["previewSections"])

    assert listed.status_code == status.HTTP_200_OK
    assert len(listed_payload["items"]) == 1
    assert listed_payload["items"][0]["id"] == report_id

    assert pdf_response.status_code == status.HTTP_200_OK
    assert pdf_response.headers["content-type"] == "application/pdf"
    assert "attachment;" in pdf_response.headers["content-disposition"]
    assert pdf_response.content.startswith(b"%PDF")
    assert len(pdf_response.content) > 10000

    assert csv_response.status_code == status.HTTP_200_OK
    assert csv_response.headers["content-type"].startswith("text/csv")
    assert "Baseline сценарий" in csv_response.content.decode("utf-8-sig")
