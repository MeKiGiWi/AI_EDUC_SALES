from datetime import datetime, timezone

from app.dialog_logger import append_dialog_log


def test_append_dialog_log_creates_markdown_file_and_appends_entries(tmp_path) -> None:
    logged_at = datetime(2026, 5, 1, 12, 0, tzinfo=timezone.utc)
    file_path = append_dialog_log(
        model_name="openai/gpt-oss-120b",
        scenario_name="baseline",
        dialogue="Менеджер: Добрый день\nКлиент: Слушаю",
        logged_at=logged_at,
        log_dir=tmp_path,
    )

    append_dialog_log(
        model_name="openai/gpt-oss-120b",
        scenario_name="baseline",
        dialogue="Менеджер: Предлагаю пилот\nКлиент: Интересно",
        logged_at=logged_at,
        log_dir=tmp_path,
    )

    assert file_path.name == "openai-gpt-oss-120bbaseline.md"
    assert file_path.exists()

    content = file_path.read_text(encoding="utf-8")
    assert content.count("Дата: 2026-05-01T12:00:00+00:00") == 2
    assert "Менеджер: Добрый день\nКлиент: Слушаю" in content
    assert "Менеджер: Предлагаю пилот\nКлиент: Интересно" in content
    assert content.count("---") == 2
