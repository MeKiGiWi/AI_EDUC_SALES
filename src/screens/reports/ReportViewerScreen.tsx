import React, { useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";

import { ReportStatusBadge } from "../../components/reports/ReportStatusBadge";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { EmptyState } from "../../components/ui/EmptyState";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import { downloadReportFile } from "../../services/reportExportService";
import {
  getDevelopmentCompetencies,
  getStrengthCompetencies
} from "../../services/reportFlowCore";
import { useTheme } from "../../theme/useTheme";
import type { ReportCard } from "../../types/academy";

type CompetencyLevel = "Junior" | "Middle" | "Senior";

const levelBadgeColors: Record<CompetencyLevel, { background: string; text: string }> = {
  Junior: { background: "#FDF0D3", text: "#9A6A12" },
  Middle: { background: "#DBE6F7", text: "#121A68" },
  Senior: { background: "#E4F7D6", text: "#3F7A18" }
};

function LevelBadge({ level, compact = false }: { level: CompetencyLevel; compact?: boolean }) {
  const colors = levelBadgeColors[level];
  return (
    <View style={[styles.levelBadge, compact && styles.levelBadgeCompact, { backgroundColor: colors.background }]}>
      <Text style={[styles.levelBadgeText, compact && styles.levelBadgeTextCompact, { color: colors.text }]}>
        {level}
      </Text>
    </View>
  );
}

interface ReportViewerScreenProps {
  report?: ReportCard;
  onBack: () => void;
}

export function ReportViewerScreen({ report, onBack }: ReportViewerScreenProps) {
  const theme = useTheme();
  const layout = useResponsiveLayout();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const screenHeight = Math.max(
    theme.viewport.height - theme.spacing.screenTop - theme.spacing.screenBottom - 8,
    layout.isDesktop ? 560 : 480
  );

  if (!report) {
    return (
      <EmptyState
        title="Отчет не найден"
        description="Возможно, отчет был удален или еще не сформирован."
        actionLabel="Назад к отчетам"
        onAction={onBack}
      />
    );
  }

  async function handleCopy() {
    if (!report) {
      return;
    }

    const content = buildReportPlainText(report);
    if (
      Platform.OS === "web" &&
      typeof navigator !== "undefined" &&
      navigator.clipboard?.writeText
    ) {
      await navigator.clipboard.writeText(content);
    }

    setStatusMessage("Отчет скопирован.");
  }

  const isGenerating = report?.status === "generating";
  const isError = report?.status === "error";
  const reportV2 = report?.reportV2;
  const evaluation = report?.evaluation;
  const strengthCompetencies = evaluation ? getStrengthCompetencies(evaluation) : [];
  const developmentCompetencies = evaluation ? getDevelopmentCompetencies(evaluation) : [];
  const quoteLines = evaluation
    ? Array.from(
        new Set(
          evaluation.competencies
            .flatMap((competency) => competency.quote)
            .map((quote) => quote.trim())
            .filter(Boolean)
        )
      ).slice(0, 5)
    : [];

  const reportBody = isGenerating ? (
    <View style={[styles.reportContent, !layout.isDesktop && styles.reportContentMobile]}>
      <AppCard style={styles.statusCard}>
        <Text style={[styles.statusTitle, { color: theme.semantic.textPrimary }]}>Отчёт формируется…</Text>
        <Text style={[styles.statusBody, { color: theme.semantic.textSecondary }]}>
          ИИ анализирует диалог и оценивает 5 компетенций. Это может занять до пары минут — можно остаться
          на странице или вернуться к отчёту позже. Готовый отчёт появится здесь автоматически.
        </Text>
      </AppCard>
    </View>
  ) : isError ? (
    <View style={[styles.reportContent, !layout.isDesktop && styles.reportContentMobile]}>
      <AppCard style={styles.statusCard}>
        <Text style={[styles.statusTitle, { color: theme.semantic.danger }]}>Отчёт не сформирован</Text>
        <Text style={[styles.statusBody, { color: theme.semantic.textSecondary }]}>{report?.summary}</Text>
      </AppCard>
    </View>
  ) : reportV2 ? (
    <View style={[styles.reportContent, !layout.isDesktop && styles.reportContentMobile]}>
      <AppCard style={styles.summaryCard}>
        <View style={styles.levelHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.semantic.textPrimary }]}>Итог по диалогу</Text>
          <LevelBadge level={reportV2.summary.overallLevel === "Trainee" ? "Junior" : reportV2.summary.overallLevel} />
        </View>
        <Text style={[styles.summary, { color: theme.semantic.textSecondary }]}>
          {reportV2.summary.headline}
        </Text>
        <View style={styles.lines}>
          {reportV2.summary.shortResume.map((line) => (
            <Text key={line} style={[styles.line, { color: theme.semantic.textPrimary }]}>
              • {line}
            </Text>
          ))}
        </View>
      </AppCard>

      <AppCard style={styles.sectionCard}>
        <Text style={[styles.sectionTitle, { color: theme.semantic.textPrimary }]}>Компетенции</Text>
        <View style={styles.competencyTable}>
          {reportV2.competencies.map((competency) => (
            <View key={competency.id} style={[styles.competencyRow, { borderColor: theme.semantic.border }]}>
              <View style={styles.competencyHead}>
                <Text style={[styles.competencyName, { color: theme.semantic.textPrimary }]}>
                  {competency.title}
                </Text>
                <LevelBadge level={competency.level === "Trainee" ? "Junior" : competency.level} compact />
              </View>
              <Text style={[styles.competencyArgument, { color: theme.semantic.textSecondary }]}>
                {competency.comment}
              </Text>
            </View>
          ))}
        </View>
      </AppCard>

      <AppCard style={styles.sectionCard}>
        <Text style={[styles.sectionTitle, { color: theme.semantic.textPrimary }]}>Сильные стороны</Text>
        <View style={styles.lines}>
          {reportV2.strengths.map((item) => (
            <Text key={item.title} style={[styles.line, { color: theme.semantic.textPrimary }]}>
              • {item.title}: {item.comment}
            </Text>
          ))}
        </View>
      </AppCard>

      <AppCard style={styles.sectionCard}>
        <Text style={[styles.sectionTitle, { color: theme.semantic.textPrimary }]}>Зоны развития</Text>
        <View style={styles.lines}>
          {reportV2.developmentAreas.map((item) => (
            <View key={item.title} style={styles.focusBlock}>
              <Text style={[styles.focusHeader, { color: theme.semantic.textPrimary }]}>
                {item.title}
              </Text>
              <Text style={[styles.line, { color: theme.semantic.textPrimary }]}>{item.comment}</Text>
              {item.actions.map((action) => (
                <Text key={action} style={[styles.line, { color: theme.semantic.textPrimary }]}>
                  — {action}
                </Text>
              ))}
            </View>
          ))}
        </View>
      </AppCard>

      <AppCard style={styles.sectionCard}>
        <Text style={[styles.sectionTitle, { color: theme.semantic.textPrimary }]}>Следующие шаги</Text>
        <View style={styles.lines}>
          {reportV2.nextSteps.map((step) => (
            <Text key={step} style={[styles.line, { color: theme.semantic.textPrimary }]}>
              • {step}
            </Text>
          ))}
        </View>
      </AppCard>

      <AppCard style={styles.sectionCard}>
        <Text style={[styles.sectionTitle, { color: theme.semantic.textPrimary }]}>Анализ диалога</Text>
        <View style={styles.lines}>
          {reportV2.dialogueAnalysis.map((turn) => (
            <View key={`${turn.turnIndex}-${turn.speaker}`} style={styles.focusBlock}>
              <Text style={[styles.focusHeader, { color: theme.semantic.textPrimary }]}>
                {turn.turnIndex}. {turn.speakerLabel}
              </Text>
              <Text style={[styles.quoteLine, { color: theme.semantic.textSecondary }]}>{turn.text}</Text>
              <Text style={[styles.line, { color: theme.semantic.textPrimary }]}>{turn.analysis.comment}</Text>
              {turn.analysis.recommendation ? (
                <Text style={[styles.line, { color: theme.semantic.textPrimary }]}>
                  — {turn.analysis.recommendation}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      </AppCard>
    </View>
  ) : evaluation ? (
    <View style={[styles.reportContent, !layout.isDesktop && styles.reportContentMobile]}>
      <AppCard style={styles.summaryCard}>
        <View style={styles.levelHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.semantic.textPrimary }]}>Общий уровень</Text>
          <LevelBadge level={evaluation.overall_level} />
        </View>
        <Text style={[styles.summary, { color: theme.semantic.textSecondary }]}>
          {evaluation.overall_comment}
        </Text>
      </AppCard>

      <AppCard style={styles.sectionCard}>
        <Text style={[styles.sectionTitle, { color: theme.semantic.textPrimary }]}>Компетенции</Text>
        <View style={styles.competencyTable}>
          {evaluation.competencies.map((competency) => (
            <View key={competency.name} style={[styles.competencyRow, { borderColor: theme.semantic.border }]}>
              <View style={styles.competencyHead}>
                <Text style={[styles.competencyName, { color: theme.semantic.textPrimary }]}>
                  {competency.name}
                </Text>
                <LevelBadge level={competency.level} compact />
              </View>
              <Text style={[styles.competencyArgument, { color: theme.semantic.textSecondary }]}>
                {competency.argument}
              </Text>
            </View>
          ))}
        </View>
      </AppCard>

      {strengthCompetencies.length > 0 ? (
        <AppCard style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: theme.semantic.textPrimary }]}>Сильные стороны</Text>
          <View style={styles.lines}>
            {strengthCompetencies.map((competency) => (
              <Text key={competency.name} style={[styles.line, { color: theme.semantic.textPrimary }]}>
                • {competency.name}: {competency.argument}
              </Text>
            ))}
          </View>
        </AppCard>
      ) : null}

      <AppCard style={styles.sectionCard}>
        <Text style={[styles.sectionTitle, { color: theme.semantic.textPrimary }]}>Зоны развития</Text>
        <View style={styles.lines}>
          {developmentCompetencies.length > 0 ? (
            developmentCompetencies.map((competency) => (
              <Text key={competency.name} style={[styles.line, { color: theme.semantic.textPrimary }]}>
                • {competency.name}: {competency.argument}
              </Text>
            ))
          ) : (
            <Text style={[styles.line, { color: theme.semantic.textPrimary }]}>
              Явных зон ниже общего уровня нет — держите текущую планку.
            </Text>
          )}
        </View>
      </AppCard>

      <AppCard style={styles.sectionCard}>
        <Text style={[styles.sectionTitle, { color: theme.semantic.textPrimary }]}>Рекомендации по развитию</Text>
        <View style={styles.lines}>
          {developmentCompetencies.length > 0
            ? developmentCompetencies.map((competency, index) => (
                <View key={competency.name} style={styles.focusBlock}>
                  <Text style={[styles.focusHeader, { color: theme.semantic.textPrimary }]}>
                    Фокус {index + 1}. {competency.name} (сейчас {competency.level}, общий — {evaluation.overall_level})
                  </Text>
                  {competency.recommendations.map((recommendation) => (
                    <Text key={recommendation} style={[styles.line, { color: theme.semantic.textPrimary }]}>
                      — {recommendation}
                    </Text>
                  ))}
                </View>
              ))
            : evaluation.overall_recommendations.map((recommendation) => (
                <Text key={recommendation} style={[styles.line, { color: theme.semantic.textPrimary }]}>
                  • {recommendation}
                </Text>
              ))}
        </View>
      </AppCard>

      {quoteLines.length > 0 ? (
        <AppCard style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: theme.semantic.textPrimary }]}>Цитаты из диалога</Text>
          <View style={styles.lines}>
            {quoteLines.map((quote, index) => (
              <Text key={`${quote}-${index}`} style={[styles.quoteLine, { color: theme.semantic.textSecondary }]}>
                «{quote}»
              </Text>
            ))}
          </View>
        </AppCard>
      ) : null}
    </View>
  ) : (
    <View style={[styles.reportContent, !layout.isDesktop && styles.reportContentMobile]}>
      <AppCard style={styles.summaryCard}>
        <Text style={[styles.sectionTitle, { color: theme.semantic.textPrimary }]}>Итог диалога</Text>
        <Text style={[styles.summary, { color: theme.semantic.textSecondary }]}>{report?.summary}</Text>
      </AppCard>

      {report?.previewSections.map((section) => (
        <AppCard key={section.id} style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: theme.semantic.textPrimary }]}>{section.title}</Text>
          <View style={styles.lines}>
            {section.lines.map((line) => (
              <Text key={line} style={[styles.line, { color: theme.semantic.textPrimary }]}>
                • {line}
              </Text>
            ))}
          </View>
        </AppCard>
      ))}
    </View>
  );

  async function handleExport(format: "pdf" | "csv") {
    if (!report) {
      return;
    }

    try {
      const message = await downloadReportFile(report, format);
      setStatusMessage(message);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Не удалось скачать отчет.");
    }
  }

  return (
    <View style={[styles.screen, layout.isDesktop && { height: screenHeight }]}>
      <View
        style={[
          styles.topBar,
          !layout.isDesktop && styles.topBarMobile,
          {
            backgroundColor: theme.semantic.card,
            borderColor: theme.semantic.border,
            borderRadius: theme.radius.xl
          }
        ]}
      >
        <View style={[styles.titleBlock, !layout.isDesktop && styles.titleBlockMobile]}>
          <View style={[styles.titleRow, !layout.isDesktop && styles.titleRowMobile]}>
            <View style={styles.titleTextBlock}>
              <View style={styles.titleInline}>
                <Text style={[styles.title, { color: theme.semantic.textPrimary }]}>{report.title}</Text>
                <ReportStatusBadge status={report.status} />
              </View>
            </View>
            <View style={[styles.actionRow, !layout.isDesktop && styles.actionRowMobile]}>
              {report.availableFormats.includes("pdf") ? (
                <View style={!layout.isDesktop ? styles.actionButtonMobile : undefined}>
                  <AppButton
                    label="Скачать PDF"
                    onPress={() => { void handleExport("pdf"); }}
                    tone="secondary"
                    fullWidth={!layout.isDesktop}
                  />
                </View>
              ) : null}
              {report.availableFormats.includes("csv") ? (
                <View style={!layout.isDesktop ? styles.actionButtonMobile : undefined}>
                  <AppButton
                    label="Скачать CSV"
                    onPress={() => { void handleExport("csv"); }}
                    tone="secondary"
                    fullWidth={!layout.isDesktop}
                  />
                </View>
              ) : null}
              {!isGenerating && !isError ? (
                <View style={!layout.isDesktop ? styles.actionButtonMobile : undefined}>
                  <AppButton
                    label="Скопировать"
                    onPress={() => { void handleCopy(); }}
                    tone="ghost"
                    fullWidth={!layout.isDesktop}
                  />
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </View>

      {statusMessage ? (
        <AppCard tone="mint">
          <Text style={[styles.statusText, { color: theme.semantic.success }]}>{statusMessage}</Text>
        </AppCard>
      ) : null}

      <View style={[styles.reportShell, layout.isDesktop ? styles.reportShellDesktop : styles.reportShellMobile]}>
        {layout.isDesktop ? (
          <ScrollView
            style={styles.reportScroll}
            contentContainerStyle={styles.reportScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {reportBody}
          </ScrollView>
        ) : (
          reportBody
        )}

        <AppCard tone="mint" style={[styles.metaPanel, !layout.isDesktop && styles.metaPanelMobile]}>
          <Text style={[styles.sectionTitle, { color: theme.semantic.textPrimary }]}>Информация</Text>
          <InfoRow label="Сценарий" value={report.scenarioTitle ?? "Не указан"} />
          <InfoRow label="Дата создания" value={formatDate(report.createdAt || report.updatedAt)} />
          <InfoRow label="Источник" value={report.sourceLabel ?? "Чат"} />
        </AppCard>
      </View>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();

  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: theme.semantic.textMuted }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: theme.semantic.textPrimary }]}>{value}</Text>
    </View>
  );
}

