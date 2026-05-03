import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { useSessionStorage } from "../../hooks/useSessionStorage";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";

import { ChatBubble } from "../../components/simulator/ChatBubble";
import { ScenarioPicker } from "../../components/simulator/ScenarioPicker";
import { StudentWorkspaceNav } from "../../components/student/StudentWorkspaceNav";
import { AppBottomSheet } from "../../components/ui/AppBottomSheet";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import type { RouteName } from "../../navigation/routes";
import { simulatorApiService } from "../../services/simulatorApiService";
import { useTheme } from "../../theme/useTheme";
import type {
  LearningModule,
  Scenario,
  ScenarioMessage,
  SimulatorApiMessageDto,
  SimulatorEvaluationPayloadDto,
  SimulatorPublicScenarioDto
} from "../../types/academy";

interface SimulatorScreenProps {
  activeScenarioId?: string;
  onOpenReports: () => void;
  onNavigateStudentRoute: (route: RouteName) => void;
  onReportSaved: (payload: {
    scenarioTitle: string;
    evaluation: SimulatorEvaluationPayloadDto;
  }) => void | Promise<void>;
  onNavigateToReports: () => void;
}

type DialoguePhase = "idle" | "active" | "finished";

const API_SIMULATOR_MODULE_ID = "mod-simulator-api";
const DEFAULT_BACKEND_DIFFICULTY = "medium";
const MANAGER_REPLY_TARGET = 10;
const TRAINING_FORMAT_LABEL = "Симуляция текстового диалога с B2B-клиентом";
const DEFAULT_SCENARIO_GOAL = "Договориться с покупателем о конкретном следующем шаге.";
const DEFAULT_SCENARIO_CONTEXT = [
  "Входящий запрос на кондиционирование производственного цеха",
  "Клиент сравнивает нескольких поставщиков",
  "Важны сроки монтажа, простои и стабильность решения"
];
const BASELINE_DISPLAY_SCENARIO: Scenario = {
  id: "baseline",
  moduleId: API_SIMULATOR_MODULE_ID,
  title: "Руководитель производства: кондиционирование цеха",
  goal: DEFAULT_SCENARIO_GOAL,
  difficulty: "Средний",
  status: "ready",
  channel: "Чат",
  targetCompetencies: [
    "Умение задавать вопросы",
    "Диагностика потребности",
    "Формулировка ценности через выгоду",
    "Работа с возражением «подумаю / не сейчас»",
    "Фиксация следующего шага"
  ],
  persona: {
    id: "persona-production-manager",
    name: "ИИ-покупатель",
    company: "Производственное предприятие",
    roleTitle: "Руководитель производства",
    mood: "Деловой, рациональный, умеренно требовательный",
    painPoints: DEFAULT_SCENARIO_CONTEXT,
    objectionStyle: "Проверяет сроки, простои, бюджет и риски внедрения"
  },
  openingMessage:
    "Добрый день. Подбираем кондиционирование для производственного цеха. Нужно понять, сможете ли вы предложить решение без остановки линии и с нормальными сроками монтажа.",
  suggestedActions: [],
  quickReplies: [],
  customerReplies: [],
  transcript: []
};

