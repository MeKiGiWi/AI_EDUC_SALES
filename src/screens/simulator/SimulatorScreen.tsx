import React, { useEffect, useMemo, useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";

import { ChatEmptyState } from "../../components/chat/ChatEmptyState";
import { ChatHeader } from "../../components/chat/ChatHeader";
import { ChatInput } from "../../components/chat/ChatInput";
import { ChatStateNotice } from "../../components/chat/ChatStateNotice";
import { MessageList } from "../../components/chat/MessageList";
import { QuickActions } from "../../components/chat/QuickActions";
import { AppBottomSheet } from "../../components/ui/AppBottomSheet";
import { AppButton } from "../../components/ui/AppButton";
import {
  DEFAULT_BACKEND_DIFFICULTY,
  API_SIMULATOR_MODULE_ID,
  MANAGER_REPLY_TARGET,
  buildTrainingContextRows,
  fallbackSimulatorScenarios,
  mapApiScenarioToScenario
} from "../../data/simulatorMvpData";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import { useSessionStorage } from "../../hooks/useSessionStorage";
import { simulatorApiService } from "../../services/simulatorApiService";
import { useTheme } from "../../theme/useTheme";
import type {
  ReportCard,
  Scenario,
  ScenarioMessage,
  SimulatorApiMessageDto,
  SimulatorEvaluationPayloadDto
} from "../../types/academy";

interface SimulatorScreenProps {
  activeScenarioId?: string;
  onOpenReport: (reportId?: string) => void;
  onReportSaved: (payload: {
    scenarioTitle: string;
    evaluation: SimulatorEvaluationPayloadDto;
  }) => Promise<ReportCard[]>;
}

type DialoguePhase = "idle" | "active" | "finished";
type NoticeState = { kind: "info" | "error" | "loading"; text: string } | null;

export function SimulatorScreen({
  activeScenarioId,
  onOpenReport,
  onReportSaved
}: SimulatorScreenProps) {
  const theme = useTheme();
  const layout = useResponsiveLayout();
  const apiEnabled = simulatorApiService.isEnabled();

  const [apiScenarios, setApiScenarios] = useState<Scenario[]>([]);
  const [isCatalogLoading, setIsCatalogLoading] = useState(false);
  const [simulatorUnavailableReason, setSimulatorUnavailableReason] = useState<string | null>(null);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | undefined>(activeScenarioId);
  const [messages, setMessages] = useState<ScenarioMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState<NoticeState>(null);
  const [sessionId, setSessionId] = useSessionStorage<string | null>("sim_session_id", null);
  const [dialoguePhase, setDialoguePhase] = useSessionStorage<DialoguePhase>("sim_dialogue_phase", "idle");
  const [isBusy, setIsBusy] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [showScenarioSheet, setShowScenarioSheet] = useState(false);
  const [pendingScenarioId, setPendingScenarioId] = useState<string | null>(null);
  const [latestReportId, setLatestReportId] = useState<string | undefined>();

  const catalogScenarios = useMemo(
    () => (apiScenarios.length > 0 ? apiScenarios : fallbackSimulatorScenarios),
    [apiScenarios]
  );
  const selectedScenario = useMemo(
    () => catalogScenarios.find((scenario) => scenario.id === selectedScenarioId),
    [catalogScenarios, selectedScenarioId]
  );
  const visibleMessages = useMemo(
    () => messages.filter((message) => message.speakerRole !== "system"),
    [messages]
  );
  const managerReplyCount = useMemo(
    () => visibleMessages.filter((message) => message.speakerRole === "learner").length,
    [visibleMessages]
  );
  const selectedScenarioIsApiScenario = apiScenarios.some(
    (scenario) => scenario.id === selectedScenario?.id
  );
  const canStartDialogue =
    apiEnabled && !isCatalogLoading && !simulatorUnavailableReason && selectedScenarioIsApiScenario;
  const hasActiveConversation = visibleMessages.length > 0 || dialoguePhase !== "idle";
  const reportProgress = Math.min(managerReplyCount / MANAGER_REPLY_TARGET, 1);
  const lastAssistantMessage = [...visibleMessages]
    .reverse()
    .find((message) => message.speakerRole === "customer" || message.speakerRole === "coach");
  const chatPlaceholder = buildInputPlaceholder(selectedScenario);
  const emptyReasonText = buildEmptyChatText({
    canStartDialogue,
    isCatalogLoading,
    simulatorUnavailableReason
  });
  const contextRows = useMemo(
    () => buildTrainingContextRows(selectedScenario),
    [selectedScenario]
  );
  const buyerLabel =
    contextRows.find((row) => row.label === "Покупатель")?.value ?? "Контакт не выбран";
  const goalLabel =
    contextRows.find((row) => row.label === "Цель")?.value ?? "Цель появится после выбора сценария";
  const remainingReplies = Math.max(MANAGER_REPLY_TARGET - managerReplyCount, 0);
  const headerStatus = buildHeaderStatus({
    canStartDialogue,
    dialoguePhase,
    isBusy,
    isCatalogLoading,
    notice
  });

  useEffect(() => {
    let isMounted = true;

    async function loadApiScenarios() {
      if (!apiEnabled) {
        if (!isMounted) {
          return;
        }

        setApiScenarios([]);
        setSelectedScenarioId((current) => current ?? fallbackSimulatorScenarios[0]?.id);
        setSimulatorUnavailableReason("Диалоговый сервис не подключен.");
        return;
      }

      try {
        setIsCatalogLoading(true);
        setSimulatorUnavailableReason(null);
        const items = await simulatorApiService.fetchSimulatorScenarios();
        if (!isMounted) {
          return;
        }

        const mappedScenarios = items.map((item) =>
          mapApiScenarioToScenario(item, API_SIMULATOR_MODULE_ID)
        );

        setApiScenarios(mappedScenarios);
        setSelectedScenarioId((current) =>
          current && mappedScenarios.some((scenario) => scenario.id === current)
            ? current
            : mappedScenarios[0]?.id ?? fallbackSimulatorScenarios[0]?.id
        );
        setSimulatorUnavailableReason(
          mappedScenarios.length > 0 ? null : "Диалоговый сервис не вернул сценарии."
        );
      } catch {
        if (!isMounted) {
          return;
        }

        setApiScenarios([]);
        setSelectedScenarioId((current) => current ?? fallbackSimulatorScenarios[0]?.id);
        setSimulatorUnavailableReason(
          "Диалоговый сервис временно недоступен. Попробуйте повторить позже."
        );
      } finally {
        if (isMounted) {
          setIsCatalogLoading(false);
        }
      }
    }

    void loadApiScenarios();

    return () => {
      isMounted = false;
    };
  }, [apiEnabled]);

  useEffect(() => {
    if (activeScenarioId) {
      setSelectedScenarioId(activeScenarioId);
    }
  }, [activeScenarioId]);

  function resetDialogue(clearNotice: boolean) {
    setMessages([]);
    setDraft("");
    setSessionId(null);
    setDialoguePhase("idle");
    setLatestReportId(undefined);
    if (clearNotice) {
      setNotice(null);
    }
  }

  function applyScenario(scenarioId: string) {
    setSelectedScenarioId(scenarioId);
    resetDialogue(true);
    setShowScenarioSheet(false);
    setPendingScenarioId(null);
  }

  function requestScenarioChange(scenarioId: string) {
    if (scenarioId === selectedScenarioId) {
      setShowScenarioSheet(false);
      return;
    }

    if (hasActiveConversation) {
      setPendingScenarioId(scenarioId);
      return;
    }

    applyScenario(scenarioId);
  }

  async function startDialogueSessionForScenario(currentScenario: Scenario) {
    if (!apiEnabled) {
      throw new Error("Диалоговый сервис не подключен.");
    }

    if (!canStartDialogue) {
      throw new Error(simulatorUnavailableReason ?? "Сценарий пока недоступен для запуска.");
    }

    const response = await simulatorApiService.startDialogueSession(
      currentScenario.id,
      DEFAULT_BACKEND_DIFFICULTY
    );
    setSessionId(response.session_id);
    setDialoguePhase("active");
    setLatestReportId(undefined);

    return {
      sessionId: response.session_id,
      openingMessage: mapApiMessageToChatMessage(response.message, currentScenario)
    };
  }

  async function startScenario() {
    if (!selectedScenario) {
      setNotice({ kind: "error", text: "Выберите сценарий, чтобы начать диалог." });
      return;
    }

    try {
      setIsBusy(true);
      setNotice({ kind: "loading", text: "Запускаем сценарий..." });
      const started = await startDialogueSessionForScenario(selectedScenario);
      setMessages([started.openingMessage]);
      setDraft("");
      setNotice(null);
    } catch (error) {
      setNotice({ kind: "error", text: formatHumanError(error) });
    } finally {
      setIsBusy(false);
    }
  }

  async function sendReply() {
    if (!selectedScenario) {
      setNotice({ kind: "error", text: "Выберите сценарий перед отправкой сообщения." });
      return;
    }

    const trimmedText = draft.trim();
    if (!trimmedText) {
      setNotice({ kind: "error", text: "Сначала добавьте сообщение." });
      return;
    }

    if (trimmedText.toLowerCase() === "стоп") {
      await finishScenario();
      return;
    }

    if (dialoguePhase === "finished") {
      setNotice({
        kind: "error",
        text: 'Диалог уже завершен. Нажмите "Начать новый", чтобы продолжить.'
      });
      return;
    }

    try {
      setIsBusy(true);
      setNotice({ kind: "loading", text: "AI готовит ответ..." });
      let activeSessionId = sessionId;
      let openingMessages: ScenarioMessage[] = [];

      if (dialoguePhase === "idle" || !activeSessionId) {
        const started = await startDialogueSessionForScenario(selectedScenario);
        activeSessionId = started.sessionId;
        openingMessages = [started.openingMessage];
      }

      const response = await simulatorApiService.sendDialogueMessage(activeSessionId, trimmedText);
      const learnerMessage: ScenarioMessage = {
        id: `msg-learner-${Date.now()}`,
        speakerName: "Вы",
        speakerRole: "learner",
        text: trimmedText,
        timestampLabel: formatTimestamp(new Date().toISOString())
      };
      const responseMessages = response.messages.map((message) =>
        mapApiMessageToChatMessage(message, selectedScenario)
      );

      setMessages((current) => [...current, ...openingMessages, learnerMessage, ...responseMessages]);
      setDraft("");

      if (response.status === "finished") {
        setDialoguePhase("finished");
        await persistLatestReport(selectedScenario, activeSessionId);
        return;
      }

      setNotice(null);
    } catch (error) {
      setNotice({ kind: "error", text: formatHumanError(error) });
    } finally {
      setIsBusy(false);
    }
  }

  async function finishScenario() {
    if (!selectedScenario) {
      setNotice({ kind: "error", text: "Выберите сценарий перед формированием отчета." });
      return;
    }

    if (dialoguePhase === "finished") {
      setNotice({ kind: "info", text: "Отчет уже сформирован. Его можно открыть во вкладке отчетов." });
      return;
    }

    if (dialoguePhase !== "active" || !sessionId) {
      setNotice({ kind: "error", text: "Сначала начните диалог и отправьте хотя бы одну реплику." });
      return;
    }

    if (managerReplyCount < MANAGER_REPLY_TARGET) {
      setShowFinishConfirm(true);
      return;
    }

    await finishActiveScenario();
  }

  async function finishActiveScenario() {
    if (!selectedScenario || !sessionId) {
      return;
    }

    try {
      setIsBusy(true);
      await persistLatestReport(selectedScenario, sessionId);
    } catch (error) {
      setNotice({ kind: "error", text: formatHumanError(error) });
    } finally {
      setIsBusy(false);
      setShowFinishConfirm(false);
    }
  }

  async function persistLatestReport(currentScenario: Scenario, activeSessionId: string) {
    const maxAttempts = 3;
    const retryDelayMs = 2000;
    let evaluation: SimulatorEvaluationPayloadDto | undefined;

    setNotice({
      kind: "loading",
      text: "Отчет формируется. Вы можете продолжить работу, он появится в отчетах после завершения."
    });

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await simulatorApiService.finishDialogueSession(activeSessionId);
        if (response.evaluation) {
          evaluation = response.evaluation;
          break;
        }
      } catch (error) {
        if (attempt === maxAttempts) {
          throw error;
        }
      }

      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      }
    }

    setDialoguePhase("finished");
    setDraft("");

    if (!evaluation) {
      setNotice({
        kind: "error",
        text: "Диалог завершен, но отчет не был получен. Попробуйте сформировать отчет еще раз."
      });
      return;
    }

    const savedReports = await onReportSaved({
      scenarioTitle: currentScenario.title,
      evaluation
    });
    setLatestReportId(savedReports[0]?.id);
    setNotice({ kind: "info", text: 'Отчет готов и сохранен во вкладке "Отчеты".' });
  }

  async function handleCopyLastAnswer() {
    const text = lastAssistantMessage?.text;
    if (!text) {
      setNotice({ kind: "error", text: "Пока нет ответа AI для копирования." });
      return;
    }

    if (
      Platform.OS === "web" &&
      typeof navigator !== "undefined" &&
      navigator.clipboard?.writeText
    ) {
      await navigator.clipboard.writeText(text);
    }

    setNotice({ kind: "info", text: "Ответ скопирован." });
  }

  return (
    <>
      <View style={[styles.screen, layout.isDesktop && styles.screenDesktop]}>
        <View
          style={[
            styles.chatSurface,
            layout.isDesktop && styles.chatSurfaceDesktop,
            {
              backgroundColor: theme.semantic.card,
              borderColor: theme.semantic.border,
              borderRadius: theme.radius.xl
            }
          ]}
        >
          <ChatHeader
            scenario={selectedScenario}
            statusLabel={headerStatus.label}
            statusTone={headerStatus.tone}
            hasReport={Boolean(latestReportId)}
            onChangeScenario={() => setShowScenarioSheet(true)}
            onOpenReport={() => onOpenReport(latestReportId)}
          />
          <View
            style={[
              styles.insightPanel,
              layout.isMobile && styles.insightPanelMobile,
              {
                backgroundColor: theme.semantic.card,
                borderColor: theme.semantic.borderSubtle
              }
            ]}
          >
            <View style={styles.contextSummary}>
              <Text style={[styles.insightLabel, { color: theme.semantic.textMuted }]}>Контекст</Text>
              <Text style={[styles.insightTitle, { color: theme.semantic.textPrimary }]} numberOfLines={1}>
                {buyerLabel}
              </Text>
              <Text style={[styles.insightText, { color: theme.semantic.textSecondary }]} numberOfLines={1}>
                {goalLabel}
              </Text>
            </View>
            <View
              style={[
                styles.progressSummary,
                layout.isMobile && styles.progressSummaryMobile,
                { borderColor: theme.semantic.borderSubtle }
              ]}
            >
              <View style={styles.progressTopLine}>
                <Text style={[styles.insightLabel, { color: theme.semantic.textMuted }]}>Прогресс</Text>
                <Text style={[styles.progressCount, { color: theme.semantic.textPrimary }]}>
                  {managerReplyCount}/{MANAGER_REPLY_TARGET}
                </Text>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: theme.semantic.borderSubtle }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${reportProgress * 100}%`,
                      backgroundColor: theme.semantic.actionPrimary
                    }
                  ]}
                />
              </View>
              <Text style={[styles.insightText, { color: theme.semantic.textSecondary }]} numberOfLines={1}>
                {remainingReplies === 0
                  ? "Достаточно данных для отчета."
                  : `До отчета: ${remainingReplies} реплик.`}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.chatBody,
              layout.isDesktop && styles.chatBodyDesktop,
              { backgroundColor: theme.semantic.cardSubtle }
            ]}
          >
            {visibleMessages.length > 0 ? (
              <MessageList messages={visibleMessages} />
            ) : (
              <ChatEmptyState
                selectedScenario={selectedScenario}
                scenarios={catalogScenarios}
                canStartDialogue={canStartDialogue}
                reasonText={emptyReasonText}
                onPickScenario={applyScenario}
                onStart={startScenario}
              />
            )}
          </View>

          <View
            style={[
              styles.inputDock,
              layout.isMobile && styles.inputDockMobile,
              {
                backgroundColor: theme.semantic.card,
                borderColor: theme.semantic.borderSubtle
              }
            ]}
          >
            {notice ? (
              <ChatStateNotice
                kind={notice.kind}
                text={notice.text}
                actionLabel={notice.kind === "error" ? "Повторить" : undefined}
                onAction={notice.kind === "error" ? startScenario : undefined}
              />
            ) : null}
            {isBusy && !notice ? (
              <ChatStateNotice kind="loading" text="AI отвечает..." />
            ) : null}
            <QuickActions
              canGenerateReport={dialoguePhase === "active" && visibleMessages.length > 0}
              canCopy={Boolean(lastAssistantMessage)}
              busy={isBusy}
              onGenerateReport={() => { void finishScenario(); }}
              onCopy={() => { void handleCopyLastAnswer(); }}
            />
            <ChatInput
              value={draft}
              placeholder={chatPlaceholder}
              disabled={isBusy || !selectedScenario || (!canStartDialogue && dialoguePhase === "idle")}
              onChangeText={setDraft}
              onSend={() => { void sendReply(); }}
            />
          </View>
        </View>
      </View>

      <AppBottomSheet
        visible={showScenarioSheet}
        title="Сценарии"
        description="Выберите режим для нового диалога."
        onClose={() => {
          setShowScenarioSheet(false);
          setPendingScenarioId(null);
        }}
      >
        <ScrollView contentContainerStyle={styles.scenarioSheetList} showsVerticalScrollIndicator={false}>
          {catalogScenarios.map((scenario) => (
            <View
              key={scenario.id}
              style={[
                styles.scenarioRow,
                {
                  borderColor:
                    scenario.id === selectedScenarioId
                      ? theme.semantic.actionPrimary
                      : theme.semantic.border,
                  backgroundColor:
                    scenario.id === selectedScenarioId
                      ? theme.semantic.cardAccent
                      : theme.semantic.card
                }
              ]}
            >
              <View style={styles.scenarioText}>
                <Text style={[styles.scenarioTitle, { color: theme.semantic.textPrimary }]}>
                  {scenario.title}
                </Text>
                <Text style={[styles.scenarioDescription, { color: theme.semantic.textSecondary }]}>
                  {scenario.goal}
                </Text>
              </View>
              <AppButton
                label={scenario.id === selectedScenarioId ? "Активен" : "Выбрать"}
                onPress={() => requestScenarioChange(scenario.id)}
                tone={scenario.id === selectedScenarioId ? "secondary" : "primary"}
              />
            </View>
          ))}
        </ScrollView>
      </AppBottomSheet>

      <AppBottomSheet
        visible={Boolean(pendingScenarioId)}
        title="Начать новый диалог?"
        description="При смене сценария текущий чат будет очищен."
        onClose={() => setPendingScenarioId(null)}
        hideCloseButton
        centeredHeader
      >
        <View style={styles.confirmButtonRow}>
          <View style={styles.confirmButtonItem}>
            <AppButton
              label="Отмена"
              onPress={() => setPendingScenarioId(null)}
              tone="secondary"
              fullWidth
            />
          </View>
          <View style={styles.confirmButtonItem}>
            <AppButton
              label="Начать новый"
              onPress={() => {
                if (pendingScenarioId) {
                  applyScenario(pendingScenarioId);
                }
              }}
              tone="primary"
              fullWidth
            />
          </View>
        </View>
      </AppBottomSheet>

      <AppBottomSheet
        visible={showFinishConfirm}
        title="Диалог пока короткий для полноценной оценки"
        description={`Сейчас: ${managerReplyCount} из ${MANAGER_REPLY_TARGET} реплик менеджера.`}
        onClose={() => setShowFinishConfirm(false)}
        hideCloseButton
        centeredHeader
      >
        <Text style={[styles.confirmText, { color: theme.semantic.textSecondary }]}>
          Можно продолжить диалог или сформировать черновой отчет по текущим данным.
        </Text>
        <View style={styles.confirmButtonRow}>
          <View style={styles.confirmButtonItem}>
            <AppButton
              label="Отмена"
              onPress={() => setShowFinishConfirm(false)}
              tone="secondary"
              fullWidth
            />
          </View>
          <View style={styles.confirmButtonItem}>
            <AppButton
              label="Сформировать отчет"
              onPress={() => { void finishActiveScenario(); }}
              tone="primary"
              fullWidth
              disabled={isBusy}
            />
          </View>
        </View>
      </AppBottomSheet>
    </>
  );
}

function buildInputPlaceholder(scenario?: Scenario): string {
  if (!scenario) {
    return "Выберите сценарий, чтобы начать...";
  }

  if (scenario.title.toLowerCase().includes("отчет")) {
    return "Опишите задачу для анализа...";
  }

  if (scenario.title.toLowerCase().includes("документ")) {
    return "Загрузите документ или задайте вопрос...";
  }

  return "Опишите задачу или ответьте клиенту...";
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
    return "Напишите сообщение, чтобы начать диалог.";
  }

  if (isCatalogLoading) {
    return "Загружаем сценарии и подключаем диалоговый сервис.";
  }

  return simulatorUnavailableReason ?? "Диалоговый сервис не подключен.";
}

function buildHeaderStatus({
  canStartDialogue,
  dialoguePhase,
  isBusy,
  isCatalogLoading,
  notice
}: {
  canStartDialogue: boolean;
  dialoguePhase: DialoguePhase;
  isBusy: boolean;
  isCatalogLoading: boolean;
  notice: NoticeState;
}): { label: string; tone: "ready" | "loading" | "needsData" | "error" } {
  if (notice?.kind === "error") {
    return { label: "Ошибка", tone: "error" };
  }

  if (isBusy || isCatalogLoading) {
    return { label: "Генерация", tone: "loading" };
  }

  if (!canStartDialogue && dialoguePhase === "idle") {
    return { label: "Нужны данные", tone: "needsData" };
  }

  return { label: "Готов", tone: "ready" };
}

function formatHumanError(error: unknown): string {
  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Не удалось выполнить действие. Попробуйте повторить.";
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
  screen: {
    gap: 14
  },
  screenDesktop: {
    minHeight: 720
  },
  chatSurface: {
    borderWidth: 1,
    overflow: "hidden",
    minHeight: 690
  },
  chatSurfaceDesktop: {
    minHeight: 760
  },
  chatBody: {
    minHeight: 410,
    paddingHorizontal: 14
  },
  chatBodyDesktop: {
    minHeight: 540,
    paddingHorizontal: 22
  },
  inputDock: {
    borderTopWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 8
  },
  inputDockMobile: {
    paddingBottom: 18
  },
  insightPanel: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "stretch",
    gap: 12
  },
  insightPanelMobile: {
    flexDirection: "column"
  },
  contextSummary: {
    flex: 1,
    minWidth: 0,
    gap: 4
  },
  progressSummary: {
    width: 300,
    borderLeftWidth: 1,
    paddingLeft: 14,
    gap: 8
  },
  progressSummaryMobile: {
    width: "100%",
    borderLeftWidth: 0,
    borderTopWidth: 1,
    paddingLeft: 0,
    paddingTop: 12
  },
  progressTopLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10
  },
  insightLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  insightTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800"
  },
  insightText: {
    fontSize: 13,
    lineHeight: 18
  },
  progressCount: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "800"
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: "hidden"
  },
  progressFill: {
    height: "100%",
    borderRadius: 999
  },
  scenarioSheetList: {
    gap: 10
  },
  scenarioRow: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  scenarioText: {
    flex: 1,
    minWidth: 0,
    gap: 5
  },
  scenarioTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "800"
  },
  scenarioDescription: {
    fontSize: 14,
    lineHeight: 20
  },
  confirmText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center"
  },
  confirmButtonRow: {
    flexDirection: "row",
    gap: 10
  },
  confirmButtonItem: {
    flex: 1
  }
});
