export const reportPrintStyleId = "sales-dialogue-report-print-styles";

export const reportPrintCss = `
  @page { size: A4; margin: 14mm; }
  @media print {
    body {
      background: #f3fbf7 !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    [data-app-chrome="true"],
    [data-report-action="true"] {
      display: none !important;
    }
    #report-print-root {
      width: auto !important;
      margin: 0 !important;
      padding: 0 !important;
      background: transparent !important;
      box-shadow: none !important;
    }
    .report-page-break {
      break-before: page;
      page-break-before: always;
    }
    .report-card,
    .report-hero {
      break-inside: avoid;
      page-break-inside: avoid;
    }
  }
`;

export function ensureReportPrintStyles(): void {
  if (typeof document === "undefined") {
    return;
  }
  if (document.getElementById(reportPrintStyleId)) {
    return;
  }
  const style = document.createElement("style");
  style.id = reportPrintStyleId;
  style.textContent = reportPrintCss;
  document.head.appendChild(style);
}