function buildReportPlainText(report: ReportCard): string {
  if (report.reportV2) {
    return [
      report.title,
      report.reportV2.summary.headline,
      "",
      "Компетенции",
      ...report.reportV2.competencies.map((item) => `- ${item.title}: ${item.comment}`),
      "",
      "Следующие шаги",
      ...report.reportV2.nextSteps.map((item) => `- ${item}`)
    ].join("\n");
  }
  const sections = report.previewSections
    .map((section) => `${section.title}\n${section.lines.map((line) => `- ${line}`).join("\n")}`)
    .join("\n\n");

  return `${report.title}\n${report.summary}\n\n${sections}`;
}

function formatDate(value: string): string {
  if (/^\d{2}\.\d{2}\s+\d{2}:\d{2}$/.test(value.trim())) {
    return value;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

const styles = StyleSheet.create({
  screen: {
    gap: 16,
    minHeight: 0
  },
  topBar: {
    borderWidth: 1,
    padding: 14,
    gap: 12
  },
  topBarMobile: {
    alignItems: "stretch"
  },
  titleBlock: {
    gap: 10
  },
  titleBlockMobile: {
    minWidth: 0
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16
  },
  titleRowMobile: {
    alignItems: "stretch",
    flexDirection: "column"
  },
  titleTextBlock: {
    flex: 1,
    minWidth: 260
  },
  titleInline: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "800"
  },
  meta: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700"
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 10
  },
  actionRowMobile: {
    width: "100%",
    flexDirection: "column",
    justifyContent: "flex-start"
  },
  actionButtonMobile: {
    width: "100%"
  },
  statusText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "800"
  },
  reportShell: {
    flex: 1,
    minHeight: 0,
    gap: 16
  },
  reportShellDesktop: {
    flexDirection: "row",
    alignItems: "stretch"
  },
  reportShellMobile: {
    flex: 0,
    minHeight: 0
  },
  reportScroll: {
    flex: 1,
    minHeight: 0
  },
  reportScrollMobile: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: "auto",
    minHeight: 0
  },
  reportScrollContent: {
    paddingBottom: 2
  },
  reportContent: {
    flex: 1,
    minWidth: 0,
    gap: 14
  },
  reportContentMobile: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: "auto"
  },
  summaryCard: {
    gap: 10
  },
  statusCard: {
    gap: 12,
    paddingVertical: 28
  },
  statusTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "800"
  },
  statusBody: {
    fontSize: 15,
    lineHeight: 23
  },
  summary: {
    fontSize: 16,
    lineHeight: 25
  },
  sectionCard: {
    gap: 12
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800"
  },
  lines: {
    gap: 8
  },
  line: {
    fontSize: 15,
    lineHeight: 23
  },
  levelHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  levelBadge: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    alignSelf: "flex-start"
  },
  levelBadgeCompact: {
    paddingVertical: 3,
    paddingHorizontal: 10
  },
  levelBadgeText: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.3
  },
  levelBadgeTextCompact: {
    fontSize: 12
  },
  competencyTable: {
    gap: 0
  },
  competencyRow: {
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 6
  },
  competencyHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10
  },
  competencyName: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700"
  },
  competencyArgument: {
    fontSize: 14,
    lineHeight: 21
  },
  focusBlock: {
    gap: 6
  },
  focusHeader: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "800"
  },
  quoteLine: {
    fontSize: 15,
    lineHeight: 23,
    fontStyle: "italic"
  },
  metaPanel: {
    width: 320,
    gap: 14,
    alignSelf: "flex-start"
  },
  metaPanelMobile: {
    width: "100%"
  },
  infoRow: {
    gap: 3
  },
  infoLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  infoValue: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700"
  }
});
