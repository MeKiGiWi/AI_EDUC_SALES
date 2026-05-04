import React, { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ReportCardItem } from "../../components/reports/ReportCardItem";
import { AppBottomSheet } from "../../components/ui/AppBottomSheet";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { EmptyState } from "../../components/ui/EmptyState";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import { roleLabels } from "../../navigation/routes";
import { downloadReportFile } from "../../services/reportExportService";
import { useTheme } from "../../theme/useTheme";
import type { ExportFormat, ReportCard, ReportStatus, UserRole } from "../../types/academy";

interface ReportsScreenProps {
  activeRole: UserRole;
  reports: ReportCard[];
  highlightReportId?: string;
  onOpenReport: (reportId: string) => void;
  onContinueChat: (scenarioId?: string) => void;
}

type ReportsSheetState =
  | { kind: "export"; title: string; lines: string[] }
  | { kind: "info"; title: string; lines: string[] }
  | null;

type ReportFilter = "all" | "ready" | "generating" | "error";

const reportFilters: Array<{ id: ReportFilter; label: string }> = [
  { id: "all", label: "Все" },
  { id: "ready", label: "Готовые" },
  { id: "generating", label: "В процессе" },
  { id: "error", label: "Ошибки" }
];

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
    emptyDescription: "Когда диалог будет завершен и сохранен, отчет появится здесь.",
    infoLines: [
      "Все отчеты хранятся локально на устройстве.",
      "Выгрузки строятся прямо из сохраненных отчетов."
    ]
  },
  admin: {
    emptyTitle: "Отчеты пока не зафиксированы",
    emptyDescription: "Пока ни один завершенный диалог не сохранил отчет.",
    infoLines: [
      "Все отчеты хранятся локально на устройстве.",
      "PDF и CSV формируются по запросу."
    ]
  }
} as const;

function getReportStatus(report: ReportCard): ReportStatus {
  return report.status;
}

