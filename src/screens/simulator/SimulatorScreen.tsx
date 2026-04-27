import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { ChatBubble } from "../../components/simulator/ChatBubble";
import { ScenarioPicker } from "../../components/simulator/ScenarioPicker";
import { AppBottomSheet } from "../../components/ui/AppBottomSheet";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { simulatorEvaluationByScenarioId } from "../../data/academyData";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import { simulatorApiService } from "../../services/simulatorApiService";
import { useTheme } from "../../theme/useTheme";
import type {
  LearningModule,
  Scenario,
  ScenarioMessage,
  SimulatorApiMessageDto,
  SimulatorEvaluation,
  SimulatorPublicScenarioDto,
  SimulatorReportPayloadDto
} from "../../types/academy";

interface SimulatorScreenProps {
  modules: LearningModule[];
  scenarios: Scenario[];
  activeScenarioId?: string;
  activeMaterialId?: string;
  onOpenMaterial: (materialId?: string) => void;
}

type SimulatorSheetState =
  | { kind: "report"; reportJson: string }
  | null;

const difficultyOptions = ["Легкий", "Средний", "Сложный"] as const;
const backendDifficultyMap: Record<(typeof difficultyOptions)[number], string> = {
  "Легкий": "easy",
  "Средний": "medium",
  "Сложный": "hard"
};

