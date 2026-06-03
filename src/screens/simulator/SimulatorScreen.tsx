import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextStyle
} from "react-native";

import { ChatStateNotice } from "../../components/chat/ChatStateNotice";
import { AppBottomSheet } from "../../components/ui/AppBottomSheet";
import {
  calculateDialogueProgress,
  countManagerReplies
} from "../../services/simulatorDialogueService";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import { useTheme } from "../../theme/useTheme";
import type { ActiveDialogueSession, SalesAcademyMock, ScenarioCardItem } from "../../types/academy";

interface SimulatorScreenProps {
  data: SalesAcademyMock;
  activeScenarioId?: string;
  activeSession: ActiveDialogueSession | null;
  mode: "catalog" | "dialogue";
  onStartScenario: (scenarioId: string) => void;
  onBackToCatalog: () => void;
  onBackToLanding: () => void;
  onSendMessage: (text: string) => Promise<boolean>;
  onFinishScenario: (params: { scenarioId: string; scenarioTitle: string }) => void;
  startErrorText?: string | null;
  onDismissStartError?: () => void;
}

// Landing-style palette (mirrors LandingScreen). Maps the old theme color tokens
// onto the landing look without touching layout/spacing/shadow logic.
const NAVY = "#121a68";
const LIME = "#9cf000";
const LIME_2 = "#b8ff43";
const TEXT = "#1f2559";
const MUTED = "#60688d";
const LINE = "#dfe3f2";
const SOFT = "#f6f8ff";
const SOFT_2 = "#eef2ff";
const LIME_PILL = "#edf8ce";
// Single unified blue tint (navy family) used for every soft-filled element.
const TINT = "#dbe6f7";
const TINT_BORDER = "#c4d4ee";
const FONT_FAMILY = Platform.OS === "web" ? "Inter, system-ui, sans-serif" : undefined;

const LP = {
  textPrimary: NAVY,
  textSecondary: MUTED,
  textMuted: "#9aa3c9",
  border: LINE,
  borderSubtle: "#eef1fa",
  card: "#ffffff",
  backgroundWarm: SOFT,
  actionPrimary: NAVY,
  success: "#5bbf2e",
  warning: "#c8951f",
  info: NAVY,
  primaryPale: LIME_PILL,
  primarySoft: LIME_2,
  surfaceMint: "#f4fbe0"
};

function webBg(gradient: string, fallback: string) {
  if (Platform.OS === "web") {
    return { backgroundColor: fallback, backgroundImage: gradient } as unknown as TextStyle;
  }
  return { backgroundColor: fallback };
}

const trainerFilters = ["Все", "Новые"] as const;
const chatInputWebReset = {
  outlineStyle: "none",
  scrollbarWidth: "none"
} as unknown as TextStyle;

type SimulatorInfoSheetState =
  | {
      title: string;
      description: string;
      lines: string[];
    }
  | null;

type WebTextInputKeyEvent = {
  preventDefault?: () => void;
  nativeEvent: {
    key: string;
    shiftKey?: boolean;
  };
};