export function ReportsScreen({
  activeRole,
  reports,
  highlightReportId,
  onOpenReport,
  onContinueChat
}: ReportsScreenProps) {
  const theme = useTheme();
  const layout = useResponsiveLayout();
  const [sheetState, setSheetState] = useState<ReportsSheetState>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeExport, setActiveExport] = useState<ExportFormat | null>(null);
  const [activeFilter, setActiveFilter] = useState<ReportFilter>("all");

  const sortedReports = useMemo(() => {
    if (highlightReportId) {
      const highlighted = reports.find((report) => report.id === highlightReportId);
      if (highlighted) {
        return [highlighted, ...reports.filter((report) => report.id !== highlightReportId)];
      }
    }
    return reports;
  }, [highlightReportId, reports]);

  const filteredReports = useMemo(() => {
    return sortedReports.filter((report) => {
      const status = getReportStatus(report);
      if (activeFilter === "all") {
        return true;
      }
      if (activeFilter === "generating") {
        return status === "generating" || status === "draft";
      }
      return status === activeFilter;
    });
  }, [activeFilter, sortedReports]);

  const reportWidth = layout.isWide ? "31.8%" : layout.isDesktop || layout.isTablet ? "48.4%" : "100%";
  const content = roleContent[activeRole];
  const generatingReport = sortedReports.find((report) => getReportStatus(report) === "generating");

  function openInfoSheet() {
    setSheetState({
      kind: "info",
      title: "Как работает вкладка отчетов",
      lines: [...content.infoLines]
    });
  }

  async function handleExport(report: ReportCard, format: ExportFormat) {
    try {
      setActiveExport(format);
      setSuccessMessage(format === "pdf" ? "Формируем PDF..." : "Формируем CSV...");
      const message = await downloadReportFile(report, format);
      setSuccessMessage(message);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Неизвестная ошибка при генерации файла.";
      setSuccessMessage(null);
      setSheetState({
        kind: "export",
        title: `Не удалось подготовить ${format.toUpperCase()}`,
        lines: [`Отчет: ${report.title}`, message]
      });
    } finally {
      setActiveExport(null);
    }
  }

  return (
    <>
      <View style={styles.pageHeader}>
        <View style={styles.headerText}>
          <Text style={[styles.pageTitle, { color: theme.semantic.textPrimary }]}>Отчеты</Text>
          <Text style={[styles.pageSubtitle, { color: theme.semantic.textSecondary }]}>
            Здесь сохраняются результаты ваших сценариев.
          </Text>
        </View>
      </View>

      {successMessage ? (
        <AppCard>
          <Text style={[styles.successText, { color: theme.semantic.success }]}>{successMessage}</Text>
        </AppCard>
      ) : null}

      {generatingReport ? (
        <AppCard tone="mint">
          <Text style={[styles.title, { color: theme.semantic.textPrimary }]}>Отчет формируется</Text>
          <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>
            Отчет формируется. Вы можете продолжить работу, он появится здесь после завершения.
          </Text>
        </AppCard>
      ) : null}

      <View style={styles.filterRow}>
        {reportFilters.map((filter) => (
          <AppButton
            key={filter.id}
            label={filter.label}
            onPress={() => setActiveFilter(filter.id)}
            tone={activeFilter === filter.id ? "primary" : "ghost"}
          />
        ))}
      </View>

      {sortedReports.length === 0 ? (
        <EmptyState
          title="Пока нет отчетов"
          description="Сформируйте первый отчет из чата."
          actionLabel="Перейти в чат"
          onAction={() => onContinueChat(undefined)}
        />
      ) : filteredReports.length === 0 ? (
        <EmptyState
          title="В этом фильтре пусто"
          description="Попробуйте другой статус или сформируйте новый отчет из чата."
          actionLabel="Все отчеты"
          onAction={() => setActiveFilter("all")}
        />
      ) : (
        <View style={[styles.reportsGrid, layout.isDesktop && styles.reportsGridDesktop]}>
          {filteredReports.map((report) => (
            <View key={report.id} style={{ width: reportWidth }}>
              <ReportCardItem
                report={report}
                downloadingFormat={activeExport}
                onOpen={onOpenReport}
                onDownload={(item, format) => {
                  void handleExport(item, format);
                }}
                onContinueChat={(item) => onContinueChat(item.scenarioId ?? undefined)}
              />
            </View>
          ))}
        </View>
      )}

      <AppCard tone="mint">
        <View style={styles.rowBetween}>
          <View style={styles.flexBlock}>
            <Text style={[styles.title, { color: theme.semantic.textPrimary }]}>Локальное хранение</Text>
            <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>
              Все отчеты сохраняются локально на вашем устройстве. Хранится до 50 последних отчетов.
            </Text>
            <Text style={[styles.meta, { color: theme.semantic.textMuted }]}>
              Текущая роль: {roleLabels[activeRole]} · Отчетов: {sortedReports.length}
            </Text>
          </View>
          <AppButton label="Как это работает" onPress={openInfoSheet} tone="ghost" />
        </View>
      </AppCard>

      <AppBottomSheet
        visible={sheetState !== null}
        title={sheetState?.title ?? ""}
        description="Отчет сформирован по завершенному диалогу."
        onClose={() => setSheetState(null)}
      >
        {sheetState ? (
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
  pageHeader: {
    gap: 8
  },
  headerText: {
    gap: 6
  },
  pageTitle: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "800"
  },
  pageSubtitle: {
    fontSize: 16,
    lineHeight: 24
  },
  successText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "800"
  },
  title: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "800"
  },
  body: {
    fontSize: 15,
    lineHeight: 22
  },
  meta: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700"
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  reportsGrid: {
    gap: 14
  },
  reportsGridDesktop: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "stretch"
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap"
  },
  flexBlock: {
    flex: 1,
    minWidth: 240,
    gap: 6
  },
  listItem: {
    fontSize: 15,
    lineHeight: 22
  }
});
