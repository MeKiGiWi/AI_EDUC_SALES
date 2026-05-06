import React, { useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

import { ReportStatusBadge } from "../../components/reports/ReportStatusBadge";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { EmptyState } from "../../components/ui/EmptyState";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import { downloadReportFile } from "../../services/reportExportService";
import { useTheme } from "../../theme/useTheme";
import type { ReportCard } from "../../types/academy";

interface ReportViewerScreenProps {
  report?: ReportCard;
  onBack: () => void;
}

export function ReportViewerScreen({ report, onBack }: ReportViewerScreenProps) {
  const theme = useTheme();
  const layout = useResponsiveLayout();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

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
    <View style={styles.screen}>
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
          <AppButton label="Назад к отчетам" onPress={onBack} tone="ghost" />
          <Text style={[styles.title, { color: theme.semantic.textPrimary }]}>{report.title}</Text>
          <View style={styles.metaRow}>
            <ReportStatusBadge status={report.status} />
            <Text style={[styles.meta, { color: theme.semantic.textMuted }]}>
              {report.scenarioTitle ?? "Сценарий"} · {report.updatedAt}
            </Text>
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
          <View style={!layout.isDesktop ? styles.actionButtonMobile : undefined}>
            <AppButton
              label="Скопировать"
              onPress={() => { void handleCopy(); }}
              tone="ghost"
              fullWidth={!layout.isDesktop}
            />
          </View>
        </View>
      </View>

      {statusMessage ? (
        <AppCard tone="mint">
          <Text style={[styles.statusText, { color: theme.semantic.success }]}>{statusMessage}</Text>
        </AppCard>
      ) : null}

      <View style={[styles.contentGrid, layout.isDesktop && styles.contentGridDesktop]}>
        <View style={styles.reportContent}>
          <AppCard style={styles.summaryCard}>
            <Text style={[styles.sectionTitle, { color: theme.semantic.textPrimary }]}>Краткое резюме</Text>
            <Text style={[styles.summary, { color: theme.semantic.textSecondary }]}>{report.summary}</Text>
          </AppCard>

          {report.previewSections.map((section) => (
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

        <AppCard tone="mint" style={[styles.metaPanel, !layout.isDesktop && styles.metaPanelMobile]}>
          <Text style={[styles.sectionTitle, { color: theme.semantic.textPrimary }]}>Информация</Text>
          <InfoRow label="Сценарий" value={report.scenarioTitle ?? "Не указан"} />
          <InfoRow label="Дата создания" value={report.createdAt ? formatDate(report.createdAt) : report.updatedAt} />
          <InfoRow label="Источник" value={report.sourceLabel ?? "Чат"} />
          <InfoRow label="Формат" value={report.format.toUpperCase()} />
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
    gap: 16
  },
  topBar: {
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap"
  },
  topBarMobile: {
    alignItems: "stretch"
  },
  titleBlock: {
    flex: 1,
    minWidth: 260,
    gap: 10
  },
  titleBlockMobile: {
    minWidth: 0
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "800"
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10
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
  contentGrid: {
    gap: 16
  },
  contentGridDesktop: {
    flexDirection: "row",
    alignItems: "flex-start"
  },
  reportContent: {
    flex: 1,
    minWidth: 0,
    gap: 14
  },
  summaryCard: {
    gap: 10
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
  metaPanel: {
    width: 320
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