export function SimulatorScreen({
  data,
  activeScenarioId,
  activeSession,
  mode,
  onStartScenario,
  onBackToCatalog,
  onBackToLanding,
  onSendMessage,
  onFinishScenario,
  startErrorText = null,
  onDismissStartError
}: SimulatorScreenProps) {
  const theme = useTheme();
  const layout = useResponsiveLayout();
  const [segment, setSegment] = useState<"B2B" | "B2C">("B2B");
  const [activeFilter, setActiveFilter] = useState<(typeof trainerFilters)[number]>("Все");
  const [infoSheet, setInfoSheet] = useState<SimulatorInfoSheetState>(null);

  const selectedScenario = data.scenarios.find((scenario) => scenario.id === activeScenarioId);
  const featuredScenario = selectedScenario ?? data.scenarios[0];
  const filteredScenarios = useMemo(() => {
    return data.scenarios.filter((scenario) => {
      if (scenario.segment !== segment) {
        return false;
      }

      if (activeFilter === "Новые") {
        return scenario.status === "new";
      }

      return true;
    });
  }, [activeFilter, data.scenarios, segment]);

  function openProgressInfo() {
    setInfoSheet({
      title: "Состояние тренажера",
      description:
        "Каталог показывает тот набор сценариев, который реально доступен в текущем мобильном MVP.",
      lines: [
        `Активный сегмент: ${segment}.`,
        `Текущий фильтр: ${activeFilter}.`,
        "После завершения тренировки отчет сохраняется и открывается автоматически."
      ]
    });
  }

  function openTrainerHelp() {
    setInfoSheet({
      title: "Как пройти тренировку",
      description: "Тренажер больше не оставляет пустых действий и подсказывает следующий шаг.",
      lines: [
        "Выберите карточку сценария и начните диалог из каталога.",
        "Если backend не подтверждает сценарий, UI покажет ошибку вместо тихого fallback.",
        "Завершение диалога создает отчет и переводит в просмотр результата."
      ]
    });
  }

  if (mode === "dialogue") {
    if (!selectedScenario) {
      return (
        <View style={styles.screen}>
          <ChatStateNotice
            kind="error"
            text="Выбранный сценарий не найден. Вернитесь к списку и выберите доступный сценарий."
            actionLabel="К списку сценариев"
            onAction={onBackToCatalog}
          />
        </View>
      );
    }

    return (
      <DialogueView
        data={data}
        selectedScenario={selectedScenario}
        activeSession={activeSession}
        onBackToCatalog={onBackToCatalog}
        onRestartScenario={onStartScenario}
        onSendMessage={onSendMessage}
        onFinishScenario={onFinishScenario}
      />
    );
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.headerRow, !layout.isDesktop && styles.headerStack]}>
        <View style={styles.headerBlock}>
          <Text style={[styles.pageTitle, { color: LP.textPrimary }]}>ИИ-Тренажер</Text>
          <Text style={[styles.pageSubtitle, { color: LP.textSecondary }]}>
            Практикуйте навыки продаж в реалистичных сценариях.
          </Text>
          <Text style={[styles.pageSubtitle, { color: LP.textSecondary }]}>
            Выберите модуль и начните тренировку.
          </Text>
        </View>
        {!layout.isDesktop ? (
          <View style={styles.headerActions}>
            <Pressable
              onPress={onBackToLanding}
              style={({ pressed }) => [styles.backToLanding, { borderColor: LP.border }, pressed && styles.pressed]}
            >
              <Text style={[styles.backToLandingText, { color: LP.textSecondary }]}>← На лендинг</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      {startErrorText ? (
        <ChatStateNotice
          kind="error"
          text={startErrorText}
          actionLabel="Закрыть"
          onAction={onDismissStartError}
        />
      ) : null}

      <View style={styles.segmentBlock}>
        <View
          style={[
            styles.segmentedControl,
            { backgroundColor: "rgba(18,26,104,0.05)", borderColor: "transparent" }
          ]}
        >
          <SegmentButton
            label="B2B"
            active={segment === "B2B"}
            onPress={() => setSegment("B2B")}
          />
          <SegmentButton
            label="B2C"
            active={segment === "B2C"}
            onPress={() => setSegment("B2C")}
          />
        </View>
      </View>

      <View style={[styles.heroPanel, webBg("linear-gradient(135deg, #121a68 0%, #232f9c 100%)", NAVY)]}>
        <View style={[styles.heroDecor, styles.heroDecorTop]} />
        <View style={[styles.heroDecor, styles.heroDecorBottom]} />
        <View style={[styles.heroContent, !layout.isWide && styles.heroStack]}>
          <View style={styles.heroText}>
            <View style={styles.heroEyebrow}>
              <View style={styles.heroEyebrowDot} />
              <Text style={styles.heroEyebrowText}>Продолжить с места остановки</Text>
            </View>
            <Text style={styles.heroTitle}>{featuredScenario.title}</Text>
            <Text style={styles.heroDescription}>{featuredScenario.description}</Text>
            <View style={styles.heroPills}>
              <View style={styles.heroMetaPill}>
                <Text style={styles.heroMetaPillText}>{featuredScenario.duration}</Text>
              </View>
              <View style={styles.heroMetaPill}>
                <Text style={styles.heroMetaPillText}>Уровень: {featuredScenario.level}</Text>
              </View>
            </View>
          </View>

          <View
            style={[
              styles.heroIllustrationWrap,
              !layout.isWide && styles.heroIllustrationWrapMobile
            ]}
          >
            <Pressable
              onPress={() => onStartScenario(featuredScenario.id)}
              style={({ pressed }) => [styles.heroCta, pressed && styles.pressed]}
            >
              <Text style={styles.heroCtaText}>Начать тренировку</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View style={[styles.filtersRow, !layout.isDesktop && styles.filtersStack]}>
        <View style={styles.filterPills}>
          {trainerFilters.map((label) => (
            <Pressable
              key={label}
              onPress={() => setActiveFilter(label)}
              style={[
                styles.filterPill,
                {
                  backgroundColor: activeFilter === label ? NAVY : LP.card,
                  borderColor: activeFilter === label ? NAVY : LP.border
                }
              ]}
            >
              <Text
                style={[
                  styles.filterPillText,
                  { color: activeFilter === label ? "#ffffff" : LP.textPrimary }
                ]}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.cardGrid}>
        {filteredScenarios.map((scenario) => (
          <ScenarioTile
            key={scenario.id}
            scenario={scenario}
            onPlay={() => onStartScenario(scenario.id)}
          />
        ))}
      </View>

      <AppBottomSheet
        visible={infoSheet !== null}
        title={infoSheet?.title ?? ""}
        description={infoSheet?.description}
        onClose={() => setInfoSheet(null)}
      >
        {infoSheet?.lines.map((line) => (
          <Text key={line} style={[styles.sheetLine, { color: LP.textPrimary }]}>
            • {line}
          </Text>
        ))}
      </AppBottomSheet>
    </View>
  );
}

function DialogueView({
  data,
  selectedScenario,
  activeSession,
  onBackToCatalog,
  onRestartScenario,
  onSendMessage,
  onFinishScenario
}: {
  data: SalesAcademyMock;
  selectedScenario: ScenarioCardItem;
  activeSession: ActiveDialogueSession | null;
  onBackToCatalog: () => void;
  onRestartScenario: (scenarioId: string) => void;
  onSendMessage: (text: string) => Promise<boolean>;
  onFinishScenario: (params: { scenarioId: string; scenarioTitle: string }) => void;
}) {
  const theme = useTheme();
  const layout = useResponsiveLayout();
  const dialogue = data.activeDialogue;
  const [draftMessage, setDraftMessage] = useState("");
  const messageScrollRef = useRef<ScrollView | null>(null);

  const messages = activeSession?.messages ?? [];
  const managerReplyCount = countManagerReplies(messages);
  const progress = calculateDialogueProgress(messages, dialogue.replyTarget);
  const visibleReplyCountLabel = `${managerReplyCount} / ${dialogue.replyTarget}`;
  const isSending = activeSession?.isSending ?? false;
  const isFinishing = activeSession?.isFinishing ?? false;
  const hasEnoughRepliesForReport = managerReplyCount >= dialogue.replyTarget;
  const canFinishScenario = hasEnoughRepliesForReport && !isFinishing;
  const isSessionActive = activeSession?.status === "active";
  const typingVisible = isSending;
  const typingDotsOpacity = useRef(new Animated.Value(0.35)).current;
  const errorText = activeSession?.errorText ?? null;
  const desktopTopOffset = 0;
  const appBottomPadding = layout.isDesktop ? theme.spacing.screenBottom : theme.spacing.screenBottom + 24;
  const desktopAvailableHeight =
    theme.viewport.height - theme.spacing.screenTop - appBottomPadding - desktopTopOffset;
  const dialogueHeight = layout.isDesktop
    ? Math.max(desktopAvailableHeight, 380)
    : Math.max(theme.viewport.height - theme.spacing.screenTop * 2, 520);
  const dialogueBodyHeight = Math.max(dialogueHeight - 52, 328);
  const mobileMessageListMaxHeight = Math.min(Math.max(theme.viewport.height * 0.42, 280), 420);
  const showScenarioIntro = managerReplyCount === 0;

  useEffect(() => {
    setDraftMessage("");
  }, [activeSession?.sessionId]);

  useEffect(() => {
    scrollToBottom(false);
  }, [activeSession?.sessionId]);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages.length, typingVisible]);

  useEffect(() => {
    if (!typingVisible) {
      typingDotsOpacity.stopAnimation();
      typingDotsOpacity.setValue(0.35);
      return;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(typingDotsOpacity, { toValue: 1, duration: 420, useNativeDriver: true }),
        Animated.timing(typingDotsOpacity, {
          toValue: 0.35,
          duration: 420,
          useNativeDriver: true
        })
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [typingVisible, typingDotsOpacity]);

  function scrollToBottom(animated: boolean) {
    messageScrollRef.current?.scrollToEnd({ animated });
  }

  async function handleSendMessage() {
    const messageToSend = draftMessage;
    const trimmedMessage = messageToSend.trim();

    if (!trimmedMessage) {
      const wasSent = await onSendMessage(messageToSend);
      if (wasSent) {
        setDraftMessage("");
      }
      return;
    }

    setDraftMessage("");
    const wasSent = await onSendMessage(messageToSend);
    if (!wasSent) {
      setDraftMessage(messageToSend);
    }
  }

  function handleInputKeyPress(event: unknown) {
    if (Platform.OS !== "web") {
      return;
    }

    const webEvent = event as WebTextInputKeyEvent;
    if (webEvent.nativeEvent.key !== "Enter" || webEvent.nativeEvent.shiftKey) {
      return;
    }

    webEvent.preventDefault?.();
    void handleSendMessage();
  }

  return (
    <View
      style={[
        styles.screen,
        !layout.isDesktop && styles.screenMobileDialogue,
        layout.isDesktop && { height: dialogueHeight, gap: 10, marginTop: desktopTopOffset }
      ]}
    >
      <View style={[styles.dialogueHeader, !layout.isDesktop && styles.headerStack]}>
        <Text style={[styles.pageTitle, { color: LP.textPrimary }]}>ИИ-Тренажер</Text>
        {!layout.isDesktop ? (
          <View
            style={[
              styles.dialogueHeaderCenter,
              styles.dialogueHeaderCenterStack
            ]}
          >
            <Pressable
              onPress={onBackToCatalog}
              style={[
                styles.changeScenarioButton,
                { backgroundColor: LP.card, borderColor: LP.border }
              ]}
            >
              <Text style={[styles.changeScenarioIcon, { color: LP.textSecondary }]}>
                ⇄
              </Text>
              <Text style={[styles.changeScenarioText, { color: LP.textPrimary }]}>
                Сменить сценарий
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <View
        style={[
          styles.dialogueLayout,
          !layout.isDesktop && styles.dialogueLayoutStack,
          layout.isDesktop && styles.dialogueLayoutDesktop,
          layout.isDesktop && { flex: 1, height: dialogueBodyHeight }
        ]}
      >
        <View
          testID="simulator-chat-panel"
          style={[
            styles.chatPanel,
            !layout.isDesktop && styles.chatPanelMobile,
            {
              backgroundColor: LP.card,
              borderColor: LP.border,
              shadowColor: theme.shadows.card.shadowColor,
              shadowOpacity: theme.shadows.card.shadowOpacity,
              shadowRadius: theme.shadows.card.shadowRadius,
              shadowOffset: theme.shadows.card.shadowOffset,
              elevation: theme.shadows.card.elevation
            }
          ]}
        >
          <View style={[styles.chatTopBar, { borderBottomColor: LP.borderSubtle }]}>
            <View style={styles.chatTopLeft}>
              <Text style={[styles.chatTopMeta, { color: LP.textSecondary }]}>
                Реплики менеджера:{" "}
                <Text
                  style={[styles.chatTopMetaStrong, { color: LP.textPrimary }]}
                >
                  {visibleReplyCountLabel}
                </Text>
              </Text>
              <View
                style={[
                  styles.chatProgressTrack,
                  { backgroundColor: LP.borderSubtle }
                ]}
              >
                <View
                  style={[
                    styles.chatProgressFill,
                    { backgroundColor: LIME, width: `${progress}%` }
                  ]}
                />
              </View>
            </View>
            <View style={styles.chatTopRight}>
              <View style={styles.chatStatusRow}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor:
                        activeSession?.status === "finished" ? LP.textMuted : LIME
                    }
                  ]}
                />
                <Text style={[styles.chatTopMeta, { color: LP.textSecondary }]}>
                  {activeSession?.status === "finished" ? "Сессия завершена" : dialogue.status}
                </Text>
              </View>
              <Text style={[styles.chatTopMeta, { color: LP.textSecondary }]}>
                {messages[messages.length - 1]?.time ?? dialogue.time}
              </Text>
            </View>
          </View>

          <View style={styles.personaRow}>
            <View
              style={[
                styles.personaAvatar,
                { backgroundColor: NAVY, borderColor: NAVY }
              ]}
            >
              <Text style={[styles.personaAvatarText, { color: "#ffffff" }]}>
                РП
              </Text>
            </View>
            <View style={styles.personaText}>
              <Text style={[styles.personaName, { color: LP.textPrimary }]}>
                {dialogue.persona.name}
              </Text>
              <Text style={[styles.personaMeta, { color: LP.textSecondary }]}>
                Компания: {dialogue.persona.company}
              </Text>
              <Text style={[styles.personaMeta, { color: LP.textSecondary }]}>
                Отдел: {dialogue.persona.department}
              </Text>
            </View>
          </View>

          {errorText ? (
            <View style={styles.errorNoticeWrap}>
              <View style={styles.errorNoticeRow}>
                <View style={styles.errorNoticeCard}>
                  <ChatStateNotice
                    kind="error"
                    text={errorText}
                    testID="simulator-chat-error"
                  />
                </View>
                {activeSession?.status === "finished" ? (
                  <Pressable
                    testID="simulator-restart-button"
                    accessibilityLabel="Запустить сценарий заново"
                    onPress={() => onRestartScenario(selectedScenario.id)}
                    style={[
                      styles.restartScenarioButton,
                      {
                        backgroundColor: LP.card,
                        borderColor: LP.border
                      }
                    ]}
                  >
                    <Text
                      style={[
                        styles.restartScenarioButtonText,
                        { color: LP.actionPrimary }
                      ]}
                    >
                      ↻
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          ) : null}

          <ScrollView
            ref={messageScrollRef}
            testID="simulator-message-list"
            style={[
              styles.messageList,
              layout.isDesktop && styles.messageListDesktop,
              !layout.isDesktop && { maxHeight: mobileMessageListMaxHeight, marginBottom: 0 }
            ]}
            contentContainerStyle={[
              styles.messageListContent,
              layout.isDesktop && styles.messageListContentDesktop,
              !layout.isDesktop && styles.messageListContentMobile
            ]}
            showsVerticalScrollIndicator
            onContentSizeChange={() => scrollToBottom(true)}
            onLayout={() => scrollToBottom(false)}
          >
            {messages.map((message) => (
              <View
                key={message.id}
                testID={
                  message.author === "manager"
                    ? "simulator-message-manager"
                    : "simulator-message-customer"
                }
                style={[
                  styles.messageBubble,
                  message.author === "manager"
                    ? styles.messageBubbleManager
                    : styles.messageBubbleCustomer,
                  {
                    backgroundColor: message.author === "manager" ? TINT : "#ffffff",
                    borderColor: message.author === "manager" ? TINT_BORDER : LINE
                  }
                ]}
              >
                <Text style={[styles.messageText, { color: TEXT }]}>
                  {message.text}
                </Text>
                <Text style={[styles.messageTime, { color: LP.textMuted }]}>
                  {message.time}
                </Text>
              </View>
            ))}

            {typingVisible ? (
              <View testID="simulator-typing-indicator" style={styles.typingRow}>
                <View
                  style={[
                    styles.typingDots,
                    {
                      backgroundColor: LP.backgroundWarm,
                      borderColor: LP.border
                    }
                  ]}
                >
                  <Animated.Text
                    style={[
                      styles.typingDotsText,
                      { color: LP.textMuted, opacity: typingDotsOpacity }
                    ]}
                  >
                    ...
                  </Animated.Text>
                </View>
                <Text style={[styles.typingText, { color: LP.textMuted }]}>
                  Печатает
                </Text>
              </View>
            ) : null}
          </ScrollView>

          {showScenarioIntro ? (
            <View pointerEvents="none" style={styles.scenarioIntroOverlay}>
              <View
                testID="simulator-scenario-intro"
                style={[
                  styles.scenarioIntroCard,
                  {
                    backgroundColor: "rgba(238, 248, 241, 0.74)",
                    borderColor: "rgba(216, 230, 221, 0.72)"
                  }
                ]}
              >
                <Text style={[styles.scenarioIntroTitle, { color: LP.textPrimary }]}>
                  Контекст сценария
                </Text>
                <Text style={[styles.scenarioIntroLine, { color: LP.textPrimary }]}>
                  <Text style={styles.scenarioIntroStrong}>Продукт:</Text> Промышленные кондиционеры
                </Text>
                <Text style={[styles.scenarioIntroLine, { color: LP.textPrimary }]}>
                  <Text style={styles.scenarioIntroStrong}>Ситуация:</Text> Входящий запрос, первый контакт
                </Text>
                <Text style={[styles.scenarioIntroLine, { color: LP.textPrimary }]}>
                  <Text style={styles.scenarioIntroStrong}>Цель:</Text> Договориться о следующем шаге
                </Text>
              </View>
            </View>
          ) : null}

          {layout.isDesktop ? (
            <View
              pointerEvents="none"
              style={[styles.inputFooterBackdrop, { backgroundColor: LP.card }]}
            />
          ) : null}

          <View
            testID="simulator-chat-input-row"
            style={[
              styles.inputWrap,
              !layout.isDesktop && styles.inputWrapMobile,
              {
                backgroundColor: LP.card,
                borderTopColor: LP.borderSubtle
              }
            ]}
          >
            <View
              style={[
                styles.inputRow,
                { backgroundColor: LP.card, borderColor: LP.border }
              ]}
            >
              <TextInput
                testID="simulator-chat-input"
                accessibilityLabel="Поле ввода сообщения в тренажере"
                placeholder="Напишите сообщение..."
                placeholderTextColor={LP.textMuted}
                style={[styles.chatInput, chatInputWebReset, { color: LP.textPrimary }]}
                value={draftMessage}
                onChangeText={setDraftMessage}
                onKeyPress={handleInputKeyPress}
                onSubmitEditing={() => {
                  void handleSendMessage();
                }}
                multiline
                textAlignVertical="center"
                editable={!isSending && isSessionActive && !isFinishing}
                scrollEnabled
                numberOfLines={2}
                maxLength={4000}
              />
              <Pressable
                testID="simulator-send-button"
                accessibilityLabel="Отправить сообщение"
                onPress={() => {
                  void handleSendMessage();
                }}
                disabled={!draftMessage.trim() || isSending || !isSessionActive || isFinishing}
                style={[
                  styles.sendButton,
                  {
                    backgroundColor:
                      !draftMessage.trim() || isSending || !isSessionActive || isFinishing
                        ? LP.backgroundWarm
                        : LP.actionPrimary,
                    borderColor:
                      !draftMessage.trim() || isSending || !isSessionActive || isFinishing
                        ? LP.border
                        : "transparent",
                    opacity:
                      !draftMessage.trim() || isSending || !isSessionActive || isFinishing
                        ? 0.48
                        : 1
                  }
                ]}
              >
                <View
                  style={[
                    styles.sendArrow,
                    {
                      borderColor:
                        !draftMessage.trim() || isSending || !isSessionActive || isFinishing
                          ? LP.textMuted
                          : "#FFFFFF"
                    }
                  ]}
                />
              </Pressable>
            </View>
          </View>
        </View>

        {!layout.isDesktop ? (
        <View style={[styles.insightColumn, styles.insightColumnMobile]}>
          <View
            style={[
              styles.insightCard,
              { backgroundColor: LP.card, borderColor: LP.border }
            ]}
          >
            <Text style={[styles.insightTitle, { color: LP.textPrimary }]}>
              Контекст сценария
            </Text>
            <InsightTextBlock label="Продукт" text="Промышленные кондиционеры" />
            <InsightTextBlock label="Ситуация" text="Входящий запрос, первый контакт" />
            <InsightTextBlock label="Цель" text="Договориться о следующем шаге" />
          </View>

          <Pressable
            testID="simulator-finish-button"
            onPress={() => {
              if (isFinishing) {
                return;
              }
              onFinishScenario({
                scenarioId: selectedScenario.id,
                scenarioTitle: selectedScenario.title
              });
            }}
            disabled={isFinishing}
            style={[
              styles.finishButton,
              {
                backgroundColor: canFinishScenario ? LP.actionPrimary : LP.card,
                borderColor: canFinishScenario ? "transparent" : LP.border,
                borderWidth: canFinishScenario ? 0 : 1,
                opacity: 1
              }
            ]}
          >
            <Text
              style={[
                styles.finishButtonText,
                { color: canFinishScenario ? "#FFFFFF" : LP.actionPrimary }
              ]}
            >
              {isFinishing ? "Сохраняем отчет..." : "Завершить и получить отчет"}
            </Text>
          </Pressable>
          {!hasEnoughRepliesForReport ? (
            <Text style={[styles.finishHintText, { color: LP.textMuted }]}>
              Минимум {dialogue.replyTarget} реплик для отчета ({managerReplyCount} / {dialogue.replyTarget})
            </Text>
          ) : null}
        </View>
        ) : null}
      </View>

    </View>
  );
}

function InsightTextBlock({ label, text }: { label: string; text: string }) {
  const theme = useTheme();

  return (
    <View style={styles.insightTextBlock}>
      <Text style={[styles.insightLabel, { color: LP.textSecondary }]}>{label}</Text>
      <Text style={[styles.insightText, { color: LP.textPrimary }]}>{text}</Text>
    </View>
  );
}

function SegmentButton({
  label,
  active,
  onPress
}: {
  label: "B2B" | "B2C";
  active: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.segmentButton,
        active && styles.segmentButtonActive,
        {
          backgroundColor: active ? "#ffffff" : "transparent",
          borderColor: "transparent"
        }
      ]}
    >
      <Text
        style={[
          styles.segmentLabel,
          { color: active ? NAVY : LP.textSecondary }
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ScenarioTile({
  scenario,
  onPlay
}: {
  scenario: ScenarioCardItem;
  onPlay: () => void;
}) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.scenarioTile,
        {
          backgroundColor: LP.card,
          borderColor: LP.border,
          shadowColor: theme.shadows.soft.shadowColor,
          shadowOpacity: theme.shadows.soft.shadowOpacity,
          shadowRadius: theme.shadows.soft.shadowRadius,
          shadowOffset: theme.shadows.soft.shadowOffset,
          elevation: theme.shadows.soft.elevation
        }
      ]}
    >
      <View style={styles.scenarioTileTop}>
        <View
          style={[
            styles.scenarioIconTile,
            { backgroundColor: toneBackground(theme, scenario.accent) }
          ]}
        >
          <Text style={[styles.scenarioIcon, { color: toneForeground(theme, scenario.accent) }]}>
            {scenario.icon}
          </Text>
        </View>
        <View style={styles.scenarioText}>
          <Text style={[styles.scenarioTitle, { color: LP.textPrimary }]}>
            {scenario.title}
          </Text>
          <Text style={[styles.scenarioDescription, { color: LP.textSecondary }]}>
            {scenario.description}
          </Text>
        </View>
      </View>
      <View style={styles.scenarioFooter}>
        {scenario.status === "new" ? (
          <View
            style={[
              styles.newBadge,
              styles.scenarioStatusBadge,
              { backgroundColor: TINT }
            ]}
          >
            <Text style={[styles.newBadgeText, { color: NAVY }]}>
              {scenario.progressLabel}
            </Text>
          </View>
        ) : null}
        <View style={styles.scenarioActionRow}>
          <InfoPill label={scenario.duration} compact />
          <InfoPill label={scenario.level} compact />
          <Pressable
            onPress={onPlay}
            style={[
              styles.playButton,
              { borderColor: LP.border, backgroundColor: LP.card }
            ]}
          >
            <Text style={[styles.playButtonText, { color: LP.actionPrimary }]}>▶</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function CircleActionButton({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.circleButton,
        { backgroundColor: LP.card, borderColor: LP.border }
      ]}
    >
      <Text style={[styles.circleButtonText, { color: LP.textPrimary }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function InfoPill({ label, compact }: { label: string; compact?: boolean }) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.infoPill,
        compact && styles.infoPillCompact,
        { backgroundColor: LP.card, borderColor: LP.border }
      ]}
    >
      <Text style={[styles.infoPillText, { color: LP.textPrimary }]}>{label}</Text>
    </View>
  );
}

// Uniform, landing-cohesive icon tiles (navy on pale blue) regardless of legacy tone.
function toneBackground(
  _theme: ReturnType<typeof useTheme>,
  _tone: "mint" | "warning" | "info" | "violet" | "peach"
) {
  return SOFT_2;
}

function toneForeground(
  _theme: ReturnType<typeof useTheme>,
  _tone: "mint" | "warning" | "info" | "violet" | "peach"
) {
  return NAVY;
}

const styles = StyleSheet.create({
  screen: {
    gap: 18
  },
  screenMobileDialogue: {
    paddingBottom: 120
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16
  },
  headerStack: {
    flexDirection: "column"
  },
  headerBlock: {
    gap: 2
  },
  pageTitle: {
    fontSize: 34,
    lineHeight: 36,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: -1
  },
  pageSubtitle: {
    fontSize: 16,
    lineHeight: 24
  },
  sheetLine: {
    fontSize: 15,
    lineHeight: 22
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  backToLanding: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  backToLandingText: {
    fontSize: 13,
    fontWeight: "700"
  },
  circleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  circleButtonText: {
    fontSize: 16,
    fontWeight: "700"
  },
  segmentBlock: {
    alignItems: "center",
    gap: 10
  },
  segmentedControl: {
    width: 580,
    maxWidth: "100%",
    minHeight: 58,
    borderRadius: 999,
    borderWidth: 1,
    padding: 4,
    flexDirection: "row",
    gap: 6
  },
  segmentButton: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  segmentButtonActive: {
    shadowColor: NAVY,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2
  },
  segmentLabel: {
    fontSize: 15,
    fontWeight: "800"
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  heroPanel: {
    borderRadius: 28,
    paddingVertical: 28,
    paddingHorizontal: 30,
    overflow: "hidden",
    shadowColor: NAVY,
    shadowOpacity: 0.16,
    shadowRadius: 38,
    shadowOffset: { width: 0, height: 16 },
    elevation: 6
  },
  heroDecor: {
    position: "absolute",
    backgroundColor: LIME,
    transform: [{ rotate: "45deg" }]
  },
  heroDecorTop: { width: 168, height: 168, right: -82, top: -88, opacity: 0.85 },
  heroDecorBottom: { width: 120, height: 120, left: -60, bottom: -60, opacity: 0.12 },
  heroContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 24,
    zIndex: 1
  },
  heroStack: {
    flexDirection: "column",
    alignItems: "stretch"
  },
  heroText: {
    flex: 1,
    gap: 14
  },
  heroEyebrow: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,.12)"
  },
  heroEyebrowDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: LIME },
  heroEyebrowText: { color: "#fff", fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1 },
  heroTitle: {
    color: "#fff",
    fontSize: 27,
    lineHeight: 29,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: -0.5,
    maxWidth: 560
  },
  heroDescription: {
    color: "rgba(255,255,255,.78)",
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 560
  },
  heroPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 2
  },
  heroMetaPill: {
    backgroundColor: "rgba(255,255,255,.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.16)",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14
  },
  heroMetaPillText: { color: "rgba(255,255,255,.85)", fontSize: 13, fontWeight: "700" },
  infoPill: {
    minHeight: 42,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center"
  },
  infoPillCompact: {
    minHeight: 38,
    paddingHorizontal: 12
  },
  infoPillText: {
    fontSize: 13,
    fontWeight: "700"
  },
  heroIllustrationWrap: {
    alignItems: "flex-end",
    justifyContent: "center"
  },
  heroIllustrationWrapMobile: {
    minWidth: 0,
    width: "100%",
    alignItems: "stretch"
  },
  heroCta: {
    minHeight: 56,
    borderRadius: 999,
    paddingHorizontal: 30,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center"
  },
  heroCtaText: {
    color: NAVY,
    fontSize: 16,
    fontWeight: "800"
  },
  filtersRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flexWrap: "wrap",
    justifyContent: "space-between"
  },
  filtersStack: {
    alignItems: "stretch"
  },
  filterPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    flex: 1
  },
  filterPill: {
    minHeight: 42,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center"
  },
  filterPillText: {
    fontSize: 14,
    fontWeight: "600"
  },
  cardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 18,
    width: "100%",
    maxWidth: 1128,
    alignSelf: "center",
    alignItems: "flex-start"
  },
  scenarioTile: {
    width: "32.2%",
    minWidth: 300,
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    gap: 14,
    flexGrow: 0,
    minHeight: 196,
    justifyContent: "space-between"
  },
  scenarioTileTop: {
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start"
  },
  scenarioIconTile: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center"
  },
  scenarioIcon: {
    fontSize: 24
  },
  scenarioText: {
    flex: 1,
    gap: 8,
    minHeight: 74
  },
  scenarioTitle: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: -0.3
  },
  scenarioDescription: {
    fontSize: 15,
    lineHeight: 22
  },
  scenarioFooter: {
    gap: 10,
    marginTop: "auto"
  },
  scenarioActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  playButton: {
    marginLeft: "auto",
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  playButtonText: {
    fontSize: 18,
    fontWeight: "700"
  },
  newBadge: {
    minHeight: 38,
    borderRadius: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center"
  },
  scenarioStatusBadge: {
    alignSelf: "stretch"
  },
  newBadgeText: {
    fontSize: 14,
    fontWeight: "700"
  },
  dialogueHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    minHeight: 42
  },
  dialogueHeaderCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  dialogueHeaderCenterStack: {
    flexDirection: "column",
    alignItems: "stretch"
  },
  changeScenarioButton: {
    minHeight: 42,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  changeScenarioIcon: {
    fontSize: 17
  },
  changeScenarioText: {
    fontSize: 16,
    fontWeight: "600"
  },
  dialogueLayout: {
    flexDirection: "row",
    gap: 18,
    alignItems: "flex-start"
  },
  dialogueLayoutDesktop: {
    flex: 1,
    minHeight: 0,
    alignItems: "stretch",
    paddingBottom: 0
  },
  dialogueLayoutStack: {
    flexDirection: "column"
  },
  chatPanel: {
    flex: 1.95,
    borderWidth: 1,
    borderRadius: 28,
    overflow: "hidden",
    flexShrink: 1,
    minHeight: 0,
    height: "100%",
    flexDirection: "column",
    marginBottom: 0
  },
  chatPanelMobile: {
    height: "auto",
    minHeight: 0
  },
  chatTopBar: {
    minHeight: 52,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  chatTopLeft: {
    flex: 1,
    gap: 6
  },
  chatTopMeta: {
    fontSize: 15,
    lineHeight: 20
  },
  chatTopMetaStrong: {
    fontWeight: "700"
  },
  chatProgressTrack: {
    width: 168,
    height: 7,
    borderRadius: 999,
    overflow: "hidden"
  },
  chatProgressFill: {
    height: "100%",
    borderRadius: 999
  },
  chatTopRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18
  },
  chatStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 999
  },
  personaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 6
  },
  personaAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  personaAvatarText: {
    fontSize: 16,
    fontWeight: "700"
  },
  personaText: {
    gap: 2
  },
  personaName: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "800"
  },
  personaMeta: {
    fontSize: 13,
    lineHeight: 18
  },
  errorNoticeWrap: {
    paddingHorizontal: 18,
    paddingBottom: 8
  },
  errorNoticeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  errorNoticeCard: {
    flex: 1
  },
  restartScenarioButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  restartScenarioButtonText: {
    fontSize: 20,
    lineHeight: 20,
    fontWeight: "700"
  },
  messageList: {
    flex: 1,
    minHeight: 0,
    marginBottom: 78
  },
  messageListDesktop: {
    marginTop: 0,
    marginBottom: 0
  },
  messageListContent: {
    flexGrow: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 96,
    gap: 10
  },
  messageListContentDesktop: {
    paddingBottom: 88
  },
  scenarioIntroOverlay: {
    position: "absolute",
    left: 18,
    right: 18,
    top: 0,
    bottom: 78,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2
  },
  messageListContentMobile: {
    paddingBottom: 18
  },
  scenarioIntroCard: {
    alignSelf: "center",
    width: "64%",
    maxWidth: 520,
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 9,
    marginVertical: 18
  },
  scenarioIntroTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 2
  },
  scenarioIntroLine: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center"
  },
  scenarioIntroStrong: {
    fontWeight: "800"
  },
  messageBubble: {
    maxWidth: "66%",
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6
  },
  messageBubbleCustomer: {
    alignSelf: "flex-start",
    borderTopLeftRadius: 10
  },
  messageBubbleManager: {
    alignSelf: "flex-end",
    borderTopRightRadius: 10
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20
  },
  messageTime: {
    fontSize: 12,
    textAlign: "right"
  },
  typingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  typingDots: {
    minWidth: 38,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  typingDotsText: {
    fontSize: 16,
    letterSpacing: 2
  },
  typingText: {
    fontSize: 14
  },
  inputFooterBackdrop: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 74,
    zIndex: 3
  },
  inputWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 0,
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 8,
    minHeight: 72,
    zIndex: 4,
    elevation: 4
  },
  inputWrapMobile: {
    position: "relative",
    left: "auto",
    right: "auto",
    bottom: "auto",
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: 1,
    elevation: 0
  },
  inputRow: {
    minHeight: 50,
    borderRadius: 18,
    borderWidth: 1,
    paddingLeft: 16,
    paddingRight: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    overflow: "hidden"
  },
  chatInput: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 36,
    maxHeight: 52,
    paddingTop: 8,
    paddingBottom: 8,
    paddingRight: 2
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  sendArrow: {
    width: 13,
    height: 13,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderRadius: 1,
    transform: [{ rotate: "45deg" }, { translateX: -2 }]
  },
  insightColumn: {
    flex: 1,
    gap: 4,
    alignSelf: "stretch",
    minHeight: 0,
    justifyContent: "flex-start",
    height: "100%"
  },
  insightColumnMobile: {
    height: "auto",
    gap: 10,
    paddingBottom: 24
  },
  insightCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 14,
    gap: 12,
    marginBottom: 10
  },
  insightTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "800"
  },
  insightTextBlock: {
    gap: 6
  },
  insightLabel: {
    fontSize: 13,
    fontWeight: "600"
  },
  insightText: {
    fontSize: 14,
    lineHeight: 22
  },
  finishButton: {
    marginTop: 0,
    minHeight: 46,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    marginBottom: 8
  },
  finishButtonText: {
    fontSize: 16,
    fontWeight: "800"
  },
  finishHintText: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
    marginTop: -1,
    marginBottom: 8
  }
});
