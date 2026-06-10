from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
import re


DIALOG_LOG_DIR = Path(__file__).resolve().parents[2] / "artifacts" / "log_dialog"


def append_dialog_log(
    *,
    model_name: str,
    scenario_name: str,
    dialogue: str,
    logged_at: datetime | None = None,
    log_dir: Path = DIALOG_LOG_DIR,
) -> Path:
    timestamp = logged_at or datetime.now(timezone.utc)
    safe_model = _slugify(model_name)
    safe_scenario = _slugify(scenario_name)
    file_path = log_dir / f"{safe_model}{safe_scenario}.md"

    log_dir.mkdir(parents=True, exist_ok=True)
    entry = "\n".join(
        [
            f"Дата: {timestamp.isoformat()}",
            "",
            dialogue.strip(),
            "---",
            "",
        ]
    )
    file_path.write_text(_append_existing_content(file_path, entry), encoding="utf-8")
    return file_path


def _append_existing_content(file_path: Path, entry: str) -> str:
    if not file_path.exists():
        return entry

    previous = file_path.read_text(encoding="utf-8")
    separator = "" if previous.endswith("\n") else "\n"
    return f"{previous}{separator}{entry}"


def _slugify(value: str) -> str:
    normalized = value.strip().lower().replace("/", "-").replace(" ", "-")
    return re.sub(r"[^a-z0-9_-]+", "", normalized)
