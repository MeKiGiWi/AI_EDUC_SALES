import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { ChatBubble } from "../../components/simulator/ChatBubble";
import { CompetencyScoreCard } from "../../components/simulator/CompetencyScoreCard";
import { ScenarioPicker } from "../../components/simulator/ScenarioPicker";
import { AppBottomSheet } from "../../components/ui/AppBottomSheet";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { StatusPill } from "../../components/ui/StatusPill";
import { simulatorEvaluationByScenarioId } from "../../data/academyData";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import { useTheme } from "../../theme/useTheme";
import type { LearningModule, Scenario, ScenarioMessage, SimulatorEvaluation } from "../../types/academy";

interface SimulatorScreenProps {
  modules: LearningModule[];
  scenarios: Scenario[];
  activeScenarioId?: string;
  activeMaterialId?: string;
  onOpenMaterial: (materialId?: string) => void;
}

type SimulatorSheetState =
  | { kind: "evaluation"; evaluation: SimulatorEvaluation }
  | { kind: "plan"; title: string; items: string[] }
  | null;

const difficultyOptions = ["Легкий", "Средний", "Сложный"] as const;

export function SimulatorScreen({
  modules,
  scenarios,
  activeScenarioId,
  activeMaterialId,
  onOpenMaterial
}: SimulatorScreenProps) {
  const theme = useTheme();
  const layout = useResponsiveLayout();
  const initialScenario = useMemo(
    () => scenarios.find((scenario) => scenario.id === activeScenarioId),
    [activeScenarioId, scenarios]
  );
  const fallbackModuleId = initialScenario?.moduleId ?? modules[0]?.id ?? scenarios[0]?.moduleId ?? "";
  const [selectedModuleId, setSelectedModuleId] = useState(fallbackModuleId);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | undefined>(
    initialScenario?.id ?? scenarios.find((scenario) => scenario.moduleId === fallbackModuleId)?.id
  );
  const [messages, setMessages] = useState<ScenarioMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [difficulty, setDifficulty] = useState<(typeof difficultyOptions)[number]>("Средний");
  const [sheetState, setSheetState] = useState<SimulatorSheetState>(null);
  const [plannedRecommendations, setPlannedRecommendations] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedModule = useMemo(
    () => modules.find((module) => module.id === selectedModuleId) ?? modules[0],
    [modules, selectedModuleId]
  );
  const visibleScenarios = useMemo(
    () => scenarios.filter((scenario) => scenario.moduleId === selectedModuleId),
    [scenarios, selectedModuleId]
  );
  const selectedScenario = useMemo(
    () => visibleScenarios.find((scenario) => scenario.id === selectedScenarioId) ?? visibleScenarios[0],
    [visibleScenarios, selectedScenarioId]
  );

  const evaluation = selectedScenario
    ? simulatorEvaluationByScenarioId[selectedScenario.id] ?? simulatorEvaluationByScenarioId["scn-1"]
    : undefined;
  const learnerTurnCount = messages.filter((message) => message.speakerRole === "learner").length;

  useEffect(() => {
    if (initialScenario) {
      setSelectedModuleId(initialScenario.moduleId);
      setSelectedScenarioId(initialScenario.id);
      return;
    }

    setSelectedModuleId((current) => {
      if (current && modules.some((module) => module.id === current)) {
        return current;
      }

      return fallbackModuleId;
    });
  }, [fallbackModuleId, initialScenario, modules]);

  useEffect(() => {
    if (!selectedModuleId) {
      setSelectedScenarioId(undefined);
      return;
    }

    const firstScenarioId = scenarios.find((scenario) => scenario.moduleId === selectedModuleId)?.id;
    setSelectedScenarioId((current) =>
      current && scenarios.some((scenario) => scenario.moduleId === selectedModuleId && scenario.id === current)
        ? current
        : firstScenarioId
    );
  }, [scenarios, selectedModuleId]);

  useEffect(() => {
    if (selectedScenario) {
      resetScenario(false);
      return;
    }

    setMessages([]);
    setDraft("");
    setSheetState(null);
  }, [selectedScenario?.id]);

  function baseTranscript() {
    return selectedScenario?.transcript.filter((message) => message.speakerRole !== "coach") ?? [];
  }

  function resetScenario(clearSuccess: boolean) {
    setMessages(baseTranscript());
    setDraft("");
    setSheetState(null);
    if (clearSuccess) {
      setSuccessMessage(null);
    }
  }

  function startScenario() {
    if (!selectedScenario) {
      setSuccessMessage("Сначала выберите сценарий внутри модуля.");
      return;
    }

    setMessages(baseTranscript());
    setSuccessMessage(`Сценарий "${selectedScenario.title}" готов к тренировке.`);
  }

  function sendReply(text: string) {
    if (!selectedScenario) {
      setSuccessMessage("Выберите сценарий, прежде чем отправлять реплику.");
      return;
    }

    const trimmedText = text.trim();
    if (!trimmedText) {
      setSuccessMessage("Сначала добавьте свою реплику.");
      return;
    }

    const baseIndex = learnerTurnCount;
    const learnerMessage: ScenarioMessage = {
      id: `learner-${selectedScenario.id}-${Date.now()}`,
      speakerName: "Вы",
      speakerRole: "learner",
      text: trimmedText,
      timestampLabel: `00:${20 + baseIndex * 12}`
    };
    const customerReplyText =
      selectedScenario.customerReplies[
        Math.min(baseIndex, selectedScenario.customerReplies.length - 1)
      ] ?? "Клиент просит конкретнее объяснить эффект и следующий шаг.";
    const customerMessage: ScenarioMessage = {
      id: `customer-${selectedScenario.id}-${Date.now() + 1}`,
      speakerName: selectedScenario.persona.name,
      speakerRole: "customer",
      text: customerReplyText,
      timestampLabel: `00:${26 + baseIndex * 12}`
    };

    setMessages((current) => [...current, learnerMessage, customerMessage]);
    setDraft("");
    setSuccessMessage("Реплика отправлена.");
  }

  function addEvaluationToPlan() {
    if (!evaluation) {
      return;
    }

    setPlannedRecommendations((current) => {
      const merged = [...current];

      evaluation.recommendations.forEach((item) => {
        if (!merged.includes(item)) {
          merged.push(item);
        }
      });

      return merged;
    });
    setSuccessMessage("Рекомендации из оценки добавлены в план развития.");
    setSheetState({
      kind: "plan",
      title: "Рекомендации добавлены",
      items: evaluation.recommendations
    });
  }

  function handleSelectModule(moduleId: string) {
    setSelectedModuleId(moduleId);
    setSuccessMessage(null);
  }

  return (
    <>
      <AppCard tone="mint">
        <View style={styles.rowBetween}>
          <View style={styles.flexBlock}>
            <StatusPill label={selectedModule?.statusLabel ?? "Тренажер"} tone="success" />
            <Text style={[styles.heroTitle, { color: theme.semantic.textPrimary }]}>Тренажер</Text>
            <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>
              Выберите модуль, затем сценарий и проведите практику диалога с разбором по компетенциям сразу после тренировки.
            </Text>
          </View>
          {activeMaterialId ? <StatusPill label={`Материал: ${activeMaterialId}`} tone="neutral" /> : null}
        </View>
      </AppCard>

      <ScenarioPicker
        modules={modules}
        scenarios={scenarios}
        selectedModuleId={selectedModuleId}
        selectedScenarioId={selectedScenarioId}
        onSelectModule={handleSelectModule}
        onSelectScenario={setSelectedScenarioId}
      />

      {successMessage ? (
        <AppCard>
          <Text style={[styles.successText, { color: theme.semantic.success }]}>{successMessage}</Text>
        </AppCard>
      ) : null}

      <View style={styles.trainerContent}>
        <View style={[styles.trainerInfoGrid, layout.isDesktop && styles.trainerInfoGridDesktop]}>
          <AppCard style={layout.isDesktop && styles.infoCard}>
            <View style={styles.flexBlock}>
              <Text style={[styles.title, { color: theme.semantic.textPrimary }]}>Практика диалога</Text>
              <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>
                {selectedScenario
                  ? selectedScenario.title
                  : "Сначала выберите модуль. Для модуля без сценариев тренировки появятся позже."}
              </Text>
              {selectedScenario ? (
                <>
                  <StatusPill label={`${difficulty} · ${selectedScenario.channel}`} tone="success" />
                  <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>
                    {selectedScenario.openingMessage}
                  </Text>
                </>
              ) : null}
            </View>
            <View style={styles.buttonRow}>
              <AppButton
                label="Начать сценарий"
                onPress={startScenario}
                tone="primary"
                disabled={!selectedScenario}
              />
              <AppButton
                label="Сменить уровень сложности"
                onPress={() => {
                  const currentIndex = difficultyOptions.indexOf(difficulty);
                  setDifficulty(difficultyOptions[(currentIndex + 1) % difficultyOptions.length]);
                }}
                tone="secondary"
                disabled={!selectedScenario}
              />
              <AppButton
                label="Открыть базу знаний"
                onPress={() => onOpenMaterial(activeMaterialId)}
                tone="ghost"
              />
            </View>
          </AppCard>

          <AppCard style={layout.isDesktop && styles.infoCard}>
            <Text style={[styles.title, { color: theme.semantic.textPrimary }]}>Цель и фокус тренировки</Text>
            {selectedScenario ? (
              <>
                <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>{selectedScenario.goal}</Text>
                <Text style={[styles.metaLabel, { color: theme.semantic.textMuted }]}>Компетенции в фокусе</Text>
                {selectedScenario.targetCompetencies.map((competency) => (
                  <Text key={competency} style={[styles.listItem, { color: theme.semantic.textPrimary }]}>
                    • {competency}
                  </Text>
                ))}
                <Text style={[styles.metaLabel, { color: theme.semantic.textMuted }]}>Что держать в разговоре</Text>
                {selectedScenario.suggestedActions.map((action) => (
                  <Text key={action} style={[styles.listItem, { color: theme.semantic.textPrimary }]}>
                    • {action}
                  </Text>
                ))}
              </>
            ) : (
              <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>
                Для этого модуля сценарии скоро появятся. Пока можно открыть другой модуль и продолжить тренировку там.
              </Text>
            )}
          </AppCard>

          <AppCard style={layout.isDesktop && styles.infoCard}>
            <Text style={[styles.title, { color: theme.semantic.textPrimary }]}>Клиент и контекст</Text>
            {selectedScenario ? (
              <>
                <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>
                  {selectedScenario.persona.name}, {selectedScenario.persona.roleTitle} в {selectedScenario.persona.company}
                </Text>
                <Text style={[styles.body, { color: theme.semantic.textPrimary }]}>
                  Настрой: {selectedScenario.persona.mood}
                </Text>
                <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>
                  Стиль возражения: {selectedScenario.persona.objectionStyle}
                </Text>
                {selectedScenario.persona.painPoints.map((painPoint) => (
                  <Text key={painPoint} style={[styles.listItem, { color: theme.semantic.textPrimary }]}>
                    • {painPoint}
                  </Text>
                ))}
              </>
            ) : (
              <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>
                Клиентская персона появится, когда для выбранного модуля станет доступен сценарий.
              </Text>
            )}
          </AppCard>
        </View>

        <AppCard style={styles.dialogFullWidth}>
          <Text style={[styles.title, { color: theme.semantic.textPrimary }]}>Диалог</Text>
          {selectedScenario ? (
            <>
              <View style={styles.chatArea}>
                {messages.map((message) => (
                  <ChatBubble key={message.id} message={message} />
                ))}
              </View>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="Введите ваш ответ клиенту"
                placeholderTextColor={theme.semantic.textMuted}
                multiline
                editable={Boolean(selectedScenario)}
                style={[
                  styles.input,
                  {
                    borderColor: theme.semantic.border,
                    backgroundColor: theme.semantic.cardSubtle,
                    color: theme.semantic.textPrimary
                  }
                ]}
              />
            </>
          ) : (
            <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>
              Для этого модуля сценарии скоро появятся. Выберите другой модуль, чтобы открыть диалоговую тренировку.
            </Text>
          )}
          <View style={styles.buttonRow}>
            <AppButton label="Отправить" onPress={() => sendReply(draft)} tone="primary" disabled={!selectedScenario} />
            <AppButton
              label="Завершить и оценить"
              onPress={() => {
                if (!selectedScenario || !evaluation) {
                  return;
                }

                if (learnerTurnCount >= 2) {
                  setSheetState({ kind: "evaluation", evaluation });
                } else {
                  setSuccessMessage("Сделайте еще минимум две реплики, чтобы получить оценку.");
                }
              }}
              tone="secondary"
              disabled={!selectedScenario}
            />
            <AppButton
              label="Повторить сценарий"
              onPress={() => resetScenario(true)}
              tone="ghost"
              disabled={!selectedScenario}
            />
          </View>
        </AppCard>

        {plannedRecommendations.length > 0 ? (
          <AppCard>
            <Text style={[styles.title, { color: theme.semantic.textPrimary }]}>Уже добавлено в план</Text>
            {plannedRecommendations.map((item) => (
              <Text key={item} style={[styles.listItem, { color: theme.semantic.textPrimary }]}>
                • {item}
              </Text>
            ))}
          </AppCard>
        ) : null}
      </View>

      <AppBottomSheet
        visible={sheetState !== null}
        title={sheetState?.kind === "evaluation" ? "Итоговая оценка" : sheetState?.title ?? ""}
        description={
          sheetState?.kind === "evaluation"
            ? `Оценка: ${sheetState.evaluation.overallScore}/100. Ниже разбивка по компетенциям и рекомендации для следующей практики.`
            : "Рекомендации уже можно использовать в личном плане развития."
        }
        onClose={() => setSheetState(null)}
      >
        {sheetState?.kind === "evaluation" ? (
          <>
            {sheetState.evaluation.competencyScores.map((score) => (
              <CompetencyScoreCard key={score.id} score={score} />
            ))}
            <Text style={[styles.title, { color: theme.semantic.textPrimary }]}>Что улучшить</Text>
            {sheetState.evaluation.whatToImprove.map((item) => (
              <Text key={item} style={[styles.listItem, { color: theme.semantic.textPrimary }]}>
                • {item}
              </Text>
            ))}
            <Text style={[styles.title, { color: theme.semantic.textPrimary }]}>Пример сильного ответа</Text>
            <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>
              {sheetState.evaluation.strongAnswerExample}
            </Text>
            <Text style={[styles.title, { color: theme.semantic.textPrimary }]}>Рекомендации</Text>
            {sheetState.evaluation.recommendations.map((item) => (
              <Text key={item} style={[styles.listItem, { color: theme.semantic.textPrimary }]}>
                • {item}
              </Text>
            ))}
            <AppButton label="Добавить рекомендации в план" onPress={addEvaluationToPlan} tone="primary" fullWidth />
          </>
        ) : null}

        {sheetState?.kind === "plan" ? (
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
  trainerContent: {
    gap: 16
  },
  trainerInfoGrid: {
    gap: 16
  },
  trainerInfoGridDesktop: {
    flexDirection: "row",
    flexWrap: "wrap"
  },
  infoCard: {
    width: "48%"
  },
  dialogFullWidth: {
    width: "100%"
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
  heroTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800"
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
  metaLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700"
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
  chatArea: {
    gap: 12
  },
  input: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 120,
    textAlignVertical: "top",
    fontSize: 15,
    lineHeight: 20
  },
  successText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700"
  }
});