export function SimulatorScreen({
  activeScenarioId,
  onOpenReports,
  onNavigateStudentRoute,
  onReportSaved,
  onNavigateToReports
}: SimulatorScreenProps) {
  const theme = useTheme();
  const layout = useResponsiveLayout();
  const apiEnabled = simulatorApiService.isEnabled();
  const [apiScenarios, setApiScenarios] = useState<Scenario[]>([]);
  const [simulatorUnavailableReason, setSimulatorUnavailableReason] = useState<string | null>(null);
  const [isCatalogLoading, setIsCatalogLoading] = useState(false);
  const apiSimulatorModule = useMemo<LearningModule>(
    () => ({
      id: API_SIMULATOR_MODULE_ID,
      title: "B2B-диалог с клиентом",
      description: TRAINING_FORMAT_LABEL,
      durationMinutes: 15,
      completedPercent: 0,
      nextStep: "Запустить сценарий",
      statusLabel: "Активен"
    }),
    []
  );
  const simulatorModules = useMemo(() => [apiSimulatorModule], [apiSimulatorModule]);
  const catalogScenarios = useMemo(
    () => (apiScenarios.length > 0 ? apiScenarios : [BASELINE_DISPLAY_SCENARIO]),
    [apiScenarios]
  );
  const [selectedModuleId, setSelectedModuleId] = useState(API_SIMULATOR_MODULE_ID);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | undefined>(activeScenarioId);
  const [messages, setMessages] = useState<ScenarioMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [sessionId, setSessionId] = useSessionStorage<string | null>("sim_session_id", null);
  const [isBusy, setIsBusy] = useState(false);
  const [dialoguePhase, setDialoguePhase] = useSessionStorage<DialoguePhase>("sim_dialogue_phase", "idle");
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);

  const visibleScenarios = useMemo(
    () => catalogScenarios.filter((scenario) => scenario.moduleId === selectedModuleId),
    [catalogScenarios, selectedModuleId]
  );
  const selectedScenario = useMemo(
    () => visibleScenarios.find((scenario) => scenario.id === selectedScenarioId) ?? visibleScenarios[0],
    [visibleScenarios, selectedScenarioId]
  );
  const visibleMessages = useMemo(
    () => messages.filter((message) => message.speakerRole !== "system"),
    [messages]
  );
  const managerReplyCount = useMemo(
    () => visibleMessages.filter((message) => message.speakerRole === "learner").length,
    [visibleMessages]
  );
  const desktopDialoguePhase = apiEnabled ? dialoguePhase : "idle";
  const replyProgress = Math.min(managerReplyCount / MANAGER_REPLY_TARGET, 1);
  const currentScenarioLabel = selectedScenario?.title ?? "Сценарий не выбран";
  const progressNote =
    managerReplyCount >= MANAGER_REPLY_TARGET
      ? "Минимум 10 реплик выполнен."
      : "Минимальный объём для оценки: 10 реплик менеджера.";
  const trainingContextRows = useMemo(
    () => buildTrainingContextRows(selectedScenario),
    [selectedScenario]
  );
  const selectedScenarioIsApiScenario = apiScenarios.some((scenario) => scenario.id === selectedScenario?.id);
  const canStartDialogue =
    apiEnabled && !isCatalogLoading && !simulatorUnavailableReason && selectedScenarioIsApiScenario;
  const emptyChatText = buildEmptyChatText({
    canStartDialogue,
    isCatalogLoading,
    simulatorUnavailableReason
  });
  const dialogueStatusLabel = buildDialogueStatusLabel({
    canStartDialogue,
    dialoguePhase: desktopDialoguePhase,
    isCatalogLoading,
    simulatorUnavailableReason
  });

  useEffect(() => {
    let isMounted = true;

    async function loadApiScenarios() {
      if (!apiEnabled) {
        if (!isMounted) {
          return;
        }

        setApiScenarios([]);
        setSelectedModuleId(API_SIMULATOR_MODULE_ID);
        setSelectedScenarioId(BASELINE_DISPLAY_SCENARIO.id);
        setSimulatorUnavailableReason("Диалоговый сервис не подключён.");
        return;
      }

      try {
        setIsCatalogLoading(true);
        setSimulatorUnavailableReason(null);
        const items = await simulatorApiService.fetchSimulatorScenarios();
        if (!isMounted) {
          return;
        }

        const mappedScenarios = items.map((item) => mapApiScenarioToScenario(item, API_SIMULATOR_MODULE_ID));

        setApiScenarios(mappedScenarios);
        setSelectedModuleId(API_SIMULATOR_MODULE_ID);
        setSelectedScenarioId(mappedScenarios[0]?.id ?? BASELINE_DISPLAY_SCENARIO.id);
        setSimulatorUnavailableReason(
          mappedScenarios.length > 0 ? null : "Диалоговый сервис не вернул сценарии."
        );
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setApiScenarios([]);
        setSelectedModuleId(API_SIMULATOR_MODULE_ID);
        setSelectedScenarioId(BASELINE_DISPLAY_SCENARIO.id);
        setSimulatorUnavailableReason(
          "Диалоговый сервис временно недоступен. Попробуйте обновить страницу через несколько минут."
        );
      } finally {
        if (isMounted) {
          setIsCatalogLoading(false);
        }
      }
    }

    loadApiScenarios();

    return () => {
      isMounted = false;
    };
  }, [apiEnabled]);

  useEffect(() => {
    setSelectedModuleId(API_SIMULATOR_MODULE_ID);
  }, []);

  useEffect(() => {
    if (activeScenarioId && catalogScenarios.some((scenario) => scenario.id === activeScenarioId)) {
      setSelectedScenarioId(activeScenarioId);
    }
  }, [activeScenarioId, catalogScenarios]);

  useEffect(() => {
    if (!selectedModuleId) {
      setSelectedScenarioId(BASELINE_DISPLAY_SCENARIO.id);
      return;
    }

    const firstScenarioId =
      catalogScenarios.find((scenario) => scenario.moduleId === selectedModuleId)?.id ??
      BASELINE_DISPLAY_SCENARIO.id;
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
    setSessionId(null);
  }, [apiEnabled, selectedScenario?.id]);

  function buildMissingApiUrlText(): string {
    return "Диалоговый сервис не подключён.";
  }

  function formatSystemErrorText(operation: string, error: unknown): string {
    if (typeof error === "string") {
      return error;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return `Не удалось выполнить действие "${operation}". Попробуйте позже.`;
  }

  function appendSystemErrorMessage(operation: string, error: unknown): void {
    const text = formatSystemErrorText(operation, error);
    setSuccessMessage(text);
  }

  function resetScenario(clearSuccess: boolean) {
    setMessages([]);
    setDraft("");
    setSessionId(null);
    setDialoguePhase("idle");
    if (clearSuccess) {
      setSuccessMessage(null);
    }
  }

  async function persistLatestReport(currentScenario: Scenario) {
    const capturedSessionId = sessionId;
    if (!capturedSessionId) {
      throw new Error("Сначала запустите сценарий.");
    }

    const MAX_ATTEMPTS = 3;
    const RETRY_DELAY_MS = 2000;

    let evaluation: SimulatorEvaluationPayloadDto | undefined;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const response = await simulatorApiService.finishDialogueSession(capturedSessionId);
        if (response.evaluation) {
          evaluation = response.evaluation;
          break;
        }
        if (attempt < MAX_ATTEMPTS) {
          setSuccessMessage(`Генерируем отчёт... (попытка ${attempt}/${MAX_ATTEMPTS})`);
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        }
      } catch (err) {
        if (attempt < MAX_ATTEMPTS) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        } else {
          throw err;
        }
      }
    }

    setDialoguePhase("finished");
    setDraft("");

    if (evaluation) {
      await onReportSaved({
        scenarioTitle: currentScenario.title,
        evaluation
      });
      setSuccessMessage('Диалог завершён. Отчет сохранен во вкладке "Отчеты".');
      onNavigateToReports();
    } else {
      setSuccessMessage("Диалог завершён, но оценка не была получена от сервера. Попробуйте завершить ещё раз.");
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

    setSessionId(null);
    try {
      setIsBusy(true);
      const response = await simulatorApiService.startDialogueSession(
        selectedScenario.id,
        DEFAULT_BACKEND_DIFFICULTY
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

    if (trimmedText.toLowerCase() === "стоп") {
      await finishScenario();
      return;
    }

    if (dialoguePhase === "finished") {
      setSuccessMessage('Диалог уже завершён. Нажмите "Повторить сценарий", чтобы начать заново.');
      return;
    }

    if (!apiEnabled) {
      appendSystemErrorMessage("sendReply", new Error(buildMissingApiUrlText()));
      return;
    }

    if (dialoguePhase === "idle") {
      setSuccessMessage("Сначала нажмите Старт.");
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
      setSuccessMessage('Диалог уже завершён. Нажмите "Повторить сценарий", чтобы начать заново.');
      return;
    }

    if (dialoguePhase !== "active") {
      setSuccessMessage("Сначала начните диалог и подтвердите запуск.");
      return;
    }

    if (managerReplyCount < MANAGER_REPLY_TARGET) {
      setShowFinishConfirm(true);
      return;
    }

    await finishActiveScenario();
  }

  async function confirmFinishScenario() {
    setShowFinishConfirm(false);
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
  }

  if (layout.isDesktop) {
    return (
      <>
        <View
          style={[
            styles.desktopShell,
            {
              minHeight: layout.height,
              backgroundColor: theme.semantic.background,
              borderColor: theme.semantic.border
            }
          ]}
        >
          <View style={styles.desktopBody}>
            <View style={[styles.sessionSidebar, { backgroundColor: theme.semantic.cardSubtle, borderColor: theme.semantic.border }]}>
              <ScrollView contentContainerStyle={styles.sidebarContent} showsVerticalScrollIndicator={false}>
                <View style={styles.sidebarSection}>
                  <Text style={[styles.sidebarSectionTitle, { color: theme.semantic.textMuted }]}>Прогресс</Text>
                  <View style={[styles.progressCard, { backgroundColor: theme.semantic.card, borderColor: theme.semantic.border }]}>
                    <View style={styles.progressRow}>
                      <Text style={[styles.progressLabel, { color: theme.semantic.textSecondary }]}>Реплики менеджера</Text>
                      <Text style={[styles.progressValue, { color: theme.semantic.textPrimary }]}>
                        {managerReplyCount} / {MANAGER_REPLY_TARGET}
                      </Text>
                    </View>
                    <View style={[styles.progressTrack, { backgroundColor: theme.semantic.borderSubtle }]}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${replyProgress * 100}%`,
                            backgroundColor: theme.semantic.actionPrimary
                          }
                        ]}
                      />
                    </View>
                    <Text style={[styles.progressNote, { color: theme.semantic.actionSecondaryText, backgroundColor: theme.semantic.cardAccent }]}>
                      {progressNote}
                    </Text>
                  </View>
                </View>

                <View style={styles.sidebarSection}>
                  <StudentWorkspaceNav activeRoute="Simulator" onNavigate={onNavigateStudentRoute} compact />
                </View>

                <View style={styles.sidebarSection}>
                  <Text style={[styles.sidebarSectionTitle, { color: theme.semantic.textMuted }]}>Контекст</Text>
                  <View style={styles.contextList}>
                    {trainingContextRows.map((row) => (
                      <ContextRow key={row.label} label={row.label} value={row.value} />
                    ))}
                  </View>
                </View>
              </ScrollView>
            </View>

            <View style={styles.desktopChatMain}>
              <View style={[styles.desktopChatSurface, { backgroundColor: theme.semantic.card, borderColor: theme.semantic.border }]}>
                <View style={[styles.desktopHeader, { borderColor: theme.semantic.borderSubtle }]}>
                  <View style={styles.desktopHeaderMain}>
                    <Text style={[styles.desktopTitle, { color: theme.semantic.textPrimary }]}>
                      {currentScenarioLabel}
                    </Text>
                    <Text style={[styles.desktopScenarioInfo, { color: theme.semantic.textSecondary }]}>
                      Симуляция текстового диалога с B2B-клиентом
                    </Text>
                  </View>
                  <View style={styles.desktopHeaderActions}>
                    <View style={[styles.statusBadge, { backgroundColor: theme.semantic.cardAccent, borderColor: theme.semantic.border }]}>
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: canStartDialogue || desktopDialoguePhase !== "idle" ? theme.semantic.success : theme.semantic.warning }
                        ]}
                      />
                      <Text style={[styles.statusText, { color: theme.semantic.textSecondary }]}>
                        {dialogueStatusLabel}
                      </Text>
                    </View>
                    <AppButton
                      label={desktopDialoguePhase === "active" ? "Завершить" : "Старт"}
                      onPress={desktopDialoguePhase === "active" ? finishScenario : startScenario}
                      tone={desktopDialoguePhase === "active" ? "secondary" : "primary"}
                      disabled={!canStartDialogue || isBusy || desktopDialoguePhase === "finished"}
                    />
                  </View>
                </View>

                <ScrollView
                  style={styles.desktopChatScroll}
                  contentContainerStyle={styles.desktopChatScrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  {visibleMessages.length > 0 ? (
                    visibleMessages.map((message) => (
                      <ChatBubble key={message.id} message={message} />
                    ))
                  ) : (
                    <View style={[styles.emptyChatState, { borderColor: theme.semantic.border, backgroundColor: theme.semantic.cardAccent }]}>
                      <Text style={[styles.emptyChatTitle, { color: theme.semantic.textPrimary }]}>
                        Диалог ещё не начался
                      </Text>
                      <Text style={[styles.emptyChatText, { color: theme.semantic.textSecondary }]}>
                        {emptyChatText}
                      </Text>
                    </View>
                  )}
                </ScrollView>

                <View style={[styles.desktopInputArea, { borderColor: theme.semantic.borderSubtle }]}>
                  {successMessage ? (
                    <Text style={[styles.desktopStatusMessage, { color: theme.semantic.textSecondary }]}>
                      {successMessage}
                    </Text>
                  ) : null}
                  {desktopDialoguePhase === "active" ? (
                    <View
                      style={[
                        styles.desktopInputWrap,
                        {
                          backgroundColor: theme.semantic.cardSubtle,
                          borderColor: theme.semantic.border,
                          borderRadius: theme.radius.lg
                        }
                      ]}
                    >
                      <TextInput
                        value={draft}
                        onChangeText={setDraft}
                        placeholder="Напишите сообщение клиенту..."
                        placeholderTextColor={theme.semantic.textMuted}
                        multiline
                        editable={!isBusy}
                        style={[
                          styles.desktopInput,
                          {
                            color: theme.semantic.textPrimary,
                            outlineColor: "transparent",
                            outlineStyle: "solid",
                            outlineWidth: 0
                          }
                        ]}
                      />
                      <AppButton
                        label="Отправить"
                        onPress={() => { void sendReply(draft); }}
                        tone="primary"
                        disabled={!canStartDialogue || isBusy || desktopDialoguePhase !== "active"}
                      />
                    </View>
                  ) : (
                    <View style={styles.desktopIdleActions}>
                      <Text style={[styles.meta, { color: theme.semantic.textMuted }]}>
                        {desktopDialoguePhase === "finished"
                          ? 'Диалог завершён. Откройте "Отчеты" или повторите сценарий.'
                          : emptyChatText}
                      </Text>
                      <View style={styles.buttonRow}>
                        {desktopDialoguePhase === "finished" ? (
                          <>
                            <AppButton label="Открыть отчеты" onPress={onOpenReports} tone="primary" disabled={isBusy} />
                            <AppButton
                              label="Повторить сценарий"
                              onPress={() => resetScenario(true)}
                              tone="ghost"
                              disabled={!canStartDialogue || isBusy}
                            />
                          </>
                        ) : (
                          <AppButton
                            label="Старт"
                            onPress={startScenario}
                            tone="primary"
                            disabled={!canStartDialogue || isBusy}
                          />
                        )}
                      </View>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>
        </View>

        <AppBottomSheet
          visible={showFinishConfirm}
          title="Диалог слишком короткий для полноценной оценки"
          description={`Сейчас: ${managerReplyCount} из ${MANAGER_REPLY_TARGET} реплик менеджера.`}
          onClose={() => setShowFinishConfirm(false)}
          hideCloseButton
          centeredHeader
        >
          <Text style={[styles.body, { color: theme.semantic.textSecondary, textAlign: "center" }]}>
            Продолжи или напиши Стоп для завершения.
          </Text>
          <View style={styles.confirmButtonRow}>
            <View style={styles.confirmButtonItem}>
              <AppButton
                label="Завершить"
                onPress={() => { void confirmFinishScenario(); }}
                tone="secondary"
                fullWidth
                disabled={isBusy}
              />
            </View>
            <View style={styles.confirmButtonItem}>
              <AppButton
                label="Продолжить"
                onPress={() => setShowFinishConfirm(false)}
                tone="primary"
                fullWidth
              />
            </View>
          </View>
        </AppBottomSheet>
      </>
    );
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
                    {trainingContextRows.map((row) => (
                      <Text key={row.label} style={[styles.text, { color: theme.semantic.textSecondary }]}>
                        <Text style={{ color: theme.semantic.textPrimary }}>{row.label}: </Text>
                        {row.value}
                      </Text>
                    ))}
                  </View>
                </View>
                {visibleMessages.map((message) => (
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
                  editable={canStartDialogue && !isBusy}
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
                label="Старт"
                onPress={startScenario}
                tone="primary"
                disabled={!canStartDialogue || isBusy}
              />
            ) : dialoguePhase === "active" ? (
              <>
                <AppButton
                  label="Отправить"
                  onPress={() => sendReply(draft)}
                  tone="primary"
                  disabled={!canStartDialogue || isBusy || dialoguePhase !== "active"}
                />
                <AppButton
                  label="Завершить"
                  onPress={finishScenario}
                  tone="secondary"
                  disabled={!canStartDialogue || isBusy || dialoguePhase !== "active"}
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
                  disabled={!canStartDialogue || isBusy}
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
            {dialoguePhase === "idle"
              ? emptyChatText
              : dialoguePhase === "active"
                ? "Диалог активен. Цель — закрыть покупателя на конкретный следующий шаг."
                : 'Диалог завершён. Последний отчет доступен во вкладке "Отчеты".'}
          </Text>
        </AppCard>
      </View>

      <AppBottomSheet
        visible={showFinishConfirm}
        title="Диалог слишком короткий для полноценной оценки"
        description={`Сейчас: ${managerReplyCount} из ${MANAGER_REPLY_TARGET} реплик менеджера.`}
        onClose={() => setShowFinishConfirm(false)}
        hideCloseButton
        centeredHeader
      >
        <Text style={[styles.body, { color: theme.semantic.textSecondary, textAlign: "center" }]}>
          Продолжи или напиши Стоп для завершения.
        </Text>
        <View style={styles.confirmButtonRow}>
          <View style={styles.confirmButtonItem}>
            <AppButton
              label="Завершить"
              onPress={() => { void confirmFinishScenario(); }}
              tone="secondary"
              fullWidth
              disabled={isBusy}
            />
          </View>
          <View style={styles.confirmButtonItem}>
            <AppButton
              label="Продолжить"
              onPress={() => setShowFinishConfirm(false)}
              tone="primary"
              fullWidth
            />
          </View>
        </View>
      </AppBottomSheet>
    </>
  );
}

function ContextRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();

  return (
    <View style={styles.contextRow}>
      <Text style={[styles.contextLabel, { color: theme.semantic.textMuted }]}>{label}</Text>
      <Text style={[styles.contextValue, { color: theme.semantic.textPrimary }]}>{value}</Text>
    </View>
  );
}

function buildTrainingContextRows(scenario?: Scenario): Array<{ label: string; value: string }> {
  if (!scenario) {
    return [
      {
        label: "Сценарий",
        value: "Не выбран"
      },
      {
        label: "Формат",
        value: TRAINING_FORMAT_LABEL
      }
    ];
  }

  const persona = scenario.persona;
  const buyer = persona.roleTitle || "Руководитель производства";
  const context = persona.painPoints.length > 0
    ? persona.painPoints.join("; ")
    : DEFAULT_SCENARIO_CONTEXT.join("; ");
  const objections = persona.objectionStyle || "Проверяет сроки, простои, бюджет и риски внедрения";
  const rows = [
    { label: "Сценарий", value: scenario.title },
    { label: "Покупатель", value: buyer },
    { label: "Контекст", value: context },
    { label: "Возражение", value: objections },
    { label: "Цель", value: scenario.goal || DEFAULT_SCENARIO_GOAL }
  ];

  return rows.filter((row) => row.value.trim().length > 0);
}

function buildEmptyChatText({
  canStartDialogue,
  isCatalogLoading,
  simulatorUnavailableReason
}: {
  canStartDialogue: boolean;
  isCatalogLoading: boolean;
  simulatorUnavailableReason: string | null;
}): string {
  if (canStartDialogue) {
    return 'Нажмите "Старт", чтобы получить первую реплику ИИ-покупателя.';
  }

  if (isCatalogLoading) {
    return "Подключаем диалоговый сервис и загружаем сценарий.";
  }

  return simulatorUnavailableReason ?? "Диалоговый сервис не подключён.";
}

function buildDialogueStatusLabel({
  canStartDialogue,
  dialoguePhase,
  isCatalogLoading,
  simulatorUnavailableReason
}: {
  canStartDialogue: boolean;
  dialoguePhase: DialoguePhase;
  isCatalogLoading: boolean;
  simulatorUnavailableReason: string | null;
}): string {
  if (dialoguePhase === "active") {
    return "Диалог активен";
  }

  if (dialoguePhase === "finished") {
    return "Диалог завершён";
  }

  if (canStartDialogue) {
    return "Ожидает Старт";
  }

  return isCatalogLoading ? "Подключаем сервис" : simulatorUnavailableReason ?? "Сервис не подключён";
}

function formatScenarioTitle(title: string): string {
  return title.trim().toLowerCase() === "baseline"
    ? BASELINE_DISPLAY_SCENARIO.title
    : title;
}

function mapApiScenarioToScenario(item: SimulatorPublicScenarioDto, moduleId: string): Scenario {
  return {
    id: item.id,
    moduleId,
    title: formatScenarioTitle(item.title),
    goal: DEFAULT_SCENARIO_GOAL,
    difficulty: "medium",
    status: item.status,
    channel: "chat",
    targetCompetencies: BASELINE_DISPLAY_SCENARIO.targetCompetencies,
    persona: {
      id: `persona-${item.id}`,
      name: "ИИ-покупатель",
      company: "Производственное предприятие",
      roleTitle: "Руководитель производства",
      mood: "Деловой, рациональный, умеренно требовательный",
      painPoints: DEFAULT_SCENARIO_CONTEXT,
      objectionStyle: "Проверяет сроки, простои, бюджет и риски внедрения"
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
  confirmButtonRow: {
    flexDirection: "row",
    gap: 10
  },
  confirmButtonItem: {
    flex: 1
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
  desktopShell: {
    width: "100%",
    minHeight: 720,
    borderWidth: 0,
    borderRadius: 0,
    overflow: "hidden"
  },
  desktopHeader: {
    minHeight: 92,
    borderBottomWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16
  },
  desktopHeaderMain: {
    flex: 1,
    gap: 5
  },
  desktopTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "800"
  },
  desktopScenarioInfo: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600"
  },
  desktopHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    justifyContent: "flex-end"
  },
  statusBadge: {
    minHeight: 38,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 999
  },
  statusText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700"
  },
  desktopBody: {
    flex: 1,
    flexDirection: "row",
    minHeight: 656
  },
  sessionSidebar: {
    width: 288,
    borderRightWidth: 1
  },
  sidebarContent: {
    padding: 20,
    gap: 18
  },
  sidebarSection: {
    gap: 10
  },
  sidebarSectionTitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1
  },
  contextList: {
    gap: 9
  },
  contextRow: {
    gap: 2
  },
  contextLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "600"
  },
  contextValue: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "400"
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10
  },
  progressCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    gap: 10
  },
  progressLabel: {
    fontSize: 12,
    lineHeight: 16
  },
  progressValue: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800"
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    overflow: "hidden"
  },
  progressFill: {
    height: "100%",
    borderRadius: 999
  },
  progressNote: {
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700"
  },
  desktopChatMain: {
    flex: 1,
    minWidth: 0,
    padding: 20
  },
  desktopChatSurface: {
    flex: 1,
    minHeight: 640,
    borderWidth: 1,
    borderRadius: 24,
    overflow: "hidden"
  },
  desktopChatScroll: {
    flex: 1,
    minHeight: 0
  },
  desktopChatScrollContent: {
    flexGrow: 1,
    minHeight: 460,
    padding: 24,
    gap: 14
  },
  emptyChatState: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 520,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 6
  },
  emptyChatTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
    textAlign: "center"
  },
  emptyChatText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center"
  },
  desktopInputArea: {
    borderTopWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 10
  },
  desktopStatusMessage: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600"
  },
  desktopInputWrap: {
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
    shadowColor: "#2F8F5B",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2
  },
  desktopInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 132,
    fontSize: 15,
    lineHeight: 21,
    textAlignVertical: "top",
    paddingVertical: 8
  },
  desktopIdleActions: {
    gap: 12
  }
});
