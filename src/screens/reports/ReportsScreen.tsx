import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AppBottomSheet } from "../../components/ui/AppBottomSheet";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { EmptyState } from "../../components/ui/EmptyState";
import { StatusPill } from "../../components/ui/StatusPill";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import { roleLabels } from "../../navigation/routes";
import { useTheme } from "../../theme/useTheme";
import type { ReportCard, ScheduledReportRule, UserRole } from "../../types/academy";

interface ReportsScreenProps {
  activeRole: UserRole;
  reports: ReportCard[];
  rules: ScheduledReportRule[];
  highlightReportId?: string;
}

type ReportsSheetState =
  | { kind: "preview"; report: ReportCard }
  | { kind: "export"; title: string; lines: string[] }
  | { kind: "schedule"; title: string; lines: string[] }
  | null;

const roleContent = {
  student: {
    sendTargets: ["Мне на почту", "Руководителю"],
    emptyTitle: "Личный отчет пока не готов",
    emptyDescription: "После завершения практики здесь появятся оценка, точки роста и персональный план развития."
  },
  manager: {
    sendTargets: ["Руководителю", "HR / L&D"],
    emptyTitle: "Командные отчеты пока не собраны",
    emptyDescription: "Когда по группе накопится практика, здесь появятся отчеты по динамике навыков и точкам роста."
  },
  hr: {
    sendTargets: ["HR / L&D", "Руководителям групп"],
    emptyTitle: "Групповые отчеты пока не собраны",
    emptyDescription: "Здесь появятся групповые, департаментские и компетентностные выгрузки."
  },
  admin: {
    sendTargets: ["Администратору", "Владельцу процесса"],
    emptyTitle: "Регламенты пока не собраны",
    emptyDescription: "Когда правила выгрузки будут настроены, здесь появятся доступы, расписание и форматы отчетов."
  }
} as const;

export function ReportsScreen({ activeRole, reports, rules, highlightReportId }: ReportsScreenProps) {
  const theme = useTheme();
  const layout = useResponsiveLayout();
  const [sheetState, setSheetState] = useState<ReportsSheetState>(null);
  const [sendLog, setSendLog] = useState<string[]>([]);
  const [scheduleMode, setScheduleMode] = useState<"weekly" | "monthly">("weekly");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const roleReports = useMemo(
    () => reports.filter((report) => report.role === activeRole),
    [activeRole, reports]
  );
  const roleRules = useMemo(
    () => rules.filter((rule) => rule.role === activeRole),
    [activeRole, rules]
  );
  const [selectedReportId, setSelectedReportId] = useState("");

  useEffect(() => {
    const nextReport = roleReports.find((item) => item.id === highlightReportId) ?? roleReports[0] ?? null;
    setSelectedReportId(nextReport?.id ?? "");
  }, [highlightReportId, roleReports]);

  const selectedReport = useMemo(
    () => roleReports.find((item) => item.id === selectedReportId) ?? roleReports[0] ?? null,
    [roleReports, selectedReportId]
  );
  const reportWidth = layout.isDesktop ? "48%" : "100%";
  const content = roleContent[activeRole];

  function openExport(report: ReportCard, format: "pdf" | "csv" | "xlsx") {
    setSheetState({
      kind: "export",
      title: `${format.toUpperCase()} подготовлен`,
      lines: [
        `Отчет: ${report.title}`,
        `Формат: ${format.toUpperCase()}`,
        `Аудитория: ${roleLabels[activeRole]}`,
        "Статус: выгрузка подготовлена и доступна для дальнейшего действия"
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

      {roleReports.length === 0 ? (
        <EmptyState
          title={content.emptyTitle}
          description={content.emptyDescription}
          actionLabel="Открыть правила"
          onAction={() =>
            setSheetState({
              kind: "schedule",
              title: "Правила отправки",
              lines: roleRules.map((rule) => `${rule.audience}: ${rule.frequencyLabel} · ${rule.format.toUpperCase()}`)
            })
          }
        />
      ) : (
        <View style={[styles.reportsGrid, layout.isDesktop && styles.reportsGridDesktop]}>
          {roleReports.map((report) => (
            <View key={report.id} style={{ width: reportWidth }}>
              <AppCard tone={report.id === selectedReportId ? "mint" : "default"}>
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
                    label={`Скачать ${report.availableFormats[0].toUpperCase()}`}
                    onPress={() => openExport(report, report.availableFormats[0])}
                    tone="secondary"
                  />
                  {report.availableFormats[1] ? (
                    <AppButton
                      label={`Скачать ${report.availableFormats[1].toUpperCase()}`}
                      onPress={() => openExport(report, report.availableFormats[1])}
                      tone="ghost"
                    />
                  ) : null}
                </View>
                <View style={styles.buttonRow}>
                  <AppButton
                    label={`Отправить: ${content.sendTargets[0]}`}
                    onPress={() => {
                      setSendLog((current) => [...current, `${report.title} → ${content.sendTargets[0]}`]);
                      setSuccessMessage(`Отчет "${report.title}" отправлен: ${content.sendTargets[0]}.`);
                    }}
                    tone="secondary"
                  />
                  {content.sendTargets[1] ? (
                    <AppButton
                      label={`Отправить: ${content.sendTargets[1]}`}
                      onPress={() => {
                        setSendLog((current) => [...current, `${report.title} → ${content.sendTargets[1]}`]);
                        setSuccessMessage(`Отчет "${report.title}" отправлен: ${content.sendTargets[1]}.`);
                      }}
                      tone="ghost"
                    />
                  ) : null}
                  <AppButton
                    label="Настроить регулярность"
                    onPress={() =>
                      setSheetState({
                        kind: "schedule",
                        title: "Настроить регулярность",
                        lines: [
                          `Текущий режим: ${scheduleMode === "weekly" ? "еженедельно" : "ежемесячно"}`,
                          ...roleRules.map((rule) => `${rule.title} · ${rule.frequencyLabel}`)
                        ]
                      })
                    }
                    tone="ghost"
                  />
                </View>
                <AppButton label="Выбрать отчет" onPress={() => setSelectedReportId(report.id)} tone="ghost" />
              </AppCard>
            </View>
          ))}
        </View>
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
          <Text style={[styles.title, { color: theme.semantic.textPrimary }]}>Правила отправки</Text>
          {roleRules.map((rule) => (
            <Text key={rule.id} style={[styles.listItem, { color: theme.semantic.textSecondary }]}>
              • {rule.audience}: {rule.title} · {rule.frequencyLabel}
            </Text>
          ))}
        </AppCard>
      ) : null}

      <AppBottomSheet
        visible={sheetState !== null}
        title={sheetState?.kind === "preview" ? `Предпросмотр: ${sheetState.report.title}` : sheetState?.title ?? ""}
        description={
          sheetState?.kind === "preview"
            ? `Отчет для роли: ${roleLabels[activeRole]}.`
            : sheetState?.kind === "schedule"
              ? "Правила отправки можно переключать прямо из этого центра отчетов."
              : "Выгрузка подготовлена и зафиксирована как успешное действие."
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
                const nextMode = scheduleMode === "weekly" ? "monthly" : "weekly";
                setScheduleMode(nextMode);
                setSuccessMessage(`Регулярность переключена на ${nextMode === "weekly" ? "еженедельно" : "ежемесячно"}.`);
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
