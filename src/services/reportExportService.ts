import type { ExportFormat, ReportCard } from "../types/academy";

export async function downloadReportFile(report: ReportCard, format: ExportFormat): Promise<string> {
  void report;
  void format;
  return "На web файл скачивается автоматически. На других платформах пока доступен просмотр отчета.";
}

export async function openExport(report: ReportCard, format: ExportFormat): Promise<string> {
  return downloadReportFile(report, format);
}
