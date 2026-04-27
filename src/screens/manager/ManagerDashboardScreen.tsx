import React, { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { RootStackParamList, RouteName } from "../../navigation/routes";
import type {
  BestAnswerExample,
  DialogueTranscript,
  ManagerDashboard,
  TeamMember,
  TeamRecommendation
} from "../../types/academy";
import { AppBottomSheet } from "../../components/ui/AppBottomSheet";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { MetricCard } from "../../components/ui/MetricCard";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { StatusPill } from "../../components/ui/StatusPill";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import { useTheme } from "../../theme/useTheme";

interface ManagerDashboardScreenProps {
  dashboard: ManagerDashboard;
  onNavigate: <T extends RouteName>(route: T, params?: RootStackParamList[T]) => void;
}

type ManagerSheetState =
  | { kind: "profile"; member: TeamMember }
  | { kind: "dialogue"; transcript: DialogueTranscript }
  | { kind: "training"; member: TeamMember }
  | { kind: "export"; title: string; lines: string[] }
  | { kind: "best-answer"; example: BestAnswerExample }
  | null;

export function ManagerDashboardScreen({
  dashboard,
  onNavigate
}: ManagerDashboardScreenProps) {
  const theme = useTheme();
  const layout = useResponsiveLayout();
  const [focusOnlyRisk, setFocusOnlyRisk] = useState(false);
  const [sheetState, setSheetState] = useState<ManagerSheetState>(null);
  const [sentRecommendationIds, setSentRecommendationIds] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const visibleMembers = useMemo(
    () =>
      focusOnlyRisk
        ? dashboard.teamMembers.filter((member) => member.riskLabel !== "Низкий")
        : dashboard.teamMembers,
    [dashboard.teamMembers, focusOnlyRisk]
  );
  const metricWidth = layout.isWide ? "23.5%" : layout.isDesktop ? "31.5%" : layout.isTablet ? "48%" : "100%";
  const memberWidth = layout.isDesktop ? "48%" : "100%";

  return (
    <>
      <View style={[styles.metricGrid, (layout.isTablet || layout.isDesktop) && styles.wrapGrid]}>
        {dashboard.metrics.map((metric) => (
          <View key={metric.id} style={{ width: metricWidth }}>
            <MetricCard metric={metric} />
          </View>
        ))}
      </View>

      <AppCard tone="mint">
        <Text style={[styles.title, { color: theme.semantic.textPrimary }]}>
          Summary команды: {dashboard.teamSummary.groupName}
        </Text>
        <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>
          Средний прогресс {dashboard.teamSummary.completionRate}% · средняя оценка {dashboard.teamSummary.averageScore}/100 · в риске {dashboard.teamSummary.riskCount} · активных тренировок {dashboard.teamSummary.activeSimulations}
        </Text>
        <View style={styles.buttonRow}>
          <AppButton
            label="Назначить тренировку"
            onPress={() => setSheetState({ kind: "training", member: visibleMembers[0] ?? dashboard.teamMembers[0] })}
            tone="primary"
          />
          <AppButton
            label="Сформировать отчет"
            onPress={() => onNavigate("Reports", { highlightReportId: "rep-4" })}
            tone="secondary"
          />
          <AppButton
            label="Скачать PDF"
            onPress={() =>
              setSheetState({
                kind: "export",
                title: "Командный PDF подготовлен",
                lines: [
                  `Группа: ${dashboard.teamSummary.groupName}`,
                  `Средний прогресс: ${dashboard.teamSummary.completionRate}%`,
                  `Средняя оценка: ${dashboard.teamSummary.averageScore}/100`,
                  `Рискованные ученики: ${dashboard.teamSummary.riskCount}`
                ]
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
        <Text style={[styles.title, { color: theme.semantic.textPrimary }]}>Прогресс группы</Text>
        <ProgressBar
          value={dashboard.teamSummary.completionRate}
          label={`Средний прогресс по группе ${dashboard.teamSummary.groupName}`}
        />
        {dashboard.growthPoints.map((point) => (
          <Text key={point} style={[styles.listItem, { color: theme.semantic.textPrimary }]}>
            • {point}
          </Text>
        ))}
      </AppCard>

      <AppCard>
        <Text style={[styles.title, { color: theme.semantic.textPrimary }]}>Динамика по навыкам</Text>
        {dashboard.skillDynamics.map((skill) => (
          <View key={skill.id} style={styles.blockRow}>
            <Text style={[styles.label, { color: theme.semantic.textPrimary }]}>{skill.label}</Text>
            <ProgressBar
              value={skill.currentValue}
              label={`Текущее значение ${skill.currentValue}/100 · цель ${skill.targetValue}/100`}
            />
          </View>
        ))}
      </AppCard>

      <AppCard>
        <View style={styles.rowBetween}>
          <Text style={[styles.title, { color: theme.semantic.textPrimary }]}>Карточки сотрудников</Text>
          <AppButton
            label={focusOnlyRisk ? "Показать всех" : "Только риск"}
            onPress={() => setFocusOnlyRisk((current) => !current)}
            tone="ghost"
          />
        </View>
        <View style={[styles.wrapGrid, styles.memberGrid]}>
          {visibleMembers.map((member) => (
            <View key={member.id} style={{ width: memberWidth }}>
              <AppCard style={styles.innerCard}>
                <View style={styles.rowBetween}>
                  <View style={styles.flexBlock}>
                    <Text style={[styles.label, { color: theme.semantic.textPrimary }]}>{member.fullName}</Text>
                    <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>
                      {member.roleTitle} · Фокус: {member.focusArea}
                    </Text>
                  </View>
                  <StatusPill
                    label={`Риск: ${member.riskLabel}`}
                    tone={member.riskLabel === "Низкий" ? "success" : "warning"}
                  />
                </View>
                <ProgressBar
                  value={member.progressPercent}
                  label={`Последний score ${member.latestScore}/100`}
                />
                <View style={styles.buttonRow}>
                  <AppButton
                    label="Открыть профиль ученика"
                    onPress={() => setSheetState({ kind: "profile", member })}
                    tone="secondary"
                  />
                  <AppButton
                    label="Назначить тренировку"
                    onPress={() => setSheetState({ kind: "training", member })}
                    tone="ghost"
                  />
                </View>
              </AppCard>
            </View>
          ))}
        </View>
      </AppCard>

      <AppCard>
        <Text style={[styles.title, { color: theme.semantic.textPrimary }]}>Последние диалоги</Text>
        {dashboard.latestDialogues.map((dialogue) => (
          <View key={dialogue.id} style={styles.blockRow}>
            <Text style={[styles.label, { color: theme.semantic.textPrimary }]}>
              {dialogue.learnerName} · {dialogue.scenarioTitle}
            </Text>
            <Text style={[styles.meta, { color: theme.semantic.textMuted }]}>{dialogue.updatedAt}</Text>
            <AppButton
              label="Посмотреть диалог"
              onPress={() => setSheetState({ kind: "dialogue", transcript: dialogue })}
              tone="secondary"
            />
          </View>
        ))}
      </AppCard>

      <AppCard>
        <Text style={[styles.title, { color: theme.semantic.textPrimary }]}>Примеры лучших ответов</Text>
        {dashboard.bestAnswers.map((example) => (
          <View key={example.id} style={styles.blockRow}>
            <Text style={[styles.label, { color: theme.semantic.textPrimary }]}>
              {example.learnerName} · {example.scenarioTitle}
            </Text>
            <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>
              {example.answerText}
            </Text>
            <AppButton
              label="Открыть пример"
              onPress={() => setSheetState({ kind: "best-answer", example })}
              tone="ghost"
            />
          </View>
        ))}
      </AppCard>

      <AppCard>
        <Text style={[styles.title, { color: theme.semantic.textPrimary }]}>Рекомендации руководителю</Text>
        {dashboard.recommendations.map((recommendation) => {
          const sent = sentRecommendationIds.includes(recommendation.id);

          return (
            <View key={recommendation.id} style={styles.blockRow}>
              <Text style={[styles.label, { color: theme.semantic.textPrimary }]}>{recommendation.title}</Text>
              <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>
                {recommendation.summary}
              </Text>
              <Text style={[styles.listItem, { color: theme.semantic.textPrimary }]}>
                • {recommendation.suggestedAction}
              </Text>
              <AppButton
                label={sent ? "Отправлено" : "Отправить рекомендацию"}
                onPress={() => {
                  if (!sent) {
                    setSentRecommendationIds((current) => [...current, recommendation.id]);
                    setSuccessMessage(`Рекомендация "${recommendation.title}" отправлена команде.`);
                  }
                }}
                tone="secondary"
              />
            </View>
          );
        })}
      </AppCard>

      <AppBottomSheet
        visible={sheetState !== null}
        title={
          sheetState?.kind === "profile"
            ? sheetState.member.fullName
            : sheetState?.kind === "dialogue"
              ? `${sheetState.transcript.learnerName}: диалог`
              : sheetState?.kind === "training"
                ? "Назначить тренировку"
                : sheetState?.kind === "best-answer"
                  ? "Лучший ответ"
                  : sheetState?.title ?? ""
        }
        description={
          sheetState?.kind === "profile"
            ? "Профиль ученика и ближайший фокус развития."
            : sheetState?.kind === "dialogue"
              ? sheetState.transcript.scenarioTitle
              : sheetState?.kind === "training"
                ? "Подтверждение назначения тренировки для сотрудника."
                : sheetState?.kind === "best-answer"
                  ? sheetState.example.scenarioTitle
                  : "Командная выгрузка подготовлена."
        }
        onClose={() => setSheetState(null)}
      >
        {sheetState?.kind === "profile" ? (
          <>
            <StatusPill
              label={`Риск: ${sheetState.member.riskLabel}`}
              tone={sheetState.member.riskLabel === "Низкий" ? "success" : "warning"}
            />
            <Text style={[styles.body, { color: theme.semantic.textPrimary }]}>
              Роль: {sheetState.member.roleTitle}
            </Text>
            <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>
              Фокус: {sheetState.member.focusArea}
            </Text>
            <ProgressBar
              value={sheetState.member.progressPercent}
              label={`Прогресс ${sheetState.member.progressPercent}% · score ${sheetState.member.latestScore}/100`}
            />
          </>
        ) : null}

        {sheetState?.kind === "dialogue" ? (
          <>
            {sheetState.transcript.messages.map((message) => (
              <Text key={message.id} style={[styles.listItem, { color: theme.semantic.textPrimary }]}>
                • {message.speakerName}: {message.text}
              </Text>
            ))}
          </>
        ) : null}

        {sheetState?.kind === "training" ? (
          <>
            <Text style={[styles.body, { color: theme.semantic.textPrimary }]}>
              Ученик: {sheetState.member.fullName}
            </Text>
            <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>
              Тема: {sheetState.member.focusArea}
            </Text>
            <AppButton
              label="Подтвердить назначение"
              onPress={() => {
                setSuccessMessage(`Тренировка назначена для ${sheetState.member.fullName}.`);
                setSheetState(null);
              }}
              tone="primary"
              fullWidth
            />
          </>
        ) : null}

        {sheetState?.kind === "best-answer" ? (
          <>
            <Text style={[styles.body, { color: theme.semantic.textPrimary }]}>
              {sheetState.example.answerText}
            </Text>
            <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>
              {sheetState.example.whyItWorks}
            </Text>
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
  meta: {
    fontSize: 12,
    fontWeight: "600"
  },
  listItem: {
    fontSize: 14,
    lineHeight: 20
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
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  blockRow: {
    gap: 8
  },
  innerCard: {
    padding: 14
  },
  memberGrid: {
    alignItems: "stretch"
  },
  successText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700"
  }
});
