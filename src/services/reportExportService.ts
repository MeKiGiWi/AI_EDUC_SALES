import type { ExportFormat, ReportCard } from "../types/academy";

export async function openExport(report: ReportCard, format: ExportFormat): Promise<void> {
  throw new Error("Экспорт PDF/CSV доступен в web-версии.");
}
