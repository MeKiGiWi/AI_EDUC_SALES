from __future__ import annotations

import csv
import io

from app.models import ReportCardDto


def build_csv_content(report: ReportCardDto) -> str:
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["Отчет", report.title])
    writer.writerow(["Владелец", report.ownerLabel])
    writer.writerow(["Обновлен", report.updatedAt])
    writer.writerow(["Формат", report.format.value.upper()])
    writer.writerow([])

    for section in report.previewSections:
        writer.writerow([section.title, ""])
        for line in section.lines:
            writer.writerow(["", line])
        writer.writerow([])

    return buffer.getvalue()
