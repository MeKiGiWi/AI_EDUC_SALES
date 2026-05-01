import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { ChatBubble } from "../../components/simulator/ChatBubble";
import { ScenarioPicker } from "../../components/simulator/ScenarioPicker";
import { AppBottomSheet } from "../../components/ui/AppBottomSheet";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import {
  SimulatorApiError,
  simulatorApiService
} from "../../services/simulatorApiService";
import { useTheme } from "../../theme/useTheme";
import type {
  LearningModule,
  Scenario,
  ScenarioMessage,
  SimulatorApiMessageDto,
  SimulatorPublicScenarioDto
} from "../../types/academy";

interface SimulatorScreenProps {
  modules: LearningModule[];
  scenarios: Scenario[];
  activeScenarioId?: string;
  activeMaterialId?: string;
  onOpenMaterial: (materialId?: string) => void;
}

type SimulatorSheetState =
  | { kind: "evaluation"; evaluationJson: string }
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
  const catalogScenarios = apiEnabled ? apiScenarios : scenarios;
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
      } catch (error) {
        if (!isMounted) {
          return;
        }
        setApiScenarios([]);
        appendSystemErrorMessage("fetchSimulatorScenarios", error);
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

    if (!apiEnabled) {
      setMessages([createSystemMessage(buildMissingApiUrlText())]);
    } else {
      setMessages((current) => current.filter((message) => message.speakerRole === "system"));
    }
    setDraft("");
    setSheetState(null);
    setSessionId(null);
  }, [apiEnabled, selectedScenario?.id]);

  function createSystemMessage(text: string): ScenarioMessage {
    return {
      id: `system-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      speakerName: "Система",
      speakerRole: "system",
      text,
      timestampLabel: formatTimestamp(new Date().toISOString())
    };
  }

  function buildMissingApiUrlText(): string {
    return "Ошибка конфигурации: EXPO_PUBLIC_SIMULATOR_API_URL не задан. Тренажер работает только через backend.";
  }

  function formatSystemErrorText(operation: string, error: unknown): string {
    if (typeof error === "string") {
      return `ERROR [${operation}]: ${error}`;
    }

    if (error instanceof SimulatorApiError) {
      const detailObject =
        error.detail && typeof error.detail === "object"
          ? { ...(error.detail as Record<string, unknown>) }
          : null;
      if (detailObject && "debug_steps" in detailObject) {
        delete detailObject.debug_steps;
      }
      const detailText =
        typeof error.detail === "string"
          ? error.detail
          : detailObject !== null
            ? JSON.stringify(detailObject)
            : error.detail !== undefined
              ? JSON.stringify(error.detail)
            : "";
      const payloadText = detailText || error.body || error.message;
      const segments = [
        error.status ? `${error.status}` : "",
        payloadText
      ].filter(Boolean);
      return `ERROR [${operation}]: ${segments.join(" ")}`;
    }

    if (error instanceof Error) {
      return `ERROR [${operation}]: ${error.message}`;
    }

    return `ERROR [${operation}]: ${String(error)}`;
  }

  function appendSystemErrorMessage(operation: string, error: unknown): void {
    const text = formatSystemErrorText(operation, error);
    setMessages((current) => [...current, createSystemMessage(text)]);
    setSuccessMessage(null);
  }

  function resetScenario(clearSuccess: boolean) {
    setMessages(apiEnabled ? [] : [createSystemMessage(buildMissingApiUrlText())]);
    setDraft("");
    setSheetState(null);
    setSessionId(null);
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
      appendSystemErrorMessage("startScenario", new Error(buildMissingApiUrlText()));
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
      setDraft("");
      setSuccessMessage(`Сценарий "${selectedScenario.title}" запущен.`);
    } catch (error) {
      appendSystemErrorMessage("startScenario", error);
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

    if (!apiEnabled) {
      appendSystemErrorMessage("sendReply", new Error(buildMissingApiUrlText()));
      return;
    }

    if (!sessionId) {
      appendSystemErrorMessage("sendReply", new Error("Сначала запустите сценарий."));
      return;
    }

    try {
      setIsBusy(true);
      const response = await simulatorApiService.sendDialogueMessage(sessionId, trimmedText);
      setMessages((current) => [
        ...current,
        ...response.messages.map((message) => mapApiMessageToChatMessage(message, selectedScenario))
      ]);
      setDraft("");
      setSuccessMessage(response.rude === "yes" ? "Клиент завершил диалог." : "Реплика отправлена.");
    } catch (error) {
      appendSystemErrorMessage("sendReply", error);
    } finally {
      setIsBusy(false);
    }
  }

  async function finishScenario() {
    if (!selectedScenario) {
      return;
    }

    if (!apiEnabled) {
      appendSystemErrorMessage("finishScenario", new Error(buildMissingApiUrlText()));
      return;
    }

    if (!sessionId) {
      appendSystemErrorMessage("finishScenario", new Error("Сначала запустите сценарий."));
      return;
    }

    try {
      setIsBusy(true);
      const response = await simulatorApiService.finishDialogueSession(sessionId);
      if (response.evaluation) {
        setSheetState({
          kind: "evaluation",
          evaluationJson: JSON.stringify(response.evaluation, null, 2)
        });
        setSuccessMessage("Сценарий завершен. Сырая оценка сформирована.");
      } else {
        setSuccessMessage(response.status === "finished" ? "Сценарий завершен." : "Сессия обновлена.");
      }
    } catch (error) {
      appendSystemErrorMessage("finishScenario", error);
    } finally {
      setIsBusy(false);
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
                disabled={!selectedScenario || isBusy || !apiEnabled}
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
                editable={Boolean(selectedScenario) && apiEnabled && !isBusy}
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
              disabled={!selectedScenario || isBusy || !apiEnabled}
            />
            <AppButton
              label="Завершить"
              onPress={finishScenario}
              tone="secondary"
              disabled={!selectedScenario || isBusy || !apiEnabled || !sessionId}
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
              ? sessionId
                ? "Чат с backend активен. Можно продолжать диалог или завершить сессию."
                : "Сначала запустите сценарий, затем отправьте сообщение."
              : "Тренажер недоступен: требуется backend-конфигурация."}
          </Text>
        </AppCard>
      </View>

      <AppBottomSheet
        visible={sheetState !== null}
        title="JSON-оценка по сессии"
        description={
          "Компетенции и детали оценки доступны только после завершения сценария."
        }
        onClose={() => setSheetState(null)}
      >
        {sheetState?.kind === "evaluation" ? (
          <Text style={[styles.reportJson, { color: theme.semantic.textSecondary }]}>
            {sheetState.evaluationJson}
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
    goal: "Проведите короткий B2B-диалог с клиентом в чате.",
    difficulty: "medium",
    status: item.status,
    channel: "chat",
    targetCompetencies: [],
    persona: {
      id: `persona-${item.id}`,
      name: "Клиент",
      company: "",
      roleTitle: "B2B клиент",
      mood: "",
      painPoints: [],
      objectionStyle: ""
    },
    openingMessage: item.openingMessage,
    suggestedActions: [],
    quickReplies: [],
    customerReplies: [],
    transcript: []
  };
}

function mapApiMessageToChatMessage(message: SimulatorApiMessageDto, scenario: Scenario): ScenarioMessage {
  const speakerNameByRole = {
    customer: scenario.persona.name || "Клиент",
    learner: "Вы"
  } as const;

  return {
    id: message.id ?? `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    speakerName: speakerNameByRole[message.role] ?? "Собеседник",
    speakerRole: message.role,
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