export function SimulatorScreen({
  modules,
  scenarios,
  activeScenarioId,
  activeMaterialId,
  onOpenMaterial
}: SimulatorScreenProps) {
  const theme = useTheme();
  const layout = useResponsiveLayout();
  const apiEnabled = simulatorApiService.isEnabled();
  const [apiScenarios, setApiScenarios] = useState<Scenario[]>([]);
  const catalogScenarios = apiEnabled && apiScenarios.length > 0 ? apiScenarios : scenarios;
  const initialScenario = useMemo(
    () => catalogScenarios.find((scenario) => scenario.id === activeScenarioId) ?? catalogScenarios[0],
    [activeScenarioId, catalogScenarios]
  );
  const fallbackModuleId = initialScenario?.moduleId ?? modules[0]?.id ?? catalogScenarios[0]?.moduleId ?? "";
  const [selectedModuleId, setSelectedModuleId] = useState(fallbackModuleId);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | undefined>(
    initialScenario?.id ?? catalogScenarios.find((scenario) => scenario.moduleId === fallbackModuleId)?.id
  );
  const [messages, setMessages] = useState<ScenarioMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [difficulty, setDifficulty] = useState<(typeof difficultyOptions)[number]>("Средний");
  const [sheetState, setSheetState] = useState<SimulatorSheetState>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [managerTurnCount, setManagerTurnCount] = useState(0);
  const [minManagerTurns, setMinManagerTurns] = useState(2);
  const [canFinish, setCanFinish] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  const visibleScenarios = useMemo(
    () => catalogScenarios.filter((scenario) => scenario.moduleId === selectedModuleId),
    [catalogScenarios, selectedModuleId]
  );
  const selectedScenario = useMemo(
    () => visibleScenarios.find((scenario) => scenario.id === selectedScenarioId) ?? visibleScenarios[0],
    [visibleScenarios, selectedScenarioId]
  );
  const scenarioContextLines = useMemo(() => {
    if (!selectedScenario) {
      return [];
    }

    const personaSummary = [
      selectedScenario.persona.name,
      selectedScenario.persona.roleTitle
    ].filter(Boolean).join(", ");
    const companyLabel = selectedScenario.persona.company
      ? `${personaSummary}${personaSummary ? " в " : ""}${selectedScenario.persona.company}.`
      : personaSummary
        ? `${personaSummary}.`
        : "";
    const painPointsLabel = selectedScenario.persona.painPoints.length > 0
      ? `Сейчас в фокусе: ${selectedScenario.persona.painPoints.join(", ")}.`
      : "";
    const moodLabel = selectedScenario.persona.mood ? `Настрой: ${selectedScenario.persona.mood}.` : "";
    const objectionStyleLabel = selectedScenario.persona.objectionStyle
      ? `Стиль реакции: ${selectedScenario.persona.objectionStyle}.`
      : "";

    return [companyLabel, painPointsLabel, moodLabel, objectionStyleLabel].filter(Boolean);
  }, [selectedScenario]);

  const evaluation = selectedScenario && !apiEnabled
    ? simulatorEvaluationByScenarioId[selectedScenario.id] ?? simulatorEvaluationByScenarioId["scn-1"]
    : undefined;
  const learnerTurnCount = messages.filter((message) => message.speakerRole === "learner").length;

  useEffect(() => {
    let isMounted = true;

    async function loadApiScenarios() {
      if (!apiEnabled) {
        return;
      }

      try {
        const items = await simulatorApiService.fetchSimulatorScenarios();
        if (!isMounted) {
          return;
        }
        const defaultModuleId = modules[0]?.id ?? "mod-simulator-api";
        setApiScenarios(items.map((item) => mapApiScenarioToScenario(item, defaultModuleId)));
      } catch (_error) {
        if (!isMounted) {
          return;
        }
        setSuccessMessage("Backend симулятора недоступен. Используем локальный mock-режим.");
        setApiScenarios([]);
      }
    }

    loadApiScenarios();

    return () => {
      isMounted = false;
    };
  }, [apiEnabled, modules]);

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

    const firstScenarioId = catalogScenarios.find((scenario) => scenario.moduleId === selectedModuleId)?.id;
    setSelectedScenarioId((current) =>
      current &&
      catalogScenarios.some((scenario) => scenario.moduleId === selectedModuleId && scenario.id === current)
        ? current
        : firstScenarioId
    );
  }, [catalogScenarios, selectedModuleId]);

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
    if (apiEnabled) {
      return [];
    }
    return selectedScenario?.transcript.filter((message) => message.speakerRole !== "coach") ?? [];
  }

  function resetScenario(clearSuccess: boolean) {
    setMessages(baseTranscript());
    setDraft("");
    setSheetState(null);
    setSessionId(null);
    setManagerTurnCount(0);
    setCanFinish(false);
    setMinManagerTurns(apiEnabled ? 10 : 2);
    if (clearSuccess) {
      setSuccessMessage(null);
    }
  }

  async function startScenario() {
    if (!selectedScenario) {
      setSuccessMessage("Сначала выберите сценарий внутри модуля.");
      return;
    }

    if (!apiEnabled) {
      setMessages(baseTranscript());
      setSuccessMessage(`Сценарий "${selectedScenario.title}" готов к тренировке.`);
      return;
    }

    try {
      setIsBusy(true);
      const response = await simulatorApiService.startDialogueSession(
        selectedScenario.id,
        backendDifficultyMap[difficulty]
      );
      setSessionId(response.session_id);
      setMessages([mapApiMessageToChatMessage(response.message, selectedScenario)]);
      setManagerTurnCount(response.manager_turn_count);
      setMinManagerTurns(response.min_manager_turns);
      setCanFinish(response.can_finish);
      setDraft("");
      setSuccessMessage(`Сценарий "${selectedScenario.title}" запущен.`);
    } catch (_error) {
      setSuccessMessage("Не удалось запустить сценарий через backend.");
    } finally {
      setIsBusy(false);
    }
  }

  async function sendReply(text: string) {
    if (!selectedScenario) {
      setSuccessMessage("Выберите сценарий, прежде чем отправлять реплику.");
      return;
    }

    const trimmedText = text.trim();
    if (!trimmedText) {
      setSuccessMessage("Сначала добавьте свою реплику.");
      return;
    }

    if (apiEnabled) {
      if (!sessionId) {
        setSuccessMessage("Сначала запустите сценарий.");
        return;
      }

      try {
        setIsBusy(true);
        const response = await simulatorApiService.sendDialogueMessage(sessionId, trimmedText);
        setMessages((current) => [
          ...current,
          ...response.messages.map((message) => mapApiMessageToChatMessage(message, selectedScenario))
        ]);
        setManagerTurnCount(response.manager_turn_count);
        setMinManagerTurns(response.min_manager_turns);
        setCanFinish(response.can_finish);
        setDraft("");
        setSuccessMessage("Реплика отправлена.");
      } catch (_error) {
        setSuccessMessage("Не удалось отправить реплику в backend.");
      } finally {
        setIsBusy(false);
      }
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

  async function finishScenario() {
    if (!selectedScenario) {
      return;
    }

    if (apiEnabled) {
      if (!sessionId) {
        setSuccessMessage("Сначала запустите сценарий.");
        return;
      }

      try {
        setIsBusy(true);
        const response = await simulatorApiService.finishDialogueSession(sessionId);
        if (response.status === "needs_more_dialogue") {
          setManagerTurnCount(response.manager_turn_count);
          setMinManagerTurns(response.min_manager_turns);
          setCanFinish(false);
          setSuccessMessage(response.message);
          return;
        }

        setSheetState({
          kind: "report",
          reportJson: JSON.stringify(response.report, null, 2)
        });
        setSuccessMessage("Отчет получен из backend.");
      } catch (_error) {
        setSuccessMessage("Не удалось завершить сценарий через backend.");
      } finally {
        setIsBusy(false);
      }
      return;
    }

    if (!evaluation) {
      return;
    }

    if (learnerTurnCount >= 2) {
      setSheetState({
        kind: "report",
        reportJson: JSON.stringify(buildMockReportPayload(selectedScenario, evaluation), null, 2)
      });
      setSuccessMessage("Mock-отчет сформирован.");
    } else {
      setSuccessMessage("Сделайте еще минимум две реплики, чтобы получить отчет.");
    }
  }

  function handleSelectModule(moduleId: string) {
    setSelectedModuleId(moduleId);
    setSuccessMessage(null);
  }

  return (
    <>
      <ScenarioPicker
        modules={modules}
        scenarios={catalogScenarios}
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
              {activeMaterialId ? (
                <Text style={[styles.meta, { color: theme.semantic.textMuted }]}>Материал: {activeMaterialId}</Text>
              ) : null}
              {selectedScenario ? (
                <>
                  <Text style={[styles.meta, { color: theme.semantic.textMuted }]}>
                    {difficulty} · {selectedScenario.channel}
                  </Text>
                  <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>{selectedScenario.goal}</Text>
                </>
              ) : null}
            </View>
            <View style={styles.buttonRow}>
              <AppButton
                label="Начать сценарий"
                onPress={startScenario}
                tone="primary"
                disabled={!selectedScenario || isBusy}
              />
              <AppButton
                label="Сменить уровень сложности"
                onPress={() => {
                  const currentIndex = difficultyOptions.indexOf(difficulty);
                  setDifficulty(difficultyOptions[(currentIndex + 1) % difficultyOptions.length]);
                }}
                tone="secondary"
                disabled={!selectedScenario || isBusy}
              />
              <AppButton
                label="Открыть базу знаний"
                onPress={() => onOpenMaterial(activeMaterialId)}
                tone="ghost"
              />
            </View>
          </AppCard>

          <AppCard style={layout.isDesktop && styles.infoCard}>
            <Text style={[styles.title, { color: theme.semantic.textPrimary }]}>Цель тренировки</Text>
            {selectedScenario ? (
              <>
                <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>{selectedScenario.goal}</Text>
                <Text style={[styles.metaLabel, { color: theme.semantic.textMuted }]}>Роль клиента</Text>
                <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>
                  {selectedScenario.persona.roleTitle || "Клиент B2B"}
                </Text>
              </>
            ) : (
              <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>
                Для этого модуля сценарии скоро появятся. Пока можно открыть другой модуль и продолжить тренировку там.
              </Text>
            )}
          </AppCard>

        </View>

        <AppCard style={styles.dialogFullWidth}>
          <Text style={[styles.title, { color: theme.semantic.textPrimary }]}>Диалог</Text>
          {selectedScenario ? (
            <>
              <View style={styles.chatArea}>
                <View style={styles.contextMessageWrapper}>
                  <View
                    style={[
                      styles.contextMessageBubble,
                      {
                        backgroundColor: theme.semantic.cardAccent,
                        borderColor: theme.semantic.border,
                        borderRadius: theme.radius.lg
                      }
                    ]}
                  >
                    <Text style={[styles.contextTitle, { color: theme.semantic.textPrimary }]}>Клиент и контекст</Text>
                    {scenarioContextLines.length > 0 ? (
                      scenarioContextLines.map((line) => (
                        <Text key={line} style={[styles.text, { color: theme.semantic.textSecondary }]}>
                          {line}
                        </Text>
                      ))
                    ) : (
                      <Text style={[styles.text, { color: theme.semantic.textSecondary }]}>
                        {selectedScenario.title}
                      </Text>
                    )}
                  </View>
                </View>
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
            <AppButton
              label="Отправить"
              onPress={() => sendReply(draft)}
              tone="primary"
              disabled={!selectedScenario || isBusy}
            />
            <AppButton
              label="Завершить"
              onPress={finishScenario}
              tone="secondary"
              disabled={!selectedScenario || isBusy || (apiEnabled ? !sessionId : false)}
            />
            <AppButton
              label="Повторить сценарий"
              onPress={() => resetScenario(true)}
              tone="ghost"
              disabled={!selectedScenario || isBusy}
            />
          </View>
          <Text style={[styles.meta, { color: theme.semantic.textMuted }]}>
            {apiEnabled
              ? canFinish
                ? `Реплик менеджера: ${managerTurnCount} из ${minManagerTurns}. Сценарий уже можно завершить.`
                : `Реплик менеджера: ${managerTurnCount} из ${minManagerTurns} для итогового отчета.`
              : `Реплик менеджера: ${learnerTurnCount}.`}
          </Text>
        </AppCard>
      </View>

      <AppBottomSheet
        visible={sheetState !== null}
        title="JSON-отчет по сессии"
        description={
          "Компетенции и детали оценки доступны только после завершения сценария."
        }
        onClose={() => setSheetState(null)}
      >
        {sheetState?.kind === "report" ? (
          <Text style={[styles.reportJson, { color: theme.semantic.textSecondary }]}>
            {sheetState.reportJson}
          </Text>
        ) : null}
      </AppBottomSheet>
    </>
  );
}

function mapApiScenarioToScenario(item: SimulatorPublicScenarioDto, moduleId: string): Scenario {
  return {
    id: item.id,
    moduleId,
    title: item.title,
    goal: item.goal,
    difficulty: item.difficulty,
    status: item.status,
    channel: item.channel,
    targetCompetencies: [],
    persona: {
      id: `persona-${item.id}`,
      name: "Клиент",
      company: "",
      roleTitle: "B2B-клиент",
      mood: "",
      painPoints: [],
      objectionStyle: ""
    },
    openingMessage: "",
    suggestedActions: [],
    quickReplies: [],
    customerReplies: [],
    transcript: []
  };
}

function mapApiMessageToChatMessage(message: SimulatorApiMessageDto, scenario: Scenario): ScenarioMessage {
  const speakerNameByRole = {
    customer: scenario.persona.name || "Клиент",
    learner: "Вы",
    manager: "Вы",
    system: "Система"
  } as const;

  return {
    id: message.id,
    speakerName: speakerNameByRole[message.role] ?? "Собеседник",
    speakerRole: message.role === "manager" ? "learner" : message.role,
    text: message.text,
    timestampLabel: formatTimestamp(message.created_at)
  };
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${hours}:${minutes}`;
}

function buildMockReportPayload(
  scenario: Scenario,
  evaluation: SimulatorEvaluation
): SimulatorReportPayloadDto {
  return {
    type: "simulator_report",
    schema_version: "1.0",
    visibility: "after_session_finish_only",
    metadata: {
      session_id: `mock-${scenario.id}`,
      scenario_id: scenario.id,
      scenario_title: scenario.title,
      manager_name: "Вы",
      prompt_version: "mock-evaluation",
      methodology_version: "mock-v1",
      evaluation_schema_version: "mock-v1"
    },
    overall_level: evaluation.overallScore >= 85 ? "Senior" : evaluation.overallScore >= 70 ? "Middle" : "Junior",
    overall_comment: "Mock-отчет сформирован локально до подключения backend по feature flag.",
    strengths: evaluation.competencyScores
      .filter((score) => score.value >= 70)
      .map((score) => ({
        competency_id: score.id,
        competency_name: score.label,
        level: score.value >= 85 ? "Senior" : "Middle",
        summary: score.summary
      })),
    development_zones:
      evaluation.whatToImprove.length > 0
        ? evaluation.whatToImprove.map((item, index) => ({
            competency_id: `development-${index}`,
            competency_name: `Зона роста ${index + 1}`,
            level: "Junior" as const,
            summary: item
          }))
        : [
            {
              competency_id: "stability",
              competency_name: "Поддержание уровня",
              level: "Middle" as const,
              summary: "Поддерживать стабильность уровня и усложнять кейсы"
            }
          ],
    overall_recommendations: evaluation.recommendations,
    competencies: evaluation.competencyScores.map((score) => ({
      id: score.id,
      name: score.label,
      level: score.value >= 85 ? "Senior" : score.value >= 70 ? "Middle" : "Junior",
      argument: score.summary,
      evidence_quotes: [score.summary],
      missing_to_next_level: evaluation.whatToImprove[0] ?? "Продолжать развивать навык в следующей практике.",
      recommendations: evaluation.recommendations.slice(0, 2)
    })),
    transcript_quotes: evaluation.competencyScores.map((score) => ({
      competency_id: score.id,
      quote: score.summary
    }))
  };
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
    lineHeight: 16,
    fontWeight: "600"
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
  contextMessageWrapper: {
    width: "100%"
  },
  contextMessageBubble: {
    maxWidth: "92%",
    padding: 14,
    gap: 6,
    borderWidth: 1
  },
  contextTitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700"
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
  },
  text: {
    fontSize: 15,
    lineHeight: 21
  },
  reportJson: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: "Courier"
  }
});
