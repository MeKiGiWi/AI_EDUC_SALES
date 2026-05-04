import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { ReportHistoryItem, SalesAcademyMock } from "../../data/salesAcademyMock";
import type { RootStackParamList, RouteName } from "../../navigation/routes";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import { useTheme } from "../../theme/useTheme";

interface StudentHomeScreenProps {
  data: SalesAcademyMock;
  onNavigate: <T extends RouteName>(route: T, params?: RootStackParamList[T]) => void;
  onOpenTrainer: (scenarioId: string) => void;
}

const filterLabels = ["Все", "Новые"] as const;

export function StudentHomeScreen({ data, onOpenTrainer }: StudentHomeScreenProps) {
  const theme = useTheme();
  const layout = useResponsiveLayout();
  const [activeFilter, setActiveFilter] = useState<(typeof filterLabels)[number]>("Все");

  const isCompact = !layout.isDesktop;
  const filteredHistory = data.reportHistory;

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
          <CircleActionButton label="◔" />
          <CircleActionButton label="?" />
        </View>
      </View>

      <View style={[styles.contentSplit, !layout.isWide && styles.contentSplitStack]}>
        <View
          style={[
            styles.reportCard,
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
          <View style={[styles.rowBetween, styles.reportTop]}>
            <View style={styles.reportHeading}>
              <Text style={[styles.sectionTitle, { color: theme.semantic.textPrimary }]}>Последний отчет</Text>
              <View style={[styles.badge, { backgroundColor: theme.colors.primaryPale }]}>
                <Text style={[styles.badgeText, { color: theme.semantic.actionPrimary }]}>{data.lastReport.badge}</Text>
              </View>
            </View>
          </View>

          <View style={[styles.reportHeroRow, !layout.isDesktop && styles.reportHeroStack]}>
            <View style={styles.reportIdentity}>
              <View style={[styles.reportIconTile, { backgroundColor: theme.colors.primaryPale }]}>
                <Text style={[styles.reportIcon, { color: theme.semantic.actionPrimary }]}>⌕</Text>
              </View>
              <View style={styles.flexBlock}>
                <Text style={[styles.reportTitle, { color: theme.semantic.textPrimary }]}>{data.lastReport.title}</Text>
                <Text style={[styles.reportMeta, { color: theme.semantic.textSecondary }]}>{data.lastReport.meta}</Text>
              </View>
            </View>
            <View style={styles.scoreBlock}>
              <Text style={[styles.scoreValue, { color: theme.semantic.textPrimary }]}>{data.lastReport.averageScore}%</Text>
              <Text style={[styles.scoreLabel, { color: theme.semantic.actionPrimary }]}>Уровень: Middle</Text>
            </View>
          </View>

          <View style={[styles.listColumns, isCompact && styles.listColumnsStack]}>
            <View style={styles.feedbackColumn}>
              <Text style={[styles.listTitle, { color: theme.semantic.textPrimary }]}>Сильные стороны</Text>
              {data.lastReport.strengths.map((item) => (
                <Text key={item} style={[styles.listItem, { color: theme.semantic.textSecondary }]}>
                  ✓ {item}
                </Text>
              ))}
            </View>
            <View style={styles.feedbackColumn}>
              <Text style={[styles.listTitle, { color: theme.semantic.textPrimary }]}>Точки роста</Text>
              {data.lastReport.growthPoints.map((item) => (
                <Text key={item} style={[styles.listItem, { color: theme.semantic.textSecondary }]}>
                  ⚠ {item}
                </Text>
              ))}
            </View>
          </View>

          <View style={styles.actionRow}>
            <PrimaryActionButton label="Открыть" onPress={() => onOpenTrainer(data.activeDialogue.selectedScenarioId)} />
            <SecondaryActionButton label="PDF" />
            <SecondaryActionButton label="CSV" />
          </View>
        </View>

        <View
          style={[
            styles.recommendationsCard,
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
        <View style={styles.tableHeader}>
          {["Дата", "Модуль", "Сценарий", "Уровень", "Экспорт"].map((title) => (
            <Text
              key={title}
              style={[styles.tableHeaderText, { color: theme.semantic.textMuted }]}
            >
              {title}
            </Text>
          ))}
        </View>

        {filteredHistory.map((item) => (
          <View key={item.id} style={[styles.tableRow, { borderTopColor: theme.semantic.borderSubtle }]}>
            <Text style={[styles.tableText, { color: theme.semantic.textSecondary }]}>{item.date}</Text>
            <Text style={[styles.tableText, styles.tableStrong, { color: theme.semantic.textSecondary }]}>{item.module}</Text>
            <Text style={[styles.tableText, { color: theme.semantic.textSecondary }]}>{item.scenario}</Text>
            <LevelBadge level={item.level} />
            <View style={styles.exportCell}>
              <SecondaryActionButton label="PDF" compact />
              <SecondaryActionButton label="CSV" compact />
            </View>
          </View>
        ))}

        <View style={[styles.paginationRow, !layout.isDesktop && styles.paginationStack]}>
          <Text style={[styles.paginationMeta, { color: theme.semantic.textMuted }]}>Показано 1–5 из 18 отчетов</Text>
          <View style={styles.paginationControls}>
            {["1", "2", "3", "4"].map((page, index) => (
              <Pressable
                key={page}
                onPress={() => {}}
                style={[
                  styles.pageButton,
                  {
                    backgroundColor: index === 0 ? theme.semantic.actionPrimary : theme.semantic.card,
                    borderColor: theme.semantic.border
                  }
                ]}
              >
                <Text style={[styles.pageButtonText, { color: index === 0 ? "#FFFFFF" : theme.semantic.textPrimary }]}>{page}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

function CircleActionButton({ label }: { label: string }) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={() => {}}
      style={[styles.circleButton, { backgroundColor: theme.semantic.card, borderColor: theme.semantic.border }]}
    >
      <Text style={[styles.circleButtonText, { color: theme.semantic.textPrimary }]}>{label}</Text>
    </Pressable>
  );
}

function PrimaryActionButton({ label, onPress }: { label: string; onPress?: () => void }) {
  const theme = useTheme();

  return (
    <Pressable onPress={onPress ?? (() => {})} style={[styles.primaryButton, { backgroundColor: theme.semantic.actionPrimary }]}>
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function SecondaryActionButton({
  label,
  compact,
  wide
}: {
  label: string;
  compact?: boolean;
  wide?: boolean;
}) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={() => {}}
      style={[
        styles.secondaryButton,
        compact && styles.secondaryButtonCompact,
        wide && styles.secondaryButtonWide,
        { backgroundColor: theme.semantic.card, borderColor: theme.semantic.border }
      ]}
    >
      <Text style={[styles.secondaryButtonText, { color: theme.semantic.textPrimary }]}>{label}</Text>
    </Pressable>
  );
}

function LevelBadge({ level }: { level: ReportHistoryItem["level"] }) {
  const theme = useTheme();
  const config =
    level === "senior"
      ? { label: "Senior", background: theme.colors.primaryPale, color: theme.semantic.actionPrimary }
      : level === "middle"
        ? { label: "Middle", background: "rgba(213,162,77,0.14)", color: theme.semantic.warning }
        : { label: "Junior", background: "rgba(200,92,74,0.12)", color: theme.semantic.danger };

  return (
    <View style={[styles.statusBadge, { backgroundColor: config.background }]}>
      <Text style={[styles.statusBadgeText, { color: config.color }]}>{config.label}</Text>
    </View>
  );
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
    alignItems: "stretch"
  },
  contentSplitStack: {
    flexDirection: "column"
  },
  reportCard: {
    flex: 1.75,
    borderWidth: 1,
    borderRadius: 30,
    padding: 22,
    gap: 20
  },
  recommendationsCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 30,
    padding: 22,
    gap: 20
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
  feedbackColumn: {
    flex: 1,
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
  secondaryButtonWide: {
    paddingHorizontal: 20
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "700"
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
    padding: 16,
    gap: 10
  },
  tableHeader: {
    flexDirection: "row",
    paddingTop: 8,
    paddingBottom: 6
  },
  tableHeaderText: {
    flex: 1.2,
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
  tableText: {
    flex: 1.2,
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
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700"
  },
  exportCell: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-start"
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
