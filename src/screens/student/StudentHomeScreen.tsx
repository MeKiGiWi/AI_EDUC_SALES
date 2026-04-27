import React, { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { RootStackParamList, RouteName } from "../../navigation/routes";
import type { FeedbackItem, LearningModule, StudentDashboard } from "../../types/academy";
import { DevelopmentPlanCard } from "../../components/student/DevelopmentPlanCard";
import { AppCard } from "../../components/ui/AppCard";
import { AppBottomSheet } from "../../components/ui/AppBottomSheet";
import { AppButton } from "../../components/ui/AppButton";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { StatusPill } from "../../components/ui/StatusPill";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import { useTheme } from "../../theme/useTheme";

interface StudentHomeScreenProps {
  dashboard: StudentDashboard;
  onNavigate: <T extends RouteName>(route: T, params?: RootStackParamList[T]) => void;
}

type StudentSheetState =
  | { kind: "module"; module: LearningModule }
  | { kind: "feedback"; feedback: FeedbackItem[] }
  | { kind: "plan"; title: string; description: string; items: string[] }
  | { kind: "export"; title: string; description: string; items: string[] }
  | null;

export function StudentHomeScreen({ dashboard, onNavigate }: StudentHomeScreenProps) {
  const theme = useTheme();
  const layout = useResponsiveLayout();
  const [sheetState, setSheetState] = useState<StudentSheetState>(null);
  const [plannedRecommendations, setPlannedRecommendations] = useState<string[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState(dashboard.modules[1]?.id ?? dashboard.modules[0]?.id ?? "");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedModule = useMemo(
    () => dashboard.modules.find((module) => module.id === selectedModuleId) ?? dashboard.modules[0],
    [dashboard.modules, selectedModuleId]
  );

  const openModuleSheet = (module: LearningModule) => {
    setSelectedModuleId(module.id);
    setSheetState({ kind: "module", module });
  };

  const addRecommendationToPlan = (recommendation: string) => {
    setPlannedRecommendations((current) =>
      current.includes(recommendation) ? current : [...current, recommendation]
    );
    setSuccessMessage("Рекомендация добавлена в персональный план.");
  };

  const sheetTitle =
    sheetState?.kind === "module"
      ? sheetState.module.title
      : sheetState?.kind === "feedback"
        ? "Обратная связь по последней практике"
        : sheetState?.title ?? "";

  const sheetDescription =
    sheetState?.kind === "module"
      ? sheetState.module.description
      : sheetState?.kind === "feedback"
        ? "Разбор сильных сторон, зоны роста и конкретных действий на следующую практику."
        : sheetState?.description ?? "";
  const moduleWidth = layout.isDesktop ? "48%" : "100%";

  return (
    <>
      <AppCard tone="mint">
        <StatusPill label={dashboard.level.currentLevel} tone="success" />
        <Text style={[styles.heroTitle, { color: theme.semantic.textPrimary }]}>
          Ближайшая практика: {dashboard.nearestPracticeTitle}
        </Text>
        <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>
          {dashboard.nearestPracticeDescription}
        </Text>
        <ProgressBar
          value={dashboard.level.progressToNextLevel}
          label={`До уровня "${dashboard.level.nextLevel}"`}
        />
        <View style={styles.buttonRow}>
          <AppButton
            label="Продолжить обучение"
            onPress={() => openModuleSheet(selectedModule)}
            tone="primary"
          />
          <AppButton
            label="Открыть тренажер"
            onPress={() =>
              onNavigate("Simulator", {
                scenarioId: dashboard.highlightedScenario.id
              })
            }
            tone="secondary"
          />
          <AppButton
            label="Объяснить материал"
            onPress={() =>
              onNavigate("KnowledgeBase", {
                categoryId: "sales_skills",
                materialId: "mat-4"
              })
            }
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
        <View style={styles.progressCardContent}>
          <View style={styles.progressHeader}>
            <View style={styles.flexBlock}>
              <Text style={[styles.cardTitle, { color: theme.semantic.textPrimary }]}>
                Текущий уровень и общий прогресс
              </Text>
              <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>
                {dashboard.level.levelDescription}
              </Text>
            </View>
            <Text style={[styles.progressPercent, { color: theme.semantic.textPrimary }]}>
              {dashboard.overallProgressPercent}%
            </Text>
          </View>
          <ProgressBar
            value={dashboard.overallProgressPercent}
            label="Общий прогресс обучения"
          />
          <Text style={[styles.meta, { color: theme.semantic.textMuted }]}>
            Команда: {dashboard.user.teamName} · Последняя активность: {dashboard.user.lastActiveAt}
          </Text>
        </View>
      </AppCard>

      <AppCard>
        <View style={styles.rowBetween}>
          <Text style={[styles.cardTitle, { color: theme.semantic.textPrimary }]}>Активные модули</Text>
          <StatusPill label={`${dashboard.modules.length} в работе`} tone="neutral" />
        </View>
        <View style={[styles.wrapGrid, styles.moduleGrid]}>
          {dashboard.modules.slice(0, 3).map((module) => (
            <View key={module.id} style={[styles.moduleRow, { width: moduleWidth }]}>
              <View style={styles.flexBlock}>
                <Text style={[styles.actionTitle, { color: theme.semantic.textPrimary }]}>{module.title}</Text>
                <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>{module.description}</Text>
                <ProgressBar value={module.completedPercent} label={module.nextStep} />
              </View>
              <AppButton
                label="Продолжить обучение"
                onPress={() => openModuleSheet(module)}
                tone="secondary"
              />
            </View>
          ))}
        </View>
      </AppCard>

      <AppCard>
        <Text style={[styles.cardTitle, { color: theme.semantic.textPrimary }]}>Последние оценки по компетенциям</Text>
        {dashboard.scores.map((score) => (
          <View key={score.competencyId} style={styles.scoreRow}>
            <View style={styles.flexBlock}>
              <Text style={[styles.actionTitle, { color: theme.semantic.textPrimary }]}>
                {score.competencyName}
              </Text>
              <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>
                {score.benchmarkLabel}
              </Text>
            </View>
            <StatusPill
              label={`${score.value}/100 · ${score.trend}`}
              tone={score.value >= 80 ? "success" : "warning"}
            />
          </View>
        ))}
        <View style={styles.textSection}>
          <Text style={[styles.sectionTitle, { color: theme.semantic.textPrimary }]}>Точки роста</Text>
          {dashboard.growthPoints.map((point) => (
            <Text key={point} style={[styles.listItem, { color: theme.semantic.textPrimary }]}>
              • {point}
            </Text>
          ))}
        </View>
        <View style={styles.buttonRow}>
          <AppButton
            label="Посмотреть обратную связь"
            onPress={() => setSheetState({ kind: "feedback", feedback: dashboard.feedback })}
            tone="primary"
          />
          <AppButton
            label="Объяснить материал"
            onPress={() =>
              onNavigate("KnowledgeBase", {
                categoryId: "assessment",
                materialId: "mat-5"
              })
            }
            tone="ghost"
          />
        </View>
      </AppCard>

      <DevelopmentPlanCard
        track={dashboard.developmentTrack}
        isAdded={plannedRecommendations.length > 0}
        onOpen={() =>
          setSheetState({
            kind: "plan",
            title: "Персональный план развития",
            description: "Здесь собраны текущий трек, этапы развития и рекомендации, которые уже выбраны для следующей практики.",
            items: [
              ...dashboard.developmentTrack.milestones,
              ...plannedRecommendations
            ]
          })
        }
        onAddToPlan={() => addRecommendationToPlan("Повторить сценарий про цену и зафиксировать новый шаблон ответа.")}
        onDownloadPlan={() =>
          setSheetState({
            kind: "export",
            title: "План развития подготовлен",
            description: "Ниже показаны блоки, которые войдут в личную выгрузку плана развития.",
            items: [
              `Уровень: ${dashboard.level.currentLevel}`,
              `Следующий уровень: ${dashboard.level.nextLevel}`,
              ...dashboard.developmentTrack.milestones,
              ...plannedRecommendations
            ]
          })
        }
      />

      <AppBottomSheet
        visible={sheetState !== null}
        title={sheetTitle}
        description={sheetDescription}
        onClose={() => setSheetState(null)}
      >
        {sheetState?.kind === "module" ? (
          <>
            <StatusPill label={sheetState.module.statusLabel} tone="success" />
            <Text style={[styles.body, { color: theme.semantic.textPrimary }]}>
              Длительность: {sheetState.module.durationMinutes} мин.
            </Text>
            <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>
              Следующий шаг: {sheetState.module.nextStep}
            </Text>
            <AppButton
              label="Начать тренировку"
              onPress={() => {
                setSheetState(null);
                onNavigate("Simulator");
              }}
              tone="primary"
            />
          </>
        ) : null}

        {sheetState?.kind === "feedback" ? (
          <>
            {sheetState.feedback.map((item) => (
              <View key={item.id} style={styles.feedbackRow}>
                <Text style={[styles.actionTitle, { color: theme.semantic.textPrimary }]}>{item.title}</Text>
                <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>{item.summary}</Text>
                <Text style={[styles.listItem, { color: theme.semantic.textPrimary }]}>
                  • {item.recommendedAction}
                </Text>
              </View>
            ))}
          </>
        ) : null}

        {sheetState?.kind === "plan" || sheetState?.kind === "export" ? (
          <>
            {sheetState.items.map((item) => (
              <Text key={item} style={[styles.listItem, { color: theme.semantic.textPrimary }]}>
                • {item}
              </Text>
            ))}
          </>
        ) : null}
      </AppBottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  heroTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800"
  },
  wrapGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  moduleGrid: {
    alignItems: "stretch"
  },
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
  progressCardContent: {
    gap: 12
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12
  },
  progressPercent: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "800"
  },
  cardTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800"
  },
  sectionTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700"
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
  moduleRow: {
    gap: 12
  },
  actionTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700"
  },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12
  },
  textSection: {
    gap: 8
  },
  listItem: {
    fontSize: 14,
    lineHeight: 20
  },
  successText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700"
  },
  feedbackRow: {
    gap: 8
  }
});
