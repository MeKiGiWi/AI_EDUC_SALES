import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { ChatBubble } from "../../components/simulator/ChatBubble";
import { CompetencyScoreCard } from "../../components/simulator/CompetencyScoreCard";
import { ScenarioPicker } from "../../components/simulator/ScenarioPicker";
import { AppBottomSheet } from "../../components/ui/AppBottomSheet";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { StatusPill } from "../../components/ui/StatusPill";
import { simulatorEvaluationByScenarioId } from "../../data/academyData";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import type { RootStackParamList, RouteName } from "../../navigation/routes";
import { useTheme } from "../../theme/useTheme";
import type { Scenario, ScenarioMessage, SimulatorEvaluation } from "../../types/academy";

interface SimulatorScreenProps {
  scenarios: Scenario[];
  activeScenarioId?: string;
  activeMaterialId?: string;
  onNavigate: <T extends RouteName>(route: T, params?: RootStackParamList[T]) => void;
}

type SimulatorSheetState =
  | { kind: "evaluation"; evaluation: SimulatorEvaluation }
  | { kind: "plan"; title: string; items: string[] }
  | null;

const difficultyOptions = ["Легкий", "Средний", "Сложный"] as const;

export function SimulatorScreen({
  scenarios,
  activeScenarioId,
  activeMaterialId,
  onNavigate
}: SimulatorScreenProps) {
  const theme = useTheme();
  const layout = useResponsiveLayout();
  const defaultScenarioId = activeScenarioId ?? scenarios[0]?.id ?? "";
  const [selectedScenarioId, setSelectedScenarioId] = useState(defaultScenarioId);
  const [messages, setMessages] = useState<ScenarioMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [difficulty, setDifficulty] = useState<(typeof difficultyOptions)[number]>("Средний");
  const [sheetState, setSheetState] = useState<SimulatorSheetState>(null);
  const [plannedRecommendations, setPlannedRecommendations] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedScenario = useMemo(
    () => scenarios.find((scenario) => scenario.id === selectedScenarioId) ?? scenarios[0],
    [scenarios, selectedScenarioId]
  );

  const evaluation = simulatorEvaluationByScenarioId[selectedScenario.id] ?? simulatorEvaluationByScenarioId["scn-1"];
  const learnerTurnCount = messages.filter((message) => message.speakerRole === "learner").length;

  useEffect(() => {
    setSelectedScenarioId(defaultScenarioId);
  }, [defaultScenarioId]);

  useEffect(() => {
    resetScenario(false);
  }, [selectedScenario.id]);

  function baseTranscript() {
    return selectedScenario.transcript.filter((message) => message.speakerRole !== "coach");
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
    setMessages(baseTranscript());
    setSuccessMessage(`Сценарий "${selectedScenario.title}" готов к практике.`);
  }

  function sendReply(text: string) {
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

  return (
    <>
      <SectionHeader
        eyebrow="Симулятор"
        title="Практика диалога"
        description="Выберите сценарий, проведите разговор, завершите упражнение и получите разбор по компетенциям уже после практики."
      />

      <ScenarioPicker
        scenarios={scenarios}
        selectedScenarioId={selectedScenario.id}
        onSelect={setSelectedScenarioId}
      />

      {successMessage ? (
        <AppCard>
          <Text style={[styles.successText, { color: theme.semantic.success }]}>{successMessage}</Text>
        </AppCard>
      ) : null}

      <View style={[styles.simulatorLayout, layout.isDesktop && styles.simulatorLayoutDesktop]}>
        <View style={styles.simulatorSidebar}>
          <AppCard tone="mint">
            <View style={styles.rowBetween}>
              <View style={styles.flexBlock}>
                <StatusPill label={`${difficulty} · ${selectedScenario.channel}`} tone="success" />
                <Text style={[styles.title, { color: theme.semantic.textPrimary }]}>{selectedScenario.title}</Text>
                <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>{selectedScenario.goal}</Text>
              </View>
              {activeMaterialId ? <StatusPill label={`Материал: ${activeMaterialId}`} tone="neutral" /> : null}
            </View>
            <View style={styles.buttonRow}>
              <AppButton label="Начать сценарий" onPress={startScenario} tone="primary" />
              <AppButton
                label="Сменить уровень сложности"
                onPress={() => {
                  const currentIndex = difficultyOptions.indexOf(difficulty);
                  setDifficulty(difficultyOptions[(currentIndex + 1) % difficultyOptions.length]);
                }}
                tone="secondary"
              />
              <AppButton
                label="Открыть базу знаний"
                onPress={() => onNavigate("KnowledgeBase", { materialId: activeMaterialId })}
                tone="ghost"
              />
            </View>
          </AppCard>

          <AppCard>
            <Text style={[styles.title, { color: theme.semantic.textPrimary }]}>Цель разговора</Text>
            <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>{selectedScenario.goal}</Text>
            {selectedScenario.targetCompetencies.map((competency) => (
              <Text key={competency} style={[styles.listItem, { color: theme.semantic.textPrimary }]}>
                • {competency}
              </Text>
            ))}
          </AppCard>

          <AppCard>
            <Text style={[styles.title, { color: theme.semantic.textPrimary }]}>Карточка клиента</Text>
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
          </AppCard>
        </View>

        <View style={styles.simulatorMain}>
          <AppCard>
            <Text style={[styles.title, { color: theme.semantic.textPrimary }]}>Диалог</Text>
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
              style={[
                styles.input,
                {
                  borderColor: theme.semantic.border,
                  backgroundColor: theme.semantic.cardSubtle,
                  color: theme.semantic.textPrimary
                }
              ]}
            />
            <View style={styles.buttonRow}>
              <AppButton label="Отправить" onPress={() => sendReply(draft)} tone="primary" />
              <AppButton
                label="Завершить и оценить"
                onPress={() => {
                  if (learnerTurnCount >= 2) {
                    setSheetState({ kind: "evaluation", evaluation });
                  } else {
                    setSuccessMessage("Сделайте еще минимум две реплики, чтобы получить оценку.");
                  }
                }}
                tone="secondary"
              />
              <AppButton label="Повторить сценарий" onPress={() => resetScenario(true)} tone="ghost" />
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
  simulatorLayout: {
    gap: 16
  },
  simulatorLayoutDesktop: {
    flexDirection: "row",
    alignItems: "flex-start"
  },
  simulatorSidebar: {
    flex: 0.9,
    gap: 16
  },
  simulatorMain: {
    flex: 1.2,
    gap: 16
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
