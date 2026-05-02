import React, { useMemo, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

import { AppBottomSheet } from "../../components/ui/AppBottomSheet";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { EmptyState } from "../../components/ui/EmptyState";
import { StatusPill } from "../../components/ui/StatusPill";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import { roleLabels } from "../../navigation/routes";
import { useTheme } from "../../theme/useTheme";
import type { ExportFormat, ReportCard, UserRole } from "../../types/academy";
import { openExport as serviceOpenExport } from "../../services/reportExportService";

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
    try {
      setActiveExport(format);
      setSuccessMessage(format === "pdf" ? "Формируем PDF..." : "Формируем CSV...");
      await serviceOpenExport(report, format);
      setSuccessMessage(`${format.toUpperCase()} для отчета "${report.title}" подготовлен.`);
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
