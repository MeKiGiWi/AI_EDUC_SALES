import React, { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { RootStackParamList, RouteName } from "../../navigation/routes";
import type { DevelopmentTrack, GroupProgress, HrDashboard } from "../../types/academy";
import { AppBottomSheet } from "../../components/ui/AppBottomSheet";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { MetricCard } from "../../components/ui/MetricCard";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { StatusPill } from "../../components/ui/StatusPill";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import { useTheme } from "../../theme/useTheme";

interface HrDashboardScreenProps {
  dashboard: HrDashboard;
  onNavigate: <T extends RouteName>(route: T, params?: RootStackParamList[T]) => void;
}

type HrSheetState =
  | { kind: "group"; group: GroupProgress }
  | { kind: "compare"; title: string; lines: string[] }
  | { kind: "export"; title: string; lines: string[] }
  | null;

export function HrDashboardScreen({ dashboard, onNavigate }: HrDashboardScreenProps) {
  const theme = useTheme();
  const layout = useResponsiveLayout();
  const [comparisonEnabled, setComparisonEnabled] = useState(false);
  const [sheetState, setSheetState] = useState<HrSheetState>(null);
  const [assignedTrackIds, setAssignedTrackIds] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const strongestGroup = useMemo(
    () =>
      [...dashboard.groupProgress].sort((a, b) => b.averageScore - a.averageScore)[0] ??
      dashboard.groupProgress[0],
    [dashboard.groupProgress]
  );
  const metricWidth = layout.isWide ? "23.5%" : layout.isDesktop ? "31.5%" : layout.isTablet ? "48%" : "100%";

  return (
    <>
      <SectionHeader
        eyebrow="HR / L&D"
        title="Группы, компетенции и треки развития"
        description="Экран для HR/L&D показывает доходимость, динамику оценки, риски по группам и помогает быстро подготовить выгрузку или назначить трек развития."
      />

      <View style={[styles.metricGrid, (layout.isTablet || layout.isDesktop) && styles.wrapGrid]}>
        {dashboard.metrics.map((metric) => (
          <View key={metric.id} style={{ width: metricWidth }}>
            <MetricCard metric={metric} />
          </View>
        ))}
      </View>

      <AppCard tone="mint">
        <Text style={[styles.title, { color: theme.semantic.textPrimary }]}>Ключевые действия HR/L&D</Text>
        <View style={styles.buttonRow}>
          <AppButton
            label="Выгрузить статистику HR/L&D"
            onPress={() =>
              setSheetState({
                kind: "export",
                title: "HR/L&D export",
                lines: [
                  `Активных треков: ${dashboard.tracks.length}`,
                  `Сильнейшая группа: ${strongestGroup.groupName}`,
                  `Средняя доходимость: ${strongestGroup.completionRate}%`
                ]
              })
            }
            tone="primary"
          />
          <AppButton
            label="Выгрузить динамику оценки"
            onPress={() =>
              setSheetState({
                kind: "export",
                title: "Динамика оценки",
                lines: dashboard.scoreDynamics.map((item) => `${item.label}: ${item.value}`)
              })
            }
            tone="secondary"
          />
          <AppButton
            label="Сформировать командный отчет"
            onPress={() => onNavigate("Reports", { highlightReportId: "rep-3" })}
            tone="ghost"
          />
        </View>
      </AppCard>

      {successMessage ? (
        <AppCard>
          <Text style={[styles.successText, { color: theme.semantic.success }]}>{successMessage}</Text>
        </AppCard>
      ) : null}

      <AppCard>
        <Text style={[styles.title, { color: theme.semantic.textPrimary }]}>Прогресс групп и доходимость</Text>
        {dashboard.groupProgress.map((group) => (
          <View key={group.id} style={styles.blockRow}>
            <Text style={[styles.label, { color: theme.semantic.textPrimary }]}>{group.groupName}</Text>
            <ProgressBar
              value={group.completionRate}
              label={`Прогресс ${group.completionRate}% · score ${group.averageScore}/100 · риск ${group.riskCount}`}
            />
            <View style={styles.buttonRow}>
              <AppButton
                label="Открыть группу"
                onPress={() => setSheetState({ kind: "group", group })}
                tone="secondary"
              />
              <AppButton
                label="Сравнить группы"
                onPress={() => {
                  setComparisonEnabled((current) => !current);
                  setSheetState({
                    kind: "compare",
                    title: "Сравнение групп",
                    lines: dashboard.groupProgress.map(
                      (item) =>
                        `${item.groupName}: прогресс ${item.completionRate}%, score ${item.averageScore}, риск ${item.riskCount}`
                    )
                  });
                }}
                tone="ghost"
              />
            </View>
          </View>
        ))}
      </AppCard>

      <AppCard>
        <Text style={[styles.title, { color: theme.semantic.textPrimary }]}>Отчет по компетенциям учеников</Text>
        {dashboard.competencies.map((competency) => (
          <View key={competency.id} style={styles.blockRow}>
            <Text style={[styles.label, { color: theme.semantic.textPrimary }]}>{competency.name}</Text>
            <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>
              {competency.description}
            </Text>
            <StatusPill label={`Цель: ${competency.targetLevel}`} tone="neutral" />
          </View>
        ))}
      </AppCard>

      <AppCard>
        <Text style={[styles.title, { color: theme.semantic.textPrimary }]}>Динамика оценки по периодам</Text>
        {dashboard.scoreDynamics.map((point) => (
          <View key={point.id} style={styles.blockRow}>
            <Text style={[styles.label, { color: theme.semantic.textPrimary }]}>{point.label}</Text>
            <ProgressBar value={point.value} label={`Индекс периода ${point.value}/100`} />
          </View>
        ))}
      </AppCard>

      <AppCard>
        <Text style={[styles.title, { color: theme.semantic.textPrimary }]}>Треки развития и рекомендации по программам</Text>
        {dashboard.tracks.map((track: DevelopmentTrack) => {
          const assigned = assignedTrackIds.includes(track.id);

          return (
            <View key={track.id} style={styles.blockRow}>
              <Text style={[styles.label, { color: theme.semantic.textPrimary }]}>{track.title}</Text>
              <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>{track.summary}</Text>
              <AppButton
                label={assigned ? "Трек назначен" : "Назначить трек развития"}
                onPress={() => {
                  if (!assigned) {
                    setAssignedTrackIds((current) => [...current, track.id]);
                    setSuccessMessage(`Трек "${track.title}" назначен группе.`);
                  }
                }}
                tone="secondary"
              />
            </View>
          );
        })}
      </AppCard>

      <AppCard>
        <Text style={[styles.title, { color: theme.semantic.textPrimary }]}>Зоны риска по группам</Text>
        {dashboard.riskGroups.map((risk) => (
          <Text key={risk} style={[styles.listItem, { color: theme.semantic.textPrimary }]}>
            • {risk}
          </Text>
        ))}
        {dashboard.teamRecommendations.map((recommendation) => (
          <View key={recommendation.id} style={styles.blockRow}>
            <Text style={[styles.label, { color: theme.semantic.textPrimary }]}>{recommendation.title}</Text>
            <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>
              {recommendation.summary}
            </Text>
            <Text style={[styles.listItem, { color: theme.semantic.textPrimary }]}>
              • {recommendation.suggestedAction}
            </Text>
          </View>
        ))}
      </AppCard>

      <AppBottomSheet
        visible={sheetState !== null}
        title={
          sheetState?.kind === "group"
            ? sheetState.group.groupName
            : sheetState?.title ?? ""
        }
        description={
          sheetState?.kind === "group"
            ? "Детали группы, прогресса и текущего риска."
            : sheetState?.kind === "compare"
              ? comparisonEnabled
                ? "Сравнение включено."
                : "Сравнение скрыто."
              : "Mock export готов для дальнейшего backend-подключения."
        }
        onClose={() => setSheetState(null)}
      >
        {sheetState?.kind === "group" ? (
          <>
            <ProgressBar
              value={sheetState.group.completionRate}
              label={`Доходимость ${sheetState.group.completionRate}%`}
            />
            <Text style={[styles.body, { color: theme.semantic.textPrimary }]}>
              Средняя оценка: {sheetState.group.averageScore}/100
            </Text>
            <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>
              Активных симуляций: {sheetState.group.activeSimulations} · Рискованных участников: {sheetState.group.riskCount}
            </Text>
          </>
        ) : null}

        {sheetState?.kind === "compare" || sheetState?.kind === "export" ? (
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
  metricGrid: {
    gap: 12
  },
  wrapGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800"
  },
  label: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700"
  },
  body: {
    fontSize: 15,
    lineHeight: 22
  },
  listItem: {
    fontSize: 14,
    lineHeight: 20
  },
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
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
