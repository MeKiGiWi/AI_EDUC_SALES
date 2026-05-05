import React, { useEffect } from "react";

import { themeTokens } from "../../../theme/tokens";
import { ensureReportPrintStyles } from "../reportPrintStyles";
import type { DialogueTurnAnalysis, SalesDialogueReportV2 } from "../types";

interface ReportPdfDocumentProps {
  report: SalesDialogueReportV2;
}

const colors = themeTokens.colors;

const pageStyle: React.CSSProperties = {
  width: "210mm",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "22px 0 48px",
  color: colors.ink,
  fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
};

const cardStyle: React.CSSProperties = {
  background: "#FFFFFF",
  border: `1px solid ${colors.border}`,
  borderRadius: 24,
  padding: 28,
  boxShadow: "0 22px 60px rgba(26, 54, 37, 0.08)",
  marginBottom: 18
};

function sectionAccent() {
  return (
    <div
      style={{
        width: 56,
        height: 6,
        borderRadius: 999,
        background: colors.primary,
        marginBottom: 18
      }}
    />
  );
}

export function ReportHero({ report }: { report: SalesDialogueReportV2 }) {
  return (
    <section className="report-hero" style={{ ...cardStyle, padding: 34, background: "linear-gradient(180deg, #F8FEFB 0%, #FFFFFF 100%)" }}>
      <div style={{ fontSize: 12, letterSpacing: "0.18em", color: colors.muted, fontWeight: 700 }}>AI SALES ACADEMY</div>
      <h1 style={{ fontSize: 44, lineHeight: 1.02, margin: "14px 0 18px", color: colors.ink }}>
        {report.summary.title}
      </h1>
      <p style={{ fontSize: 18, lineHeight: 1.55, color: colors.body, margin: 0, maxWidth: 760 }}>{report.summary.headline}</p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 22 }}>
        {[report.participant?.displayName ?? "Ученик", formatDateLabel(report.case.createdAt), "Последний отчет"].map((item) => (
          <span key={item} style={{ padding: "10px 14px", background: item === "Последний отчет" ? colors.primary : "#FFFFFF", color: item === "Последний отчет" ? "#FFFFFF" : colors.ink, borderRadius: 999, border: `1px solid ${colors.border}`, fontSize: 14, fontWeight: 700 }}>
            {item}
          </span>
        ))}
      </div>
      <div style={{ marginTop: 10, fontSize: 14, color: colors.muted }}>Сформировано автоматически по завершенному диалогу.</div>
    </section>
  );
}

export function ReportSummaryCard({ report }: { report: SalesDialogueReportV2 }) {
  return (
    <section className="report-card" style={cardStyle}>
      {sectionAccent()}
      <h2 style={sectionTitleStyle}>Краткое резюме</h2>
      <ul style={listStyle}>
        {report.summary.shortResume.map((line) => (
          <li key={line} style={listItemStyle}>{line}</li>
        ))}
      </ul>
    </section>
  );
}

