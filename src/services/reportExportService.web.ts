import type { ExportFormat, ReportCard } from "../types/academy";
import { themeTokens } from "../theme/tokens";
import { reportApiService } from "./reportApiService";

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

export async function openExport(report: ReportCard, format: ExportFormat): Promise<void> {
  if (reportApiService.isEnabled() && (format === "pdf" || format === "csv")) {
    await reportApiService.openExport(report.id, format);
    return;
  }

  if (format === "csv") {
    const blob = new Blob([`\uFEFF${buildCsv(report)}`], {
      type: "text/csv;charset=utf-8"
    });
    downloadBlob(buildSafeFilename(report, "csv"), blob);
    return;
  }

  if (format === "pdf") {
    const blob = await buildPdfBlob(report);
    downloadBlob(buildSafeFilename(report, "pdf"), blob);
    return;
  }
}
