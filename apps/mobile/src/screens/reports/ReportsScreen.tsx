import React, { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { ReportCard, ScheduledReportRule } from "../../types/academy";
import { AppBottomSheet } from "../../components/ui/AppBottomSheet";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { EmptyState } from "../../components/ui/EmptyState";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { StatusPill } from "../../components/ui/StatusPill";
import { useTheme } from "../../theme/useTheme";

interface ReportsScreenProps {
  reports: ReportCard[];
  rules: ScheduledReportRule[];
  highlightReportId?: string;
}

type ReportsSheetState =
  | { kind: "preview"; report: ReportCard }
  | { kind: "export"; title: string; lines: string[] }
  | { kind: "schedule"; title: string; lines: string[] }
  | null;

export function ReportsScreen({ reports, rules, highlightReportId }: ReportsScreenProps) {
  const theme = useTheme();
  const [selectedReportId, setSelectedReportId] = useState(highlightReportId ?? reports[0]?.id ?? "");
  const [sheetState, setSheetState] = useState<ReportsSheetState>(null);
  const [sendLog, setSendLog] = useState<string[]>([]);
  const [scheduleMode, setScheduleMode] = useState<"weekly" | "monthly">("weekly");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedReport = useMemo(
    () => reports.find((item) => item.id === selectedReportId) ?? reports[0] ?? null,
    [reports, selectedReportId]
  );

  return (
    <>
      <SectionHeader
        eyebrow="Отчеты"
        title="Центр отчетов и выгрузок"
        description="Здесь собраны PDF-отчеты, статистика HR/L&D, динамика оценки, командные отчеты и scheduled rules по уровням доступа."
      />

      {successMessage ? (
        <AppCard>
          <Text style={[styles.successText, { color: theme.semantic.success }]}>{successMessage}</Text>
        </AppCard>
      ) : null}

      {reports.length === 0 ? (
        <EmptyState
          title="Отчеты пока не собраны"
          description="Когда появятся mock или real данные, здесь отобразятся карточки выгрузок."
          actionLabel="Открыть правила"
          onAction={() =>
            setSheetState({
              kind: "schedule",
              title: "Scheduled reports",
              lines: rules.map((rule) => `${rule.audience}: ${rule.frequencyLabel}`)
            })
          }
        />
      ) : (
        reports.map((report) => (
          <AppCard key={report.id} tone={report.id === selectedReportId ? "mint" : "default"}>
            <View style={styles.rowBetween}>
              <View style={styles.flexBlock}>
                <Text style={[styles.title, { color: theme.semantic.textPrimary }]}>{report.title}</Text>
                <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>{report.summary}</Text>
                <Text style={[styles.meta, { color: theme.semantic.textMuted }]}>
                  {report.ownerLabel} · {report.updatedAt}
                </Text>
              </View>
              <StatusPill label={report.format.toUpperCase()} tone="success" />
            </View>
            <Text style={[styles.meta, { color: theme.semantic.textMuted }]}>
              Доступные форматы: {report.availableFormats.map((item) => item.toUpperCase()).join(", ")}
            </Text>
            <View style={styles.buttonRow}>
              <AppButton label="Предпросмотр" onPress={() => setSheetState({ kind: "preview", report })} tone="primary" />
              <AppButton
                label="Скачать PDF"
                onPress={() =>
                  setSheetState({
                    kind: "export",
                    title: "PDF подготовлен",
                    lines: [
                      `Отчет: ${report.title}`,
                      "Формат: PDF",
                      "Статус: mock export подготовлен"
                    ]
                  })
                }
                tone="secondary"
              />
              <AppButton
                label="Скачать CSV"
                onPress={() =>
                  setSheetState({
                    kind: "export",
                    title: "CSV подготовлен",
                    lines: [
                      `Отчет: ${report.title}`,
                      "Формат: CSV",
                      "Файл в RN-окружении не сохраняем без доп. библиотек, поэтому показываем понятный success state."
                    ]
                  })
                }
                tone="ghost"
              />
            </View>
            <View style={styles.buttonRow}>
              <AppButton
                label="Отправить руководителю"
                onPress={() => {
                  setSendLog((current) => [...current, `${report.title} → руководителю`]);
                  setSuccessMessage(`Отчет "${report.title}" отправлен руководителю.`);
                }}
                tone="secondary"
              />
              <AppButton
                label="Отправить HR/L&D"
                onPress={() => {
                  setSendLog((current) => [...current, `${report.title} → HR/L&D`]);
                  setSuccessMessage(`Отчет "${report.title}" отправлен HR/L&D.`);
                }}
                tone="ghost"
              />
              <AppButton
                label="Настроить регулярность"
                onPress={() =>
                  setSheetState({
                    kind: "schedule",
                    title: "Настроить регулярность",
                    lines: [
                      `Текущий режим: ${scheduleMode === "weekly" ? "еженедельно" : "ежемесячно"}`,
                      "Следующее нажатие переключит local schedule mode."
                    ]
                  })
                }
                tone="ghost"
              />
            </View>
            <AppButton
              label="Выбрать отчет"
              onPress={() => setSelectedReportId(report.id)}
              tone="ghost"
            />
          </AppCard>
        ))
      )}

      {selectedReport ? (
        <AppCard>
          <Text style={[styles.title, { color: theme.semantic.textPrimary }]}>Выбранный отчет</Text>
          <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>
            {selectedReport.title} · основной формат {selectedReport.format.toUpperCase()}
          </Text>
          {sendLog.slice(-4).map((entry) => (
            <Text key={entry} style={[styles.listItem, { color: theme.semantic.textPrimary }]}>
              • {entry}
            </Text>
          ))}
          <Text style={[styles.title, { color: theme.semantic.textPrimary }]}>Scheduled reports</Text>
          {rules.map((rule) => (
            <Text key={rule.id} style={[styles.listItem, { color: theme.semantic.textSecondary }]}>
              • {rule.audience}: {rule.title} · {rule.frequencyLabel}
            </Text>
          ))}
        </AppCard>
      ) : null}

      <AppBottomSheet
        visible={sheetState !== null}
        title={
          sheetState?.kind === "preview"
            ? `Предпросмотр: ${sheetState.report.title}`
            : sheetState?.title ?? ""
        }
        description={
          sheetState?.kind === "preview"
            ? "Mock content preview отчета для mobile центра отчетов."
            : sheetState?.kind === "schedule"
              ? "Local form поведения scheduled reports."
              : "Mock export state для mobile MVP."
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

        {sheetState?.kind === "export" ? (
          <>
            {sheetState.lines.map((line) => (
              <Text key={line} style={[styles.listItem, { color: theme.semantic.textPrimary }]}>
                • {line}
              </Text>
            ))}
          </>
        ) : null}

        {sheetState?.kind === "schedule" ? (
          <>
            {sheetState.lines.map((line) => (
              <Text key={line} style={[styles.listItem, { color: theme.semantic.textPrimary }]}>
                • {line}
              </Text>
            ))}
            <AppButton
              label={scheduleMode === "weekly" ? "Переключить на ежемесячно" : "Переключить на еженедельно"}
              onPress={() => {
                setScheduleMode((current) => (current === "weekly" ? "monthly" : "weekly"));
                setSuccessMessage(
                  `Регулярность переключена на ${scheduleMode === "weekly" ? "ежемесячно" : "еженедельно"}.`
                );
                setSheetState(null);
              }}
              tone="primary"
              fullWidth
            />
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
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  listItem: {
    fontSize: 14,
    lineHeight: 20
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