export function ReportCompetenciesCard({ report }: { report: SalesDialogueReportV2 }) {
  return (
    <section className="report-card" style={cardStyle}>
      {sectionAccent()}
      <h2 style={sectionTitleStyle}>Компетенции</h2>
      <div style={{ display: "grid", gap: 14 }}>
        {report.competencies.map((item) => (
          <div key={item.id} style={{ padding: "16px 18px", borderRadius: 18, background: "#F9FCFA", border: `1px solid ${colors.borderSoft}` }}>
            <div style={{ fontSize: 17, lineHeight: 1.45, fontWeight: 700 }}>
              {item.title}: {item.level}
              {typeof item.score === "number" ? ` · ${item.score}%` : ""}
            </div>
            <div style={{ marginTop: 8, fontSize: 15, lineHeight: 1.55, color: colors.body }}>{item.comment}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function DialoguePhraseCard({ turn }: { turn: DialogueTurnAnalysis }) {
  const accentByStatus: Record<string, { bg: string; label: string }> = {
    good: { bg: "#E7F8EF", label: "Сильная фраза" },
    neutral: { bg: "#F4F7F6", label: "Контекст" },
    needs_improvement: { bg: "#FFE5EC", label: "Дополнительный совет" },
    critical: { bg: "#FCE8DE", label: "Критичный момент" }
  };
  const accent = accentByStatus[turn.analysis.status];
  const isClient = turn.speaker === "client";
  return (
    <article
      className="report-card"
      style={{
        ...cardStyle,
        marginBottom: 14,
        padding: isClient ? 18 : 22,
        background: isClient ? "#FCFEFD" : cardStyle.background
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 700, color: turn.speaker === "manager" ? colors.ink : colors.body }}>
        {turn.speakerLabel}{turn.timestamp ? ` · ${turn.timestamp}` : ""}
      </div>
      <div style={{ marginTop: 10, fontSize: isClient ? 15 : 17, lineHeight: 1.6, color: colors.ink }}>{turn.text}</div>
      <div style={{ marginTop: 14, fontSize: 15, lineHeight: 1.55, color: colors.body }}>
        <strong style={{ color: colors.ink }}>Анализ:</strong> {turn.analysis.comment}
      </div>
      {turn.analysis.recommendation ? (
        <div style={{ marginTop: 14, padding: "14px 16px", borderRadius: 16, background: accent.bg, fontSize: 14, lineHeight: 1.5, color: colors.ink }}>
          <strong>{accent.label}:</strong> {turn.analysis.recommendation}
        </div>
      ) : null}
    </article>
  );
}

export function DialogueAnalysisSection({ report }: { report: SalesDialogueReportV2 }) {
  return (
    <section className="report-page-break" style={{ marginTop: 8 }}>
      <div style={cardStyle}>
        {sectionAccent()}
        <h2 style={sectionTitleStyle}>Анализ диалога по фразам</h2>
      </div>
      {report.dialogueAnalysis.map((turn) => (
        <DialoguePhraseCard key={`${turn.turnIndex}-${turn.text}`} turn={turn} />
      ))}
    </section>
  );
}

export function StrengthsSection({ report }: { report: SalesDialogueReportV2 }) {
  return (
    <section className="report-card" style={cardStyle}>
      {sectionAccent()}
      <h2 style={sectionTitleStyle}>Сильные стороны</h2>
      {report.strengths.length === 0 ? <p style={paragraphStyle}>Явные сильные стороны не были выделены автоматически.</p> : null}
      {report.strengths.map((item) => (
        <div key={item.title} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{item.title}</div>
          <p style={paragraphStyle}>{item.comment}</p>
          {item.evidence.length > 0 ? <ul style={listStyle}>{item.evidence.map((line) => <li key={line} style={listItemStyle}>{line}</li>)}</ul> : null}
        </div>
      ))}
    </section>
  );
}

export function DevelopmentAreasSection({ report }: { report: SalesDialogueReportV2 }) {
  return (
    <section className="report-card" style={cardStyle}>
      {sectionAccent()}
      <h2 style={sectionTitleStyle}>Зоны развития</h2>
      {report.developmentAreas.map((item) => (
        <div key={item.title} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{item.title}</div>
          <p style={paragraphStyle}>{item.comment}</p>
          {item.actions.length > 0 ? <ul style={listStyle}>{item.actions.map((line) => <li key={line} style={listItemStyle}>{line}</li>)}</ul> : null}
        </div>
      ))}
    </section>
  );
}

export function ReportFooter({ report }: { report: SalesDialogueReportV2 }) {
  return (
    <footer style={{ ...cardStyle, marginBottom: 0 }}>
      {sectionAccent()}
      <h2 style={sectionTitleStyle}>Рекомендуемые следующие шаги</h2>
      {report.nextSteps?.length ? <ul style={listStyle}>{report.nextSteps.map((line) => <li key={line} style={listItemStyle}>{line}</li>)}</ul> : <p style={paragraphStyle}>Рекомендации будут расширены после следующего полного анализа.</p>}
      {report.meta.fallback ? (
        <div style={{ marginTop: 16, padding: "14px 16px", borderRadius: 16, background: "#FFF5E8", color: colors.ink }}>
          Отчет сформирован в ограниченном режиме. Некоторые рекомендации могут быть неполными.
        </div>
      ) : null}
      <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${colors.borderSoft}`, fontSize: 13, color: colors.muted }}>
        {report.meta.generatedBy} · {report.meta.source} · {report.meta.language.toUpperCase()}
      </div>
    </footer>
  );
}

export function ReportPdfDocument({ report }: ReportPdfDocumentProps) {
  useEffect(() => {
    ensureReportPrintStyles();
  }, []);

  return (
    <div id="report-print-root" style={pageStyle}>
      <ReportHero report={report} />
      <ReportSummaryCard report={report} />
      <ReportCompetenciesCard report={report} />
      <DialogueAnalysisSection report={report} />
      <StrengthsSection report={report} />
      <DevelopmentAreasSection report={report} />
      <ReportFooter report={report} />
    </div>
  );
}

function formatDateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 26,
  lineHeight: 1.15,
  margin: 0
};

const paragraphStyle: React.CSSProperties = {
  fontSize: 15,
  lineHeight: 1.6,
  color: colors.body,
  margin: "8px 0 0"
};

const listStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: 22,
  display: "grid",
  gap: 10
};

const listItemStyle: React.CSSProperties = {
  fontSize: 15,
  lineHeight: 1.6,
  color: colors.ink
};
