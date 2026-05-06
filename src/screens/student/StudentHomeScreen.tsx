import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppBottomSheet } from "../../components/ui/AppBottomSheet";
import { openExport } from "../../services/reportExportService";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import { useTheme } from "../../theme/useTheme";
import type { ReportCard, SalesAcademyMock } from "../../types/academy";
import { EmptyState } from "../../components/ui/EmptyState";
import { AppCard } from "../../components/ui/AppCard";

interface StudentHomeScreenProps {
  data: SalesAcademyMock;
  reports: ReportCard[];
  onOpenReport: (reportId: string) => void;
  onOpenTrainer: (scenarioId: string) => void;
}

const filterLabels = ["Все", "Новые"] as const;

type HomeInfoSheetState =
  | {
      title: string;
      description: string;
      lines: string[];
    }
  | null;

type HistoryExportSheetState = ReportCard | null;

export function StudentHomeScreen({
  data,
  reports,
  onOpenReport,
  onOpenTrainer
}: StudentHomeScreenProps) {
  const theme = useTheme();
  const layout = useResponsiveLayout();
  const [activeFilter, setActiveFilter] = useState<(typeof filterLabels)[number]>("Все");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [infoSheet, setInfoSheet] = useState<HomeInfoSheetState>(null);
  const [historyExportSheet, setHistoryExportSheet] = useState<HistoryExportSheetState>(null);

  const isCompact = !layout.isDesktop;
  const isMobile = layout.isMobile;
  const latestReport = reports[0];
  const filteredHistory = useMemo(() => {
    if (activeFilter === "Все") {
      return reports;
    }

    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return reports.filter((report) => {
      const createdAt = new Date(report.createdAt).getTime();
      return !Number.isNaN(createdAt) && createdAt >= dayAgo;
    });
  }, [activeFilter, reports]);

  const latestReportStrengths = latestReport
    ? getSectionLines(latestReport, ["Сильные стороны"]).slice(0, 3)
    : [];
  const latestReportGrowthPoints = latestReport
    ? getSectionLines(latestReport, ["Зоны роста", "Зоны развития"]).slice(0, 3)
    : [];
  const latestReportLevel = latestReport ? getReportLevel(latestReport) : "Middle";
  const latestReportScore = latestReport ? getReportScore(latestReport) : 0;

  async function handleExport(report: ReportCard, format: "pdf" | "csv") {
    try {
      const message = await openExport(report, format);
      setStatusMessage(message);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Не удалось подготовить экспорт.");
    }
  }

  function openStatusInfo() {
    setInfoSheet({
      title: "Как обновляется главная",
      description: "Главная показывает реальный последний отчет и историю после завершения тренировки.",
      lines: [
        "Новый отчет появляется сверху автоматически после сохранения.",
        "Фильтр «Новые» показывает отчеты за последние 24 часа.",
        "PDF и CSV можно выгрузить прямо из карточек отчетов."
      ]
    });
  }

  function openHelpInfo() {
    setInfoSheet({
      title: "Что доступно на главной",
      description: "Главная больше не ведет в пустые действия и работает как реальная точка входа в report flow.",
      lines: [
        "Открыть последний отчет и перейти в его viewer.",
        "Скачать PDF или CSV из последнего отчета и истории.",
        "Если отчетов нет, перейти в тренажер и начать первую практику."
      ]
    });
  }

  function openHistoryExportSheet(report: ReportCard) {
    setHistoryExportSheet(report);
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.headerRow, isCompact && styles.headerColumn]}>
        <View style={styles.headerBlock}>
          <Text style={[styles.pageTitle, { color: theme.semantic.textPrimary }]}>Главная</Text>
          <Text style={[styles.pageSubtitle, { color: theme.semantic.textSecondary }]}>
            Центральное рабочее пространство с аналитикой и результатами последних тренировок.
          </Text>
        </View>
        <View style={styles.headerActions}>
          <CircleActionButton label="◔" onPress={openStatusInfo} />
          <CircleActionButton label="?" onPress={openHelpInfo} />
        </View>
      </View>

      {statusMessage ? (
        <AppCard tone="mint">
          <Text style={[styles.statusMessage, { color: theme.semantic.success }]}>{statusMessage}</Text>
        </AppCard>
      ) : null}

      <View style={[styles.contentSplit, !layout.isWide && styles.contentSplitStack]}>
        <View
          style={[
            styles.reportCard,
            !layout.isWide && styles.reportCardStacked,
            {
              backgroundColor: theme.semantic.card,
              borderColor: theme.semantic.border,
              shadowColor: theme.shadows.card.shadowColor,
              shadowOpacity: theme.shadows.card.shadowOpacity,
              shadowRadius: theme.shadows.card.shadowRadius,
              shadowOffset: theme.shadows.card.shadowOffset,
              elevation: theme.shadows.card.elevation
            }
          ]}
        >
          {latestReport ? (
            <>
              <View style={[styles.rowBetween, styles.reportTop]}>
                <View style={styles.reportHeading}>
                  <Text style={[styles.sectionTitle, { color: theme.semantic.textPrimary }]}>Последний отчет</Text>
                  <View style={[styles.badge, { backgroundColor: theme.colors.primaryPale }]}>
                    <Text style={[styles.badgeText, { color: theme.semantic.actionPrimary }]}>
                      {latestReport.updatedAt}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={[styles.reportHeroRow, !layout.isDesktop && styles.reportHeroStack]}>
                <View style={styles.reportIdentity}>
                  <View style={[styles.reportIconTile, { backgroundColor: theme.colors.primaryPale }]}>
                    <Text style={[styles.reportIcon, { color: theme.semantic.actionPrimary }]}>⌕</Text>
                  </View>
                  <View style={styles.flexBlock}>
                    <Text style={[styles.reportTitle, { color: theme.semantic.textPrimary }]}>{latestReport.title}</Text>
                    <Text style={[styles.reportMeta, { color: theme.semantic.textSecondary }]}>
                      {`Модуль: ${latestReport.scenarioTitle} · Источник: ${latestReport.sourceLabel ?? "Диалог"}`}
                    </Text>
                  </View>
                </View>
                <View style={styles.scoreBlock}>
                  <Text style={[styles.scoreValue, { color: theme.semantic.textPrimary }]}>{latestReportScore}%</Text>
                  <Text style={[styles.scoreLabel, { color: theme.semantic.actionPrimary }]}>
                    {`Уровень: ${latestReportLevel}`}
                  </Text>
                </View>
              </View>

              {isMobile ? (
                <View style={styles.mobileFeedbackStack}>
                  <View style={styles.feedbackColumnMobile}>
                    <Text style={[styles.listTitle, { color: theme.semantic.textPrimary }]}>Сильные стороны</Text>
                    {latestReportStrengths.map((item) => (
                      <Text key={item} style={[styles.listItem, { color: theme.semantic.textSecondary }]}>
                        ✓ {item}
                      </Text>
                    ))}
                  </View>
                  <View
                    style={[
                      styles.growthColumnMobile,
                      { borderTopColor: theme.semantic.border }
                    ]}
                  >
                    <Text style={[styles.listTitle, { color: theme.semantic.textPrimary }]}>Точки роста</Text>
                    {latestReportGrowthPoints.map((item) => (
                      <Text key={item} style={[styles.listItem, { color: theme.semantic.textSecondary }]}>
                        ⚠ {item}
                      </Text>
                    ))}
                  </View>
                </View>
              ) : (
                <View style={[styles.listColumns, isCompact && styles.listColumnsStack]}>
                  <View style={styles.feedbackColumn}>
                    <Text style={[styles.listTitle, { color: theme.semantic.textPrimary }]}>Сильные стороны</Text>
                    {latestReportStrengths.map((item) => (
                      <Text key={item} style={[styles.listItem, { color: theme.semantic.textSecondary }]}>
                        ✓ {item}
                      </Text>
                    ))}
                  </View>
                  <View style={styles.feedbackColumn}>
                    <Text style={[styles.listTitle, { color: theme.semantic.textPrimary }]}>Точки роста</Text>
                    {latestReportGrowthPoints.map((item) => (
                      <Text key={item} style={[styles.listItem, { color: theme.semantic.textSecondary }]}>
                        ⚠ {item}
                      </Text>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.actionRow}>
                <PrimaryActionButton label="Открыть" onPress={() => onOpenReport(latestReport.id)} />
                <SecondaryActionButton label="PDF" onPress={() => { void handleExport(latestReport, "pdf"); }} />
                <SecondaryActionButton label="CSV" onPress={() => { void handleExport(latestReport, "csv"); }} />
              </View>
            </>
          ) : (
            <EmptyState
              title="Последний отчет появится после первой практики"
              description="Завершите диалог в тренажере, чтобы увидеть здесь реальный отчет и историю результатов."
              actionLabel="Перейти в тренажер"
              onAction={() => onOpenTrainer(data.activeDialogue.selectedScenarioId)}
            />
          )}
        </View>

        <View
          style={[
            styles.recommendationsCard,
            !layout.isWide && styles.recommendationsCardStacked,
            {
              backgroundColor: theme.semantic.card,
              borderColor: theme.semantic.border,
              shadowColor: theme.shadows.soft.shadowColor,
              shadowOpacity: theme.shadows.soft.shadowOpacity,
              shadowRadius: theme.shadows.soft.shadowRadius,
              shadowOffset: theme.shadows.soft.shadowOffset,
              elevation: theme.shadows.soft.elevation
            }
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.semantic.textPrimary }]}>Что улучшить</Text>
          <View style={styles.recommendationList}>
            {data.recommendations.map((item) => (
              <View key={item.id} style={styles.recommendationRow}>
                <View style={[styles.recommendationIconTile, { backgroundColor: toneBackground(theme, item.tone) }]}>
                  <Text style={[styles.recommendationIcon, { color: toneForeground(theme, item.tone) }]}>{item.icon}</Text>
                </View>
                <View style={styles.flexBlock}>
                  <Text style={[styles.recommendationTitle, { color: theme.semantic.textPrimary }]}>{item.title}</Text>
                  <Text style={[styles.recommendationText, { color: theme.semantic.textSecondary }]}>{item.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={[styles.filtersLayout, !layout.isDesktop && styles.filtersLayoutStack]}>
        <View style={[styles.filtersControls, !layout.isDesktop && styles.filtersControlsStack]}>
          <View style={styles.filterPills}>
            {filterLabels.map((label) => (
              <Pressable
                key={label}
                onPress={() => setActiveFilter(label)}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor:
                      activeFilter === label ? theme.colors.primaryPale : theme.semantic.card,
                    borderColor: theme.semantic.border
                  }
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    {
                      color:
                        activeFilter === label
                          ? theme.semantic.actionPrimary
                          : theme.semantic.textPrimary
                    }
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <View
        style={[
          styles.tableCard,
          isMobile && styles.tableCardMobile,
          {
            backgroundColor: theme.semantic.card,
            borderColor: theme.semantic.border,
            shadowColor: theme.shadows.soft.shadowColor,
            shadowOpacity: theme.shadows.soft.shadowOpacity,
            shadowRadius: theme.shadows.soft.shadowRadius,
            shadowOffset: theme.shadows.soft.shadowOffset,
            elevation: theme.shadows.soft.elevation
          }
        ]}
      >
        <Text style={[styles.sectionTitle, { color: theme.semantic.textPrimary }]}>История отчетов</Text>
        {filteredHistory.length > 0 ? (
          <>
            {!isMobile ? (
              <View style={styles.tableHeader}>
                {[
                  { title: "Дата", style: styles.tableDateColumn },
                  { title: "Модуль", style: styles.tableModuleColumn },
                  { title: "Сценарий", style: styles.tableScenarioColumn },
                  { title: "Уровень", style: styles.tableLevelColumn },
                  { title: "Экспорт", style: styles.tableExportColumn }
                ].map((column) => (
                  <View key={column.title} style={column.style}>
                    <Text style={[styles.tableHeaderText, { color: theme.semantic.textMuted }]}>
                      {column.title}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}

            {filteredHistory.map((item) => (
              isMobile ? (
                <View
                  key={item.id}
                  style={[
                    styles.mobileHistoryCard,
                    { borderTopColor: theme.semantic.borderSubtle, borderColor: theme.semantic.borderSubtle }
                  ]}
                >
                  <View style={styles.mobileHistoryTopRow}>
                    <Text style={[styles.mobileHistoryDate, { color: theme.semantic.textSecondary }]}>
                      {item.updatedAt}
                    </Text>
                    <View style={styles.mobileHistoryMetaRow}>
                      <LevelBadge level={toHistoryLevel(item)} mobileDense />
                      <SecondaryActionButton
                        label="Скачать"
                        compact
                        mobileDense
                        onPress={() => openHistoryExportSheet(item)}
                      />
                    </View>
                  </View>

                  <Pressable onPress={() => onOpenReport(item.id)} style={styles.mobileHistoryMain}>
                    <Text style={[styles.mobileHistoryModule, { color: theme.semantic.actionPrimary }]}>
                      {item.title}
                    </Text>
                    <Text style={[styles.mobileHistoryScenario, { color: theme.semantic.textSecondary }]}>
                      {item.scenarioTitle}
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <View
                  key={item.id}
                  style={[
                    styles.tableRow,
                    { borderTopColor: theme.semantic.borderSubtle }
                  ]}
                >
                  <View style={styles.tableDateColumn}>
                    <Text style={[styles.tableText, { color: theme.semantic.textSecondary }]}>{item.updatedAt}</Text>
                  </View>
                  <Pressable onPress={() => onOpenReport(item.id)} style={styles.tableModuleColumn}>
                    <Text style={[styles.tableText, styles.tableStrong, { color: theme.semantic.actionPrimary }]}>
                      {item.title}
                    </Text>
                  </Pressable>
                  <View style={styles.tableScenarioColumn}>
                    <Text style={[styles.tableText, { color: theme.semantic.textSecondary }]}>{item.scenarioTitle}</Text>
                  </View>
                  <View style={styles.tableLevelColumn}>
                    <LevelBadge level={toHistoryLevel(item)} />
                  </View>
                  <View style={[styles.tableExportColumn, styles.exportCell]}>
                    <SecondaryActionButton
                      label="PDF"
                      compact
                      onPress={() => { void handleExport(item, "pdf"); }}
                    />
                    <SecondaryActionButton
                      label="CSV"
                      compact
                      onPress={() => { void handleExport(item, "csv"); }}
                    />
                  </View>
                </View>
              )
            ))}

            <View style={[styles.paginationRow, !layout.isDesktop && styles.paginationStack]}>
              <Text style={[styles.paginationMeta, { color: theme.semantic.textMuted }]}>
                {`Показано ${filteredHistory.length} из ${reports.length} отчетов`}
              </Text>
            </View>
          </>
        ) : (
          <EmptyState
            title="История отчетов пока пуста"
            description="Сначала завершите хотя бы одну практику, и история заполнится реальными отчетами без mock-данных."
            actionLabel="Начать тренировку"
            onAction={() => onOpenTrainer(data.activeDialogue.selectedScenarioId)}
          />
        )}
      </View>

      <AppBottomSheet
        visible={infoSheet !== null}
        title={infoSheet?.title ?? ""}
        description={infoSheet?.description}
        onClose={() => setInfoSheet(null)}
      >
        {infoSheet?.lines.map((line) => (
          <Text key={line} style={[styles.sheetLine, { color: theme.semantic.textPrimary }]}>
            • {line}
          </Text>
        ))}
      </AppBottomSheet>

      <AppBottomSheet
        visible={historyExportSheet !== null}
        title="Скачать отчет"
        description={historyExportSheet ? historyExportSheet.title : undefined}
        onClose={() => setHistoryExportSheet(null)}
      >
        <View style={styles.exportSheetActions}>
          <SecondaryActionButton
            label="Скачать PDF"
            wide
            onPress={() => {
              if (!historyExportSheet) {
                return;
              }

              void handleExport(historyExportSheet, "pdf");
              setHistoryExportSheet(null);
            }}
          />
          <SecondaryActionButton
            label="Скачать CSV"
            wide
            onPress={() => {
              if (!historyExportSheet) {
                return;
              }

              void handleExport(historyExportSheet, "csv");
              setHistoryExportSheet(null);
            }}
          />
        </View>
      </AppBottomSheet>
    </View>
  );
}

function CircleActionButton({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[styles.circleButton, { backgroundColor: theme.semantic.card, borderColor: theme.semantic.border }]}
    >
      <Text style={[styles.circleButtonText, { color: theme.semantic.textPrimary }]}>{label}</Text>
    </Pressable>
  );
}

function PrimaryActionButton({ label, onPress }: { label: string; onPress?: () => void }) {
  const theme = useTheme();
  const isDisabled = !onPress;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.primaryButton,
        { backgroundColor: theme.semantic.actionPrimary },
        isDisabled && styles.buttonDisabled
      ]}
    >
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function SecondaryActionButton({
  label,
  compact,
  mobileDense,
  wide,
  onPress
}: {
  label: string;
  compact?: boolean;
  mobileDense?: boolean;
  wide?: boolean;
  onPress?: () => void;
}) {
  const theme = useTheme();
  const isDisabled = !onPress;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.secondaryButton,
        compact && styles.secondaryButtonCompact,
        mobileDense && styles.secondaryButtonMobileDense,
        wide && styles.secondaryButtonWide,
        { backgroundColor: theme.semantic.card, borderColor: theme.semantic.border },
        isDisabled && styles.buttonDisabled
      ]}
    >
      <Text
        style={[
          styles.secondaryButtonText,
          mobileDense && styles.secondaryButtonTextMobileDense,
          { color: theme.semantic.textPrimary }
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function LevelBadge({
  level,
  mobileDense = false
}: {
  level: "junior" | "middle" | "senior";
  mobileDense?: boolean;
}) {
  const theme = useTheme();
  const config =
    level === "senior"
      ? { label: "Senior", background: theme.colors.primaryPale, color: theme.semantic.actionPrimary }
      : level === "middle"
        ? { label: "Middle", background: "rgba(213,162,77,0.14)", color: theme.semantic.warning }
        : { label: "Junior", background: "rgba(200,92,74,0.12)", color: theme.semantic.danger };

  return (
    <View style={[styles.statusBadge, mobileDense && styles.statusBadgeMobileDense, { backgroundColor: config.background }]}>
      <Text style={[styles.statusBadgeText, mobileDense && styles.statusBadgeTextMobileDense, { color: config.color }]}>
        {config.label}
      </Text>
    </View>
  );
}

function getSectionLines(report: ReportCard, titles: string[]): string[] {
  const section = report.previewSections.find((item) => titles.includes(item.title));
  return section?.lines ?? [];
}

function getReportLevel(report: ReportCard): "Junior" | "Middle" | "Senior" {
  const resumeSection = report.previewSections.find((section) => section.title === "Краткое резюме");
  const levelLine = resumeSection?.lines.find((line) => line.startsWith("Общий уровень:"));
  if (levelLine?.includes("Senior")) {
    return "Senior";
  }
  if (levelLine?.includes("Junior")) {
    return "Junior";
  }
  return "Middle";
}

function getReportScore(report: ReportCard): number {
  const competencySection = report.previewSections.find((section) => section.title === "Компетенции");
  const lines = competencySection?.lines ?? [];
  if (lines.length === 0) {
    return 0;
  }

  const total = lines.reduce((sum, line) => {
    if (line.includes(": Senior")) {
      return sum + 92;
    }
    if (line.includes(": Junior")) {
      return sum + 60;
    }
    return sum + 78;
  }, 0);

  return Math.round(total / lines.length);
}

function toHistoryLevel(report: ReportCard): "junior" | "middle" | "senior" {
  const level = getReportLevel(report);
  if (level === "Senior") {
    return "senior";
  }
  if (level === "Junior") {
    return "junior";
  }
  return "middle";
}

function toneBackground(theme: ReturnType<typeof useTheme>, tone: "mint" | "warning" | "violet") {
  if (tone === "warning") {
    return "rgba(213,162,77,0.16)";
  }
  if (tone === "violet") {
    return "rgba(120, 120, 180, 0.14)";
  }

  return theme.colors.primaryPale;
}

function toneForeground(theme: ReturnType<typeof useTheme>, tone: "mint" | "warning" | "violet") {
  if (tone === "warning") {
    return theme.semantic.warning;
  }
  if (tone === "violet") {
    return "#7B61B9";
  }

  return theme.semantic.actionPrimary;
}

const styles = StyleSheet.create({
  screen: {
    gap: 18
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16
  },
  headerColumn: {
    flexDirection: "column"
  },
  headerBlock: {
    flex: 1,
    gap: 6
  },
  pageTitle: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "800"
  },
  pageSubtitle: {
    fontSize: 16,
    lineHeight: 24
  },
  statusMessage: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "800"
  },
  sheetLine: {
    fontSize: 15,
    lineHeight: 22
  },
  headerActions: {
    flexDirection: "row",
    gap: 10
  },
  circleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  circleButtonText: {
    fontSize: 16,
    fontWeight: "700"
  },
  contentSplit: {
    flexDirection: "row",
    gap: 18,
    alignItems: "flex-start"
  },
  contentSplitStack: {
    flexDirection: "column",
    alignItems: "stretch"
  },
  reportCard: {
    flex: 1.45,
    minWidth: 0,
    borderWidth: 1,
    borderRadius: 30,
    padding: 22,
    gap: 20
  },
  reportCardStacked: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: "auto",
    width: "100%"
  },
  recommendationsCard: {
    flex: 1,
    minWidth: 320,
    borderWidth: 1,
    borderRadius: 30,
    padding: 22,
    gap: 20
  },
  recommendationsCardStacked: {
    minWidth: 0,
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: "auto",
    width: "100%",
    alignSelf: "stretch"
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  reportTop: {
    alignItems: "flex-start"
  },
  reportHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap"
  },
  sectionTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "800"
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "700"
  },
  reportHeroRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16
  },
  reportHeroStack: {
    flexDirection: "column",
    alignItems: "flex-start"
  },
  reportIdentity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flex: 1
  },
  reportIconTile: {
    width: 70,
    height: 70,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center"
  },
  reportIcon: {
    fontSize: 28,
    fontWeight: "700"
  },
  flexBlock: {
    flex: 1,
    gap: 6
  },
  reportTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "800"
  },
  reportMeta: {
    fontSize: 15,
    lineHeight: 22
  },
  scoreBlock: {
    minWidth: 120,
    alignItems: "flex-end",
    gap: 4
  },
  scoreValue: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "800"
  },
  scoreLabel: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700"
  },
  listColumns: {
    flexDirection: "row",
    gap: 20
  },
  listColumnsStack: {
    flexDirection: "column"
  },
  mobileFeedbackStack: {
    gap: 14,
    marginTop: 5
  },
  feedbackColumn: {
    flex: 1,
    gap: 10
  },
  feedbackColumnMobile: {
    width: "100%",
    gap: 10
  },
  growthColumnMobile: {
    paddingTop: 14,
    borderTopWidth: 1,
    width: "100%",
    gap: 10
  },
  listTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700"
  },
  listItem: {
    fontSize: 15,
    lineHeight: 22
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  primaryButton: {
    minHeight: 46,
    borderRadius: 999,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center"
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700"
  },
  secondaryButton: {
    minHeight: 44,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center"
  },
  secondaryButtonCompact: {
    minHeight: 32,
    paddingHorizontal: 12
  },
  secondaryButtonMobileDense: {
    minHeight: 30,
    paddingHorizontal: 10
  },
  secondaryButtonWide: {
    paddingHorizontal: 20
  },
  buttonDisabled: {
    opacity: 0.5
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "700"
  },
  secondaryButtonTextMobileDense: {
    fontSize: 12
  },
  recommendationList: {
    gap: 18
  },
  recommendationRow: {
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start"
  },
  recommendationIconTile: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center"
  },
  recommendationIcon: {
    fontSize: 20,
    fontWeight: "700"
  },
  recommendationTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700"
  },
  recommendationText: {
    fontSize: 14,
    lineHeight: 20
  },
  filtersLayout: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    justifyContent: "flex-end"
  },
  filtersLayoutStack: {
    flexDirection: "column",
    alignItems: "stretch"
  },
  filtersControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 14
  },
  filtersControlsStack: {
    flexDirection: "column",
    alignItems: "stretch"
  },
  filterPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "flex-end"
  },
  filterPill: {
    minHeight: 42,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center"
  },
  filterPillText: {
    fontSize: 14,
    fontWeight: "600"
  },
  tableCard: {
    borderWidth: 1,
    borderRadius: 28,
    paddingVertical: 16,
    paddingHorizontal: 12,
    gap: 10
  },
  tableCardMobile: {
    paddingHorizontal: 10
  },
  mobileHistoryCard: {
    borderTopWidth: 1,
    paddingVertical: 12,
    gap: 10
  },
  mobileHistoryTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12
  },
  mobileHistoryDate: {
    fontSize: 14,
    lineHeight: 20
  },
  mobileHistoryMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  mobileHistoryMain: {
    gap: 6
  },
  mobileHistoryModule: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700"
  },
  mobileHistoryScenario: {
    fontSize: 14,
    lineHeight: 20
  },
  tableHeader: {
    flexDirection: "row",
    paddingTop: 8,
    paddingBottom: 6
  },
  tableDateColumn: {
    flex: 1.05
  },
  tableModuleColumn: {
    flex: 1.05
  },
  tableScenarioColumn: {
    flex: 1.05
  },
  tableLevelColumn: {
    flex: 0.9
  },
  tableExportColumn: {
    flex: 0.95
  },
  tableHeaderText: {
    fontSize: 13,
    fontWeight: "600"
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    paddingVertical: 12,
    gap: 8
  },
  tableRowMobile: {
    alignItems: "flex-start",
    gap: 6
  },
  tableText: {
    fontSize: 14,
    lineHeight: 20
  },
  tableStrong: {
    fontWeight: "500"
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: "flex-start",
    minWidth: 106
  },
  statusBadgeMobileDense: {
    minWidth: 58,
    paddingHorizontal: 5,
    paddingVertical: 4
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700"
  },
  statusBadgeTextMobileDense: {
    fontSize: 10
  },
  exportCell: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-start"
  },
  exportSheetActions: {
    gap: 12
  },
  paginationRow: {
    paddingTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  paginationStack: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 10
  },
  paginationMeta: {
    fontSize: 13
  },
  paginationControls: {
    flexDirection: "row",
    gap: 8
  },
  pageButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  pageButtonText: {
    fontSize: 14,
    fontWeight: "700"
  }
});
