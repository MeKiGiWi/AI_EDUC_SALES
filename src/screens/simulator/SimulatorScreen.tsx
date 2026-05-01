import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { ChatBubble } from "../../components/simulator/ChatBubble";
import { ScenarioPicker } from "../../components/simulator/ScenarioPicker";
import { AppBottomSheet } from "../../components/ui/AppBottomSheet";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import {
  SimulatorApiError,
  simulatorApiService
} from "../../services/simulatorApiService";
import { useTheme } from "../../theme/useTheme";
import type {
  KnowledgeMaterial,
  LearningModule,
  Scenario,
  ScenarioMessage,
  SimulatorApiMessageDto,
  SimulatorEvaluationPayloadDto,
  SimulatorPublicScenarioDto
} from "../../types/academy";

interface SimulatorScreenProps {
  modules: LearningModule[];
  scenarios: Scenario[];
  materials: KnowledgeMaterial[];
  activeScenarioId?: string;
  activeMaterialId?: string;
  onOpenReports: () => void;
  onReportSaved: (payload: {
    scenarioTitle: string;
    evaluation: SimulatorEvaluationPayloadDto;
  }) => void | Promise<void>;
}

type DialoguePhase = "idle" | "active" | "finished";

const API_SIMULATOR_MODULE_ID = "mod-simulator-api";
const difficultyOptions = ["Легкий", "Средний", "Сложный"] as const;
const TRAINING_INTRO_MESSAGE = `Коллега, приветствую!
Ты получил входящий запрос от клиента – руководителя производства, который ищет кондиционер для цеха. Он разослал запросы нескольким поставщикам, ты – один из них.
Твоя задача – стать единственным.
Общайся так, как обычно ведёшь диалог с потенциальным покупателем. Диалог завершится, когда клиент примет решение о следующем шаге или окончательно уйдёт после повторного "подумаю". Минимальная длина диалога для честной оценки — 10 твоих реплик. Если хочешь завершить раньше, напиши Стоп.
По итогам получишь обратную связь по своим профессиональным навыкам. Поехали?
Нажми начать, чтобы начать`;
const backendDifficultyMap: Record<(typeof difficultyOptions)[number], string> = {
  "Легкий": "easy",
  "Средний": "medium",
  "Сложный": "hard"
};

