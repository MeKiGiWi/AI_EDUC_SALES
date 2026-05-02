import React, { useMemo, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

import { AppBottomSheet } from "../../components/ui/AppBottomSheet";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { EmptyState } from "../../components/ui/EmptyState";
import { StatusPill } from "../../components/ui/StatusPill";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import { roleLabels } from "../../navigation/routes";
import { themeTokens } from "../../theme/tokens";
import { useTheme } from "../../theme/useTheme";
import type { ExportFormat, ReportCard, UserRole } from "../../types/academy";

interface ReportsScreenProps {
  activeRole: UserRole;
  reports: ReportCard[];
  highlightReportId?: string;
}

type ReportsSheetState =
  | { kind: "preview"; report: ReportCard }
  | { kind: "export"; title: string; lines: string[] }
  | { kind: "info"; title: string; lines: string[] }
  | null;

const reportExportTheme = themeTokens;
const browserFontStack = '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const reportPageWidth = 1240;
const reportPageHeight = 1754;
const reportPagePadding = 72;
const reportPageFooterHeight = 56;
const reportCardGap = 28;
const reportCardRadius = 30;
const reportCardWidth = reportPageWidth - reportPagePadding * 2;

interface WrappedSectionLine {
  bullet: string;
  lines: string[];
}

interface RenderSectionCard {
  title: string;
  items: WrappedSectionLine[];
  height: number;
}

const roleContent = {
  student: {
    emptyTitle: "Отчеты пока не сохранены",
    emptyDescription:
      "Завершите диалог в тренажере — здесь появятся все ваши отчеты с предпросмотром и выгрузкой.",
    infoLines: [
      "После каждого завершенного диалога сохраняется новый отчет.",
      "Все отчеты хранятся локально на устройстве.",
      "Из этой вкладки доступны предпросмотр, PDF и CSV."
    ]
  },
  manager: {
    emptyTitle: "Отчеты по практике пока не сохранены",
    emptyDescription:
      "После завершения диалога руководитель увидит здесь все отчеты по практикам.",
    infoLines: [
      "Отчеты сохраняются локально после каждого завершения диалога.",
      "Из этой вкладки доступны предпросмотр, PDF и CSV."
    ]
  },
  hr: {
    emptyTitle: "Отчеты пока не поступили",
    emptyDescription:
      "Когда диалог будет завершен и сохранен, отчет появится здесь.",
    infoLines: [
      "Все отчеты хранятся локально на устройстве.",
      "Выгрузки строятся прямо из сохраненных отчетов."
    ]
  },
  admin: {
    emptyTitle: "Отчеты пока не зафиксированы",
    emptyDescription:
      "Пока ни один завершенный диалог не сохранил отчет.",
    infoLines: [
      "Все отчеты хранятся локально на устройстве.",
      "PDF и CSV формируются по запросу."
    ]
  }
} as const;

function buildSafeFilename(report: ReportCard, extension: string): string {
  const normalizedTitle = report.title
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return `${normalizedTitle || "report"}.${extension}`;
}

function escapeCsvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function buildCsv(report: ReportCard): string {
  const rows: string[][] = [
    ["Отчет", report.title],
    ["Владелец", report.ownerLabel],
    ["Обновлен", report.updatedAt],
    ["Формат", report.format.toUpperCase()],
    ["", ""]
  ];

  report.previewSections.forEach((section) => {
    rows.push([section.title, ""]);
    section.lines.forEach((line) => {
      rows.push(["", line]);
    });
    rows.push(["", ""]);
  });

  return rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
}

function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function createCanvasContext(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement("canvas");
  canvas.width = reportPageWidth;
  canvas.height = reportPageHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Браузер не поддерживает Canvas для генерации PDF.");
  }

  return { canvas, ctx };
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillColor: string | CanvasGradient | CanvasPattern,
  strokeColor?: string
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fillStyle = fillColor;
  ctx.fill();

  if (strokeColor) {
    ctx.lineWidth = 2;
    ctx.strokeStyle = strokeColor;
    ctx.stroke();
  }
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const source = text.trim();
  if (!source) {
    return [];
  }

  const words = source.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  const pushBrokenWord = (word: string) => {
    let fragment = "";
    for (const character of word) {
      const candidate = fragment ? `${fragment}${character}` : character;
      if (ctx.measureText(candidate).width > maxWidth && fragment) {
        lines.push(fragment);
        fragment = character;
      } else {
        fragment = candidate;
      }
    }
    currentLine = fragment;
  };

  words.forEach((word) => {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      currentLine = candidate;
      return;
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    if (ctx.measureText(word).width <= maxWidth) {
      currentLine = word;
      return;
    }

    pushBrokenWord(word);
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function prepareSectionCard(
  ctx: CanvasRenderingContext2D,
  section: ReportCard["previewSections"][number]
): RenderSectionCard {
  ctx.font = `600 20px ${browserFontStack}`;

  const items = section.lines.map((line) => ({
    bullet: "•",
    lines: wrapText(ctx, line, reportCardWidth - 112)
  }));

  const contentHeight = items.reduce((sum, item) => {
    const lineCount = Math.max(item.lines.length, 1);
    return sum + lineCount * 30 + 14;
  }, 0);

  return {
    title: section.title,
    items,
    height: 44 + 24 + contentHeight + 28
  };
}

function drawPageBackground(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = reportExportTheme.semantic.backgroundWarm;
  ctx.fillRect(0, 0, reportPageWidth, reportPageHeight);

  const heroGradient = ctx.createLinearGradient(0, 0, reportPageWidth, 520);
  heroGradient.addColorStop(0, reportExportTheme.semantic.cardAccent);
  heroGradient.addColorStop(1, reportExportTheme.semantic.backgroundWarm);
  ctx.fillStyle = heroGradient;
  ctx.fillRect(0, 0, reportPageWidth, 520);

  ctx.globalAlpha = 0.28;
  ctx.fillStyle = reportExportTheme.semantic.glow;
  ctx.beginPath();
  ctx.arc(reportPageWidth - 190, 126, 158, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(138, 212, 92, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawHeroCard(ctx: CanvasRenderingContext2D, report: ReportCard): number {
  ctx.font = `800 44px ${browserFontStack}`;
  const titleLines = wrapText(ctx, report.title, reportCardWidth - 120);
  ctx.font = `500 24px ${browserFontStack}`;
  const summaryLines = wrapText(ctx, report.summary, reportCardWidth - 120);

  const heroHeight = 236 + titleLines.length * 50 + summaryLines.length * 30;
  const heroGradient = ctx.createLinearGradient(
    reportPagePadding,
    reportPagePadding,
    reportPagePadding + reportCardWidth,
    reportPagePadding + heroHeight
  );
  heroGradient.addColorStop(0, reportExportTheme.semantic.cardAccent);
  heroGradient.addColorStop(1, "#FFFFFF");

  ctx.save();
  ctx.shadowColor = "rgba(16, 33, 20, 0.12)";
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 10;
  drawRoundedRect(
    ctx,
    reportPagePadding,
    reportPagePadding,
    reportCardWidth,
    heroHeight,
    40,
    heroGradient,
    reportExportTheme.semantic.border
  );
  ctx.restore();

  ctx.fillStyle = reportExportTheme.semantic.textMuted;
  ctx.font = `700 15px ${browserFontStack}`;
  ctx.fillText("AI SALES ACADEMY", reportPagePadding + 34, reportPagePadding + 44);

  ctx.fillStyle = reportExportTheme.semantic.textPrimary;
  ctx.font = `800 44px ${browserFontStack}`;
  let currentY = reportPagePadding + 94;
  titleLines.forEach((line) => {
    ctx.fillText(line, reportPagePadding + 34, currentY);
    currentY += 50;
  });

  ctx.fillStyle = reportExportTheme.semantic.textSecondary;
  ctx.font = `500 24px ${browserFontStack}`;
  currentY += 8;
  summaryLines.forEach((line) => {
    ctx.fillText(line, reportPagePadding + 34, currentY);
    currentY += 30;
  });

  const pillY = reportPagePadding + heroHeight - 72;
  const pills = [report.ownerLabel, report.updatedAt];
  let pillX = reportPagePadding + 34;
  ctx.font = `700 16px ${browserFontStack}`;
  pills.forEach((label) => {
    const pillWidth = ctx.measureText(label).width + 36;
    drawRoundedRect(
      ctx,
      pillX,
      pillY,
      pillWidth,
      36,
      18,
      "#FFFFFF",
      reportExportTheme.semantic.border
    );
    ctx.fillStyle = reportExportTheme.semantic.textPrimary;
    ctx.fillText(label, pillX + 18, pillY + 24);
    pillX += pillWidth + 12;
  });

  ctx.fillStyle = reportExportTheme.semantic.textMuted;
  ctx.font = `500 16px ${browserFontStack}`;
  ctx.fillText(
    "Сформировано автоматически по завершенному диалогу.",
    reportPagePadding + 34,
    reportPagePadding + heroHeight - 20
  );

  return reportPagePadding + heroHeight + reportCardGap;
}

function drawContinuationHeader(
  ctx: CanvasRenderingContext2D,
  report: ReportCard,
  pageIndex: number
): number {
  drawRoundedRect(
    ctx,
    reportPagePadding,
    reportPagePadding,
    reportCardWidth,
    94,
    reportCardRadius,
    "#FFFFFF",
    reportExportTheme.semantic.border
  );

  ctx.fillStyle = reportExportTheme.semantic.textMuted;
  ctx.font = `700 14px ${browserFontStack}`;
  ctx.fillText("ОТЧЕТ ПО ДИАЛОГУ", reportPagePadding + 28, reportPagePadding + 34);

  ctx.fillStyle = reportExportTheme.semantic.textPrimary;
  ctx.font = `800 28px ${browserFontStack}`;
  const titleLine = wrapText(ctx, report.title, reportCardWidth - 180)[0] ?? report.title;
  ctx.fillText(titleLine, reportPagePadding + 28, reportPagePadding + 68);

  ctx.fillStyle = reportExportTheme.semantic.textMuted;
  ctx.font = `700 15px ${browserFontStack}`;
  const pageLabel = `Страница ${pageIndex + 1}`;
  const pageLabelWidth = ctx.measureText(pageLabel).width;
  ctx.fillText(pageLabel, reportPagePadding + reportCardWidth - pageLabelWidth - 28, reportPagePadding + 50);

  return reportPagePadding + 94 + reportCardGap;
}

function drawSectionCard(
  ctx: CanvasRenderingContext2D,
  card: RenderSectionCard,
  y: number
): void {
  ctx.save();
  ctx.shadowColor = "rgba(16, 33, 20, 0.08)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 8;
  drawRoundedRect(
    ctx,
    reportPagePadding,
    y,
    reportCardWidth,
    card.height,
    reportCardRadius,
    "#FFFFFF",
    reportExportTheme.semantic.border
  );
  ctx.restore();

  drawRoundedRect(
    ctx,
    reportPagePadding + 24,
    y + 24,
    68,
    8,
    4,
    reportExportTheme.semantic.actionPrimary
  );

  ctx.fillStyle = reportExportTheme.semantic.textPrimary;
  ctx.font = `800 28px ${browserFontStack}`;
  ctx.fillText(card.title, reportPagePadding + 24, y + 70);

  ctx.fillStyle = reportExportTheme.semantic.textSecondary;
  ctx.font = `600 20px ${browserFontStack}`;
  let currentY = y + 110;
  card.items.forEach((item) => {
    item.lines.forEach((line, lineIndex) => {
      const prefix = lineIndex === 0 ? `${item.bullet} ` : "";
      ctx.fillText(prefix + line, reportPagePadding + 32, currentY);
      currentY += 30;
    });
    currentY += 14;
  });
}

function drawPageFooter(
  ctx: CanvasRenderingContext2D,
  pageIndex: number,
  totalPages: number
): void {
  const baselineY = reportPageHeight - reportPagePadding + 6;

  ctx.strokeStyle = reportExportTheme.semantic.border;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(reportPagePadding, baselineY - 28);
  ctx.lineTo(reportPageWidth - reportPagePadding, baselineY - 28);
  ctx.stroke();

  ctx.fillStyle = reportExportTheme.semantic.textMuted;
  ctx.font = `600 16px ${browserFontStack}`;
  ctx.fillText(
    "Экспортировано из AI Sales Academy.",
    reportPagePadding,
    baselineY
  );

  const pageLabel = `${pageIndex + 1} / ${totalPages}`;
  const pageLabelWidth = ctx.measureText(pageLabel).width;
  ctx.fillText(pageLabel, reportPageWidth - reportPagePadding - pageLabelWidth, baselineY);
}

function buildPdfCanvases(report: ReportCard): HTMLCanvasElement[] {
  const pages: Array<{ canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D }> = [];
  const createPage = () => {
    const page = createCanvasContext();
    drawPageBackground(page.ctx);
    pages.push(page);
    return page;
  };

  let page = createPage();
  let currentY = drawHeroCard(page.ctx, report);

  report.previewSections.forEach((section) => {
    const card = prepareSectionCard(page.ctx, section);
    const maxY = reportPageHeight - reportPagePadding - reportPageFooterHeight;

    if (currentY + card.height > maxY) {
      page = createPage();
      currentY = drawContinuationHeader(page.ctx, report, pages.length - 1);
    }

    drawSectionCard(page.ctx, card, currentY);
    currentY += card.height + reportCardGap;
  });

  pages.forEach((item, index) => {
    drawPageFooter(item.ctx, index, pages.length);
  });

  return pages.map((item) => item.canvas);
}

async function buildPdfBlob(report: ReportCard): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const pages = buildPdfCanvases(report);
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
    compress: true
  });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  pages.forEach((canvas, index) => {
    if (index > 0) {
      pdf.addPage();
    }

    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, pageWidth, pageHeight, undefined, "FAST");
  });

  return pdf.output("blob");
}

export function ReportsScreen({ activeRole, reports, highlightReportId }: ReportsScreenProps) {
  const theme = useTheme();
  const layout = useResponsiveLayout();
  const [sheetState, setSheetState] = useState<ReportsSheetState>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeExport, setActiveExport] = useState<ExportFormat | null>(null);

  const sortedReports = useMemo(() => {
    if (highlightReportId) {
      const highlighted = reports.find((r) => r.id === highlightReportId);
      if (highlighted) {
        return [highlighted, ...reports.filter((r) => r.id !== highlightReportId)];
      }
    }
    return reports;
  }, [highlightReportId, reports]);

  const reportWidth = layout.isDesktop ? "56%" : "100%";
  const content = roleContent[activeRole];

  function openInfoSheet() {
    setSheetState({
      kind: "info",
      title: "Как работает вкладка отчетов",
      lines: [...content.infoLines]
    });
  }

  function openPreview(report: ReportCard) {
    setSuccessMessage(null);
    setSheetState({ kind: "preview", report });
  }

  async function openExport(report: ReportCard, format: ExportFormat) {
    if (Platform.OS === "web" && typeof document !== "undefined" && typeof window !== "undefined") {
      try {
        setActiveExport(format);
        setSuccessMessage(format === "pdf" ? "Формируем PDF..." : "Формируем CSV...");

        if (format === "csv") {
          const blob = new Blob([`\uFEFF${buildCsv(report)}`], {
            type: "text/csv;charset=utf-8"
          });
          downloadBlob(buildSafeFilename(report, "csv"), blob);
          setSuccessMessage(`CSV для отчета "${report.title}" скачивается.`);
          return;
        }

        if (format === "pdf") {
          const blob = await buildPdfBlob(report);
          downloadBlob(buildSafeFilename(report, "pdf"), blob);
          setSuccessMessage(`PDF для отчета "${report.title}" скачивается.`);
          return;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Неизвестная ошибка при генерации файла.";
        setSuccessMessage(null);
        setSheetState({
          kind: "export",
          title: `Не удалось подготовить ${format.toUpperCase()}`,
          lines: [`Отчет: ${report.title}`, message]
        });
        return;
      } finally {
        setActiveExport(null);
      }
    }

    setSheetState({
      kind: "export",
      title: `${format.toUpperCase()} подготовлен для MVP`,
      lines: [
        `Отчет: ${report.title}`,
        `Формат: ${format.toUpperCase()}`,
        "На web файл создается по кнопке автоматически.",
        "На других платформах пока доступен только предпросмотр."
      ]
    });
  }

  return (
    <>
      {successMessage ? (
        <AppCard>
          <Text style={[styles.successText, { color: theme.semantic.success }]}>{successMessage}</Text>
        </AppCard>
      ) : null}

      {sortedReports.length === 0 ? (
        <EmptyState
          title={content.emptyTitle}
          description={content.emptyDescription}
          actionLabel="Как это работает"
          onAction={openInfoSheet}
        />
      ) : (
        <View style={[styles.reportsGrid, layout.isDesktop && styles.reportsGridDesktop]}>
          {sortedReports.map((report, index) => (
            <View key={report.id} style={{ width: reportWidth }}>
              <AppCard tone="mint">
                <View style={styles.rowBetween}>
                  <View style={styles.flexBlock}>
                    <Text style={[styles.title, { color: theme.semantic.textPrimary }]}>{report.title}</Text>
                    <Text
                      style={[styles.body, { color: theme.semantic.textSecondary }]}
                      numberOfLines={3}
                    >
                      {report.summary}
                    </Text>
                    <Text style={[styles.meta, { color: theme.semantic.textMuted }]}>
                      {report.ownerLabel} · {report.updatedAt}
                    </Text>
                  </View>
                  {index === 0 ? <StatusPill label="Последний" tone="success" /> : null}
                </View>

                <View style={styles.buttonRow}>
                  <AppButton label="Предпросмотр" onPress={() => openPreview(report)} tone="primary" />
                  <AppButton
                    label={activeExport === "pdf" ? "PDF..." : "PDF"}
                    onPress={() => {
                      void openExport(report, "pdf");
                    }}
                    tone="secondary"
                    disabled={activeExport !== null}
                  />
                  <AppButton
                    label={activeExport === "csv" ? "CSV..." : "CSV"}
                    onPress={() => {
                      void openExport(report, "csv");
                    }}
                    tone="ghost"
                    disabled={activeExport !== null}
                  />
                </View>
              </AppCard>
            </View>
          ))}
        </View>
      )}

      <AppCard tone="mint">
        <Text style={[styles.title, { color: theme.semantic.textPrimary }]}>Локальное хранение</Text>
        <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>
          Все отчеты сохраняются локально на вашем устройстве. Хранится до 50 последних отчетов.
        </Text>
        <Text style={[styles.meta, { color: theme.semantic.textMuted }]}>
          Текущая роль: {roleLabels[activeRole]} · Отчетов: {sortedReports.length}
        </Text>
      </AppCard>

      <AppBottomSheet
        visible={sheetState !== null}
        title={
          sheetState?.kind === "preview"
            ? `Предпросмотр: ${sheetState.report.title}`
            : sheetState?.title ?? ""
        }
        description={
          sheetState?.kind === "preview"
            ? `Отчет для роли: ${roleLabels[activeRole]}.`
            : "Отчет сформирован по завершенному диалогу."
        }
        onClose={() => setSheetState(null)}
      >
        {sheetState?.kind === "preview" ? (
          <>
            {sheetState.report.previewSections.map((section) => (
              <View key={section.id} style={styles.blockRow}>
                <Text style={[styles.title, { color: theme.semantic.textPrimary }]}>{section.title}</Text>
                {section.lines.map((line) => (
                  <Text key={line} style={[styles.listItem, { color: theme.semantic.textPrimary }]}>
                    • {line}
                  </Text>
                ))}
              </View>
            ))}
          </>
        ) : null}

        {sheetState?.kind === "export" || sheetState?.kind === "info" ? (
          <>
            {sheetState.lines.map((line) => (
              <Text key={line} style={[styles.listItem, { color: theme.semantic.textPrimary }]}>
                • {line}
              </Text>
            ))}
          </>
        ) : null}
      </AppBottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12
  },
  flexBlock: {
    flex: 1,
    gap: 8
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800"
  },
  body: {
    fontSize: 15,
    lineHeight: 22
  },
  meta: {
    fontSize: 12,
    fontWeight: "600"
  },
  note: {
    fontSize: 14,
    lineHeight: 20
  },
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    alignItems: "center"
  },
  listItem: {
    fontSize: 14,
    lineHeight: 20
  },
  reportsGrid: {
    gap: 14
  },
  reportsGridDesktop: {
    flexDirection: "row",
    flexWrap: "wrap"
  },
  blockRow: {
    gap: 8
  },
  successText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700"
  }
});
