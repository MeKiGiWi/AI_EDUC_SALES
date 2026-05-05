import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../theme/useTheme";
import type { ExportFormat, ReportCard } from "../../types/academy";
import { AppButton } from "../ui/AppButton";
import { AppCard } from "../ui/AppCard";
import { ReportStatusBadge } from "./ReportStatusBadge";

interface ReportCardItemProps {
  report: ReportCard;
  downloadingFormat?: ExportFormat | null;
  onOpen: (reportId: string) => void;
  onDownload: (report: ReportCard, format: ExportFormat) => void;
}

export function ReportCardItem({
  report,
  downloadingFormat,
  onOpen,
  onDownload
}: ReportCardItemProps) {
  const theme = useTheme();
  const status = report.status ?? "ready";
  const isGenerating = status === "generating";

  return (
    <AppCard style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.titleBlock}>
          <Text style={[styles.title, { color: theme.semantic.textPrimary }]}>{report.title}</Text>
          <Text style={[styles.meta, { color: theme.semantic.textMuted }]}>
            {report.scenarioTitle ?? "Сценарий"} · {report.updatedAt}
          </Text>
        </View>
        <ReportStatusBadge status={status} />
      </View>

      <Text style={[styles.summary, { color: theme.semantic.textSecondary }]} numberOfLines={3}>
        {report.summary}
      </Text>

      {isGenerating ? (
        <View
          style={[
            styles.generating,
            {
              backgroundColor: theme.semantic.cardAccent,
              borderColor: theme.semantic.border
            }
          ]}
        >
          <ActivityIndicator size="small" color={theme.semantic.actionPrimary} />
          <Text style={[styles.generatingText, { color: theme.semantic.textSecondary }]}>
            Отчет формируется. Вы можете продолжить работу.
          </Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <AppButton label="Открыть" onPress={() => onOpen(report.id)} tone="primary" />
        {report.availableFormats.includes("pdf") ? (
          <AppButton
            label={downloadingFormat === "pdf" ? "PDF..." : "Скачать"}
            onPress={() => onDownload(report, "pdf")}
            tone="secondary"
            disabled={Boolean(downloadingFormat)}
          />
        ) : null}
        {report.availableFormats.includes("csv") ? (
          <AppButton
            label={downloadingFormat === "csv" ? "CSV..." : "CSV"}
            onPress={() => onDownload(report, "csv")}
            tone="secondary"
            disabled={Boolean(downloadingFormat)}
          />
        ) : null}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 230
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
    gap: 6
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800"
  },
  meta: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700"
  },
  summary: {
    fontSize: 15,
    lineHeight: 22
  },
  generating: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  generatingText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700"
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  }
});