export function SimulatorScreen({
  modules,
  scenarios,
  materials,
  activeScenarioId,
  activeMaterialId,
  onOpenReports,
  onReportSaved
}: SimulatorScreenProps) {
  const theme = useTheme();
  const apiEnabled = simulatorApiService.isEnabled();
  const [apiScenarios, setApiScenarios] = useState<Scenario[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<KnowledgeMaterial | null>(null);
  const apiSimulatorModule = useMemo<LearningModule>(
    () => ({
      id: API_SIMULATOR_MODULE_ID,
      title: "b2b продажи",
      description: "Практика baseline-сценария с AI-клиентом.",
      durationMinutes: 15,
      completedPercent: 0,
      nextStep: "Запустить baseline-сценарий",
      statusLabel: "Активен"
    }),
    []
  );
  const simulatorModules = useMemo(() => {
    if (!apiEnabled) {
      return modules;
    }

    return [apiSimulatorModule];
  }, [apiEnabled, apiSimulatorModule, modules]);
  const catalogScenarios = apiEnabled ? apiScenarios : scenarios;
  const initialScenario = useMemo(
    () => catalogScenarios.find((scenario) => scenario.id === activeScenarioId) ?? catalogScenarios[0],
    [activeScenarioId, catalogScenarios]
  );
  const fallbackModuleId =
    initialScenario?.moduleId ?? simulatorModules[0]?.id ?? catalogScenarios[0]?.moduleId ?? "";
  const [selectedModuleId, setSelectedModuleId] = useState(fallbackModuleId);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | undefined>(
    initialScenario?.id ?? catalogScenarios.find((scenario) => scenario.moduleId === fallbackModuleId)?.id
  );
  const [messages, setMessages] = useState<ScenarioMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [difficulty, setDifficulty] = useState<(typeof difficultyOptions)[number]>("Средний");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [dialoguePhase, setDialoguePhase] = useState<DialoguePhase>("idle");

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
  const materialHint = useMemo(
    () =>
      (activeMaterialId ? materials.find((material) => material.id === activeMaterialId) : undefined) ??
      (selectedScenario
        ? materials.find((material) =>
            selectedScenario.targetCompetencies.some((competency) =>
              material.title.toLowerCase().includes(competency.toLowerCase())
            )
          )
        : undefined) ??
      materials[0],
    [activeMaterialId, materials, selectedScenario]
  );

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

        const mappedScenarios = items.map((item) => mapApiScenarioToScenario(item, API_SIMULATOR_MODULE_ID));
        setApiScenarios(mappedScenarios);
        setSelectedModuleId(API_SIMULATOR_MODULE_ID);
        setSelectedScenarioId(mappedScenarios[0]?.id);
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
  }, [apiEnabled]);

  useEffect(() => {
    if (apiEnabled) {
      setSelectedModuleId(API_SIMULATOR_MODULE_ID);
      return;
    }

    if (initialScenario) {
      setSelectedModuleId(initialScenario.moduleId);
      setSelectedScenarioId(initialScenario.id);
      return;
    }

    setSelectedModuleId((current) => {
      if (current && simulatorModules.some((module) => module.id === current)) {
        return current;
      }

      return fallbackModuleId;
    });
  }, [apiEnabled, fallbackModuleId, initialScenario, simulatorModules]);

  useEffect(() => {
    if (!selectedModuleId) {
      setSelectedScenarioId(undefined);
      return;
    }

    if (apiEnabled) {
      const firstApiScenarioId = apiScenarios[0]?.id;
      setSelectedScenarioId((current) =>
        current && apiScenarios.some((scenario) => scenario.id === current) ? current : firstApiScenarioId
      );
      return;
    }

    const firstScenarioId = catalogScenarios.find((scenario) => scenario.moduleId === selectedModuleId)?.id;
    setSelectedScenarioId((current) =>
      current &&
      catalogScenarios.some((scenario) => scenario.moduleId === selectedModuleId && scenario.id === current)
        ? current
        : firstScenarioId
    );
  }, [apiEnabled, apiScenarios, catalogScenarios, selectedModuleId]);

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
    setSessionId(null);
    setSelectedMaterial(null);
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
    setMessages(
      apiEnabled && selectedScenario
        ? [createSystemMessage(TRAINING_INTRO_MESSAGE)]
        : [createSystemMessage(buildMissingApiUrlText())]
    );
    setDraft("");
    setSessionId(null);
    setDialoguePhase("idle");
    setSelectedMaterial(null);
    if (clearSuccess) {
      setSuccessMessage(null);
    }
  }

  async function persistLatestReport(currentScenario: Scenario) {
    if (!sessionId) {
      throw new Error("Сначала запустите сценарий.");
    }

    const response = await simulatorApiService.finishDialogueSession(sessionId);
    if (response.evaluation) {
      await onReportSaved({
        scenarioTitle: currentScenario.title,
        evaluation: response.evaluation
      });
      setSuccessMessage('Диалог завершён. Отчет сохранен во вкладке "Отчеты".');
    } else {
      setSuccessMessage("Диалог завершён, но оценка пока не сформирована.");
    }

    setDialoguePhase("finished");
    setDraft("");
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

    setSessionId(null);
    try {
      setIsBusy(true);
      const response = await simulatorApiService.startDialogueSession(
        selectedScenario.id,
        backendDifficultyMap[difficulty]
      );
      setSessionId(response.session_id);
      setMessages([mapApiMessageToChatMessage(response.message, selectedScenario)]);
      setDialoguePhase("active");
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

    if (dialoguePhase === "finished") {
      setMessages((current) => [
        ...current,
        createSystemMessage('Диалог уже завершён. Нажмите "Повторить сценарий", чтобы начать заново.')
      ]);
      setSuccessMessage("Сессия уже завершена.");
      return;
    }

    if (!apiEnabled) {
      appendSystemErrorMessage("sendReply", new Error(buildMissingApiUrlText()));
      return;
    }

    if (dialoguePhase === "idle") {
      setSuccessMessage("Сначала нажмите Начать.");
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
      if (response.status === "finished") {
        setDialoguePhase("finished");
        await persistLatestReport(selectedScenario);
      } else {
        setSuccessMessage("Реплика отправлена.");
      }
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

    if (dialoguePhase === "finished") {
      setMessages((current) => [
        ...current,
        createSystemMessage('Диалог уже завершён. Нажмите "Повторить сценарий", чтобы начать заново.')
      ]);
      return;
    }

    if (dialoguePhase !== "active") {
      setSuccessMessage("Сначала начните диалог и подтвердите запуск.");
      return;
    }

    await finishActiveScenario();
  }

  async function finishActiveScenario() {
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
      await persistLatestReport(selectedScenario);
    } catch (error) {
      appendSystemErrorMessage("finishScenario", error);
    } finally {
      setIsBusy(false);
    }
  }

  function handleSelectModule(moduleId: string) {
    setSelectedModuleId(moduleId);
    setSuccessMessage(null);
    setSelectedMaterial(null);
  }

  function openMaterialHint() {
    if (!materialHint) {
      setSuccessMessage("Подсказка пока недоступна. Продолжайте практику по текущему сценарию.");
      return;
    }

    setSelectedMaterial(materialHint);
  }

  return (
    <>
      <ScenarioPicker
        modules={simulatorModules}
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
              {dialoguePhase === "active" ? (
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
              ) : null}
            </>
          ) : (
            <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>
              Для этого модуля сценарии скоро появятся. Выберите другой модуль, чтобы открыть диалоговую тренировку.
            </Text>
          )}
          <View style={styles.buttonRow}>
            {dialoguePhase === "idle" ? (
              <AppButton
                label="Начать"
                onPress={startScenario}
                tone="primary"
                disabled={!selectedScenario || isBusy || !apiEnabled}
              />
            ) : dialoguePhase === "active" ? (
              <>
                <AppButton
                  label="Отправить"
                  onPress={() => sendReply(draft)}
                  tone="primary"
                  disabled={!selectedScenario || isBusy || !apiEnabled || dialoguePhase !== "active"}
                />
                <AppButton
                  label="Завершить"
                  onPress={finishScenario}
                  tone="secondary"
                  disabled={!selectedScenario || isBusy || !apiEnabled || dialoguePhase !== "active"}
                />
              </>
            ) : (
              <>
                <AppButton
                  label="Открыть отчеты"
                  onPress={onOpenReports}
                  tone="primary"
                  disabled={!selectedScenario || isBusy}
                />
                <AppButton
                  label="Повторить сценарий"
                  onPress={() => resetScenario(true)}
                  tone="ghost"
                  disabled={!selectedScenario || isBusy}
                />
              </>
            )}
            {dialoguePhase !== "finished" ? (
              <AppButton
                label="Повторить сценарий"
                onPress={() => resetScenario(true)}
                tone="ghost"
                disabled={!selectedScenario || isBusy}
              />
            ) : null}
          </View>
          <Text style={[styles.meta, { color: theme.semantic.textMuted }]}>
            {apiEnabled
              ? dialoguePhase === "idle"
                ? "Нажмите Начать, чтобы запустить диалог."
                : dialoguePhase === "active"
                  ? "Диалог активен. Цель — закрыть клиента на конкретный следующий шаг."
                  : 'Диалог завершён. Последний отчет доступен во вкладке "Отчеты".'
              : "Тренажер недоступен: требуется backend-конфигурация."}
          </Text>
        </AppCard>
      </View>

      <AppBottomSheet
        visible={selectedMaterial !== null}
        title={selectedMaterial?.title ?? ""}
        description={selectedMaterial?.description ?? ""}
        onClose={() => setSelectedMaterial(null)}
      >
        {selectedMaterial ? (
          <>
            <Text style={[styles.title, { color: theme.semantic.textPrimary }]}>Короткое объяснение</Text>
            <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>
              {selectedMaterial.aiPlainExplanation}
            </Text>
            <Text style={[styles.title, { color: theme.semantic.textPrimary }]}>Как использовать сейчас</Text>
            <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>
              {selectedMaterial.applyInDialogue}
            </Text>
            <Text style={[styles.title, { color: theme.semantic.textPrimary }]}>Пример формулировки</Text>
            <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>
              {selectedMaterial.clientAnswerExample}
            </Text>
          </>
        ) : null}
      </AppBottomSheet>
    </>
  );
}

function mapApiScenarioToScenario(item: SimulatorPublicScenarioDto, moduleId: string): Scenario {
  return {
    id: item.id,
    moduleId,
    title: "Baseline",
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
  dialogFullWidth: {
    width: "100%"
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    flexWrap: "wrap"
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
  }
});
