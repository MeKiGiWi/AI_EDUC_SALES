import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import type { SalesAcademyMock, ScenarioCardItem } from "../../data/salesAcademyMock";
import { DEFAULT_BACKEND_DIFFICULTY, MANAGER_REPLY_TARGET } from "../../data/simulatorMvpData";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import {
  getSafeSimulatorErrorMessage,
  simulatorApiService
} from "../../services/simulatorApiService";
import { useTheme } from "../../theme/useTheme";

interface SimulatorScreenProps {
  data: SalesAcademyMock;
  activeScenarioId?: string;
  mode: "catalog" | "dialogue";
  onStartScenario: (scenarioId: string) => void;
  onBackToCatalog: () => void;
  onFinishScenario: () => void;
}

const trainerFilters = ["Все", "Новые"] as const;

export function SimulatorScreen({
  data,
  activeScenarioId,
  mode,
  onStartScenario,
  onBackToCatalog,
  onFinishScenario
}: SimulatorScreenProps) {
  const theme = useTheme();
  const layout = useResponsiveLayout();
  const [segment, setSegment] = useState<"B2B" | "B2C">("B2B");
  const [activeFilter, setActiveFilter] = useState<(typeof trainerFilters)[number]>("Все");

  const selectedScenario =
    data.scenarios.find((scenario) => scenario.id === activeScenarioId) ?? data.scenarios[0];
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

  if (mode === "dialogue") {
    return (
      <DialogueView
        data={data}
        selectedScenario={selectedScenario}
        onBackToCatalog={onBackToCatalog}
        onFinishScenario={onFinishScenario}
      />
    );
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.headerRow, !layout.isDesktop && styles.headerStack]}>
        <View style={styles.headerBlock}>
          <Text style={[styles.pageTitle, { color: theme.semantic.textPrimary }]}>Тренажер</Text>
          <Text style={[styles.pageSubtitle, { color: theme.semantic.textSecondary }]}>
            Практикуйте навыки продаж в реалистичных сценариях.
          </Text>
          <Text style={[styles.pageSubtitle, { color: theme.semantic.textSecondary }]}>
            Выберите модуль и начните тренировку.
          </Text>
        </View>
        <View style={styles.headerActions}>
          <CircleActionButton label="◔" />
          <CircleActionButton label="?" />
        </View>
      </View>

      <View style={styles.segmentBlock}>
        <View style={[styles.segmentedControl, { backgroundColor: theme.semantic.card, borderColor: theme.semantic.border }]}>
          <SegmentButton label="B2B" active={segment === "B2B"} onPress={() => setSegment("B2B")} />
          <SegmentButton label="B2C" active={segment === "B2C"} onPress={() => setSegment("B2C")} />
        </View>
      </View>

      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: theme.semantic.card,
            borderColor: theme.semantic.border,
            shadowColor: theme.shadows.card.shadowColor,
            shadowOpacity: theme.shadows.card.shadowOpacity,
            shadowRadius: theme.shadows.card.shadowRadius,
            shadowOffset: theme.shadows.card.shadowOffset,
            elevation: theme.shadows.card.elevation
          }
        ]}
      >
        <View style={[styles.heroContent, !layout.isWide && styles.heroStack]}>
          <View style={styles.heroText}>
            <Text style={[styles.heroEyebrow, { color: theme.semantic.textSecondary }]}>Продолжить с места остановки</Text>
            <Text style={[styles.heroTitle, { color: theme.semantic.textPrimary }]}>{selectedScenario.title}</Text>
            <Text style={[styles.heroDescription, { color: theme.semantic.textSecondary }]}>{selectedScenario.description}</Text>
            <View style={styles.heroPills}>
              <InfoPill label={selectedScenario.duration} />
              <InfoPill label={`Уровень: ${selectedScenario.level}`} />
              <ProgressInfoPill label="Прогресс" value={selectedScenario.progressValue ?? 0} />
            </View>
          </View>

          <View style={styles.heroIllustrationWrap}>
            <View style={[styles.heroIllustration, { backgroundColor: theme.colors.primaryPale }]}>
              <View style={[styles.chatBlobLarge, { backgroundColor: "rgba(255,255,255,0.85)" }]} />
              <View style={[styles.chatBlobSmall, { backgroundColor: "rgba(255,255,255,0.72)" }]} />
              <View style={[styles.priceTag, { backgroundColor: theme.colors.primarySoft, borderColor: theme.semantic.actionPrimary }]}>
                <Text style={styles.priceTagText}>₽</Text>
              </View>
            </View>
            <Pressable onPress={() => onStartScenario(selectedScenario.id)} style={[styles.heroCta, { backgroundColor: theme.semantic.actionPrimary }]}>
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
                  backgroundColor: activeFilter === label ? theme.colors.primaryPale : theme.semantic.card,
                  borderColor: theme.semantic.border
                }
              ]}
            >
              <Text
                style={[
                  styles.filterPillText,
                  {
                    color:
                      activeFilter === label ? theme.semantic.actionPrimary : theme.semantic.textPrimary
                  }
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
    </View>
  );
}

function DialogueView({
  data,
  selectedScenario,
  onBackToCatalog,
  onFinishScenario
}: {
  data: SalesAcademyMock;
  selectedScenario: ScenarioCardItem;
  onBackToCatalog: () => void;
  onFinishScenario: () => void;
}) {
  const theme = useTheme();
  const layout = useResponsiveLayout();
  const dialogue = data.activeDialogue;
  const apiEnabled = simulatorApiService.isEnabled();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState(dialogue.messages);
  const [inputValue, setInputValue] = useState("");
  const [isInitializing, setIsInitializing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isSessionClosed, setIsSessionClosed] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const messageScrollRef = useRef<ScrollView | null>(null);
  const [messageViewportHeight, setMessageViewportHeight] = useState(0);
  const [messageContentHeight, setMessageContentHeight] = useState(0);
  const [messageScrollY, setMessageScrollY] = useState(0);
  const typingDot1 = useRef(new Animated.Value(0.35)).current;
  const typingDot2 = useRef(new Animated.Value(0.35)).current;
  const typingDot3 = useRef(new Animated.Value(0.35)).current;
  const managerReplyCount = useMemo(
    () => messages.filter((message) => message.author === "manager").length,
    [messages]
  );
  const progress = Math.round((managerReplyCount / MANAGER_REPLY_TARGET) * 100);
  const dialogueHeight = Math.max(theme.viewport.height - 16, 660);
  const dialogueBodyHeight = Math.max(theme.viewport.height - 120, 520);
  const busy = isInitializing || isSending || isFinishing;
  const showTyping = isSending;
  const scrollableDistance = Math.max(messageContentHeight - messageViewportHeight, 0);
  const scrollThumbVisible = scrollableDistance > 8;
  const scrollTrackHeight = Math.max(messageViewportHeight - 16, 24);
  const minThumbHeight = 28;
  const scrollThumbHeight = scrollThumbVisible
    ? Math.max((messageViewportHeight / messageContentHeight) * scrollTrackHeight, minThumbHeight)
    : scrollTrackHeight;
  const scrollThumbOffset = scrollThumbVisible
    ? (messageScrollY / scrollableDistance) * (scrollTrackHeight - scrollThumbHeight)
    : 0;

  function nowTime() {
    return new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  }

  useEffect(() => {
    if (!showTyping) {
      typingDot1.setValue(0.35);
      typingDot2.setValue(0.35);
      typingDot3.setValue(0.35);
      return;
    }
    const pulse = (value: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, { toValue: 1, duration: 240, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(value, { toValue: 0.35, duration: 240, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.delay(200)
        ])
      );
    const a1 = pulse(typingDot1, 0);
    const a2 = pulse(typingDot2, 100);
    const a3 = pulse(typingDot3, 200);
    a1.start();
    a2.start();
    a3.start();
    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [showTyping, typingDot1, typingDot2, typingDot3]);

  useEffect(() => {
    const frame = setTimeout(() => {
      messageScrollRef.current?.scrollToEnd({ animated: true });
    }, 0);
    return () => clearTimeout(frame);
  }, [messages.length, showTyping, errorText]);

  useEffect(() => {
    let isMounted = true;
    async function startSession() {
      if (!apiEnabled) {
        setSessionId(null);
        setMessages(dialogue.messages);
        setErrorText("Backend не подключен. Показывается mock-режим.");
        return;
      }
      try {
        setIsInitializing(true);
        setErrorText(null);
        const backendScenarios = await simulatorApiService.fetchSimulatorScenarios();
        const matchedScenario =
          backendScenarios.find((item) => item.id === selectedScenario.id) ??
          backendScenarios.find((item) => item.title.trim().toLowerCase() === selectedScenario.title.trim().toLowerCase()) ??
          backendScenarios[0];

        if (!matchedScenario) {
          throw new Error("Нет доступных сценариев на backend.");
        }

        const response = await simulatorApiService.startDialogueSession(
          matchedScenario.id,
          DEFAULT_BACKEND_DIFFICULTY
        );
        if (!isMounted) {
          return;
        }
        setSessionId(response.session_id);
        setIsSessionClosed(false);
        setMessages([
          {
            id: response.message.id ?? `customer-${Date.now()}`,
            author: response.message.role === "customer" ? "customer" : "manager",
            text: response.message.text,
            time: nowTime()
          }
        ]);
      } catch (error) {
        if (!isMounted) {
          return;
        }
        setSessionId(null);
        setMessages(dialogue.messages);
        setErrorText(getSafeSimulatorErrorMessage(error));
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    }
    void startSession();
    return () => {
      isMounted = false;
    };
  }, [apiEnabled, selectedScenario.id, selectedScenario.title]);

  async function handleSendMessage() {
    const text = inputValue.trim();
    if (!text || busy || isSessionClosed) {
      return;
    }
    if (!sessionId) {
      setErrorText("Сессия не инициализирована.");
      return;
    }
    const managerMessage = { id: `manager-${Date.now()}`, author: "manager" as const, text, time: nowTime() };
    setMessages((current) => [...current, managerMessage]);
    setInputValue("");
    try {
      setIsSending(true);
      setErrorText(null);
      const response = await simulatorApiService.sendDialogueMessage(sessionId, text);
      const customerMessages = response.messages
        .filter((message) => message.role === "customer")
        .map((message, index) => ({
          id: message.id ?? `customer-reply-${Date.now()}-${index}`,
          author: "customer" as const,
          text: message.text,
          time: nowTime()
        }));
      if (customerMessages.length > 0) {
        setMessages((current) => [...current, ...customerMessages]);
      }
    } catch (error) {
      setErrorText(getSafeSimulatorErrorMessage(error));
      if (
        typeof error === "object" &&
        error !== null &&
        "status" in error &&
        (error as { status?: number }).status === 409
      ) {
        setIsSessionClosed(true);
      }
    } finally {
      setIsSending(false);
    }
  }

  async function handleFinishSession() {
    if (busy) {
      return;
    }
    if (!sessionId || !apiEnabled) {
      onFinishScenario();
      return;
    }
    try {
      setIsFinishing(true);
      setErrorText(null);
      await simulatorApiService.finishDialogueSession(sessionId);
      setIsSessionClosed(true);
      onFinishScenario();
    } catch (error) {
      setErrorText(getSafeSimulatorErrorMessage(error));
    } finally {
      setIsFinishing(false);
    }
  }

  return (
    <View style={[styles.screen, styles.dialogueScreen, layout.isDesktop && { height: dialogueHeight, gap: 10, justifyContent: "space-between", paddingBottom: 8 }]}>
      <View style={[styles.dialogueHeader, !layout.isDesktop && styles.headerStack]}>
        <Text style={[styles.pageTitle, { color: theme.semantic.textPrimary }]}>Тренажер</Text>
        <View style={[styles.dialogueHeaderCenter, !layout.isDesktop && styles.dialogueHeaderCenterStack]}>
          <Pressable onPress={onBackToCatalog} style={[styles.changeScenarioButton, { backgroundColor: theme.semantic.card, borderColor: theme.semantic.border }]}>
            <Text style={[styles.changeScenarioIcon, { color: theme.semantic.textSecondary }]}>⇄</Text>
            <Text style={[styles.changeScenarioText, { color: theme.semantic.textPrimary }]}>Сменить сценарий</Text>
          </Pressable>
        </View>
        <View style={styles.headerActions}>
          <CircleActionButton label="◔" />
          <CircleActionButton label="?" />
        </View>
      </View>

      <View
        style={[
          styles.dialogueLayout,
          !layout.isDesktop && styles.dialogueLayoutStack,
          layout.isDesktop && styles.dialogueLayoutDesktop,
          layout.isDesktop && { height: dialogueBodyHeight }
        ]}
      >
        <View
          style={[
            styles.chatPanel,
            {
              backgroundColor: theme.semantic.card,
              borderColor: theme.semantic.border,
              shadowColor: theme.shadows.card.shadowColor,
              shadowOpacity: theme.shadows.card.shadowOpacity,
              shadowRadius: theme.shadows.card.shadowRadius,
              shadowOffset: theme.shadows.card.shadowOffset,
              elevation: theme.shadows.card.elevation
            }
          ]}
        >
          <View style={[styles.chatTopBar, { borderBottomColor: theme.semantic.borderSubtle }]}>
            <View style={styles.chatTopLeft}>
              <Text style={[styles.chatTopMeta, { color: theme.semantic.textSecondary }]}>
                Реплики менеджера: <Text style={[styles.chatTopMetaStrong, { color: theme.semantic.textPrimary }]}>{managerReplyCount} / {MANAGER_REPLY_TARGET}</Text>
              </Text>
              <View style={[styles.chatProgressTrack, { backgroundColor: theme.semantic.borderSubtle }]}>
                <View style={[styles.chatProgressFill, { backgroundColor: theme.semantic.actionPrimary, width: `${progress}%` }]} />
              </View>
            </View>
            <View style={styles.chatTopRight}>
              <View style={styles.chatStatusRow}>
                <View style={[styles.statusDot, { backgroundColor: theme.semantic.success }]} />
                <Text style={[styles.chatTopMeta, { color: theme.semantic.textSecondary }]}>{dialogue.status}</Text>
              </View>
              <Text style={[styles.chatTopMeta, { color: theme.semantic.textSecondary }]}>◔ {dialogue.time}</Text>
              <Text style={[styles.chatTopMeta, { color: theme.semantic.textSecondary }]}>…</Text>
            </View>
          </View>

          <View style={styles.personaRow}>
            <View style={[styles.personaAvatar, { backgroundColor: theme.colors.primaryPale, borderColor: theme.semantic.border }]}>
              <Text style={[styles.personaAvatarText, { color: theme.semantic.actionPrimary }]}>РП</Text>
            </View>
            <View style={styles.personaText}>
              <Text style={[styles.personaName, { color: theme.semantic.textPrimary }]}>{dialogue.persona.name}</Text>
              <Text style={[styles.personaMeta, { color: theme.semantic.textSecondary }]}>Компания: {dialogue.persona.company}</Text>
              <Text style={[styles.personaMeta, { color: theme.semantic.textSecondary }]}>Отдел: {dialogue.persona.department}</Text>
            </View>
          </View>

          <View style={styles.messagesWrap}>
            <ScrollView
              ref={messageScrollRef}
              style={styles.messageList}
              contentContainerStyle={styles.messageListContent}
              showsVerticalScrollIndicator={false}
              onLayout={(event) => setMessageViewportHeight(event.nativeEvent.layout.height)}
              onContentSizeChange={(_, height) => setMessageContentHeight(height)}
              onScroll={(event) => setMessageScrollY(event.nativeEvent.contentOffset.y)}
              scrollEventThrottle={16}
            >
              {messages.map((message) => (
                <View
                  key={message.id}
                  style={[
                    styles.messageBubble,
                    message.author === "manager" ? styles.messageBubbleManager : styles.messageBubbleCustomer,
                    {
                      backgroundColor:
                        message.author === "manager" ? theme.colors.surfaceMint : theme.semantic.card,
                      borderColor: theme.semantic.border
                    }
                  ]}
                >
                  <Text style={[styles.messageText, { color: theme.semantic.textPrimary }]}>{message.text}</Text>
                  <Text style={[styles.messageTime, { color: theme.semantic.textMuted }]}>{message.time}</Text>
                </View>
              ))}

              {showTyping ? (
                <View style={styles.typingRow}>
                  <View style={[styles.typingDots, { backgroundColor: theme.semantic.backgroundWarm, borderColor: theme.semantic.border }]}>
                    <Animated.View style={[styles.typingDot, { opacity: typingDot1, backgroundColor: theme.semantic.textMuted }]} />
                    <Animated.View style={[styles.typingDot, { opacity: typingDot2, backgroundColor: theme.semantic.textMuted }]} />
                    <Animated.View style={[styles.typingDot, { opacity: typingDot3, backgroundColor: theme.semantic.textMuted }]} />
                  </View>
                  <Text style={[styles.typingText, { color: theme.semantic.textMuted }]}>{dialogue.typingLabel}</Text>
                </View>
              ) : null}
            </ScrollView>
            {scrollThumbVisible ? (
              <View style={styles.scrollTrack}>
                <View style={[styles.scrollThumb, { height: scrollThumbHeight, transform: [{ translateY: scrollThumbOffset }] }]} />
              </View>
            ) : null}
          </View>
          {errorText ? <Text style={[styles.errorText, { color: theme.semantic.warning }]}>{errorText}</Text> : null}

          <View style={[styles.inputWrap, { borderTopColor: theme.semantic.borderSubtle }]}>
            <View style={[styles.inputRow, { backgroundColor: theme.semantic.card, borderColor: theme.semantic.border }]}>
              <TextInput
                placeholder="Напишите сообщение..."
                placeholderTextColor={theme.semantic.textMuted}
                style={[styles.chatInput, { color: theme.semantic.textPrimary }]}
                value={inputValue}
                onChangeText={setInputValue}
                editable={!busy && !isSessionClosed}
                multiline
                textAlignVertical="top"
                scrollEnabled
                maxLength={2000}
              />
              <Pressable
                onPress={handleSendMessage}
                style={[styles.sendButton, { backgroundColor: theme.semantic.actionPrimary, opacity: busy || isSessionClosed ? 0.7 : 1 }]}
              >
                <Text style={styles.sendButtonText}>Отправить</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.insightColumn}>
          <View style={[styles.insightCard, { backgroundColor: theme.semantic.card, borderColor: theme.semantic.border }]}>
            <Text style={[styles.insightTitle, { color: theme.semantic.textPrimary }]}>Контекст сценария</Text>
            <InsightTextBlock label="Контекст" text={dialogue.context} />
            <InsightTextBlock label="Цель" text={dialogue.goal} />
            <InsightTextBlock label="Возражение" text={`«${dialogue.objection}»`} />
          </View>

          <Pressable onPress={handleFinishSession} style={[styles.finishButton, { backgroundColor: theme.semantic.actionPrimary, opacity: busy ? 0.7 : 1 }]}>
            <Text style={styles.finishButtonText}>{isFinishing ? "Завершаем..." : "Завершить и получить отчет"}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function InsightTextBlock({ label, text }: { label: string; text: string }) {
  const theme = useTheme();

  return (
    <View style={styles.insightTextBlock}>
      <Text style={[styles.insightLabel, { color: theme.semantic.textSecondary }]}>{label}</Text>
      <Text style={[styles.insightText, { color: theme.semantic.textPrimary }]}>{text}</Text>
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
        {
          backgroundColor: active ? theme.semantic.card : "transparent",
          borderColor: active ? theme.semantic.actionPrimary : "transparent"
        }
      ]}
    >
      <Text style={[styles.segmentLabel, { color: active ? theme.semantic.actionPrimary : theme.semantic.textPrimary }]}>
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
          backgroundColor: theme.semantic.card,
          borderColor: theme.semantic.border,
          shadowColor: theme.shadows.soft.shadowColor,
          shadowOpacity: theme.shadows.soft.shadowOpacity,
          shadowRadius: theme.shadows.soft.shadowRadius,
          shadowOffset: theme.shadows.soft.shadowOffset,
          elevation: theme.shadows.soft.elevation
        }
      ]}
    >
      <View style={styles.scenarioTileTop}>
        <View style={[styles.scenarioIconTile, { backgroundColor: toneBackground(theme, scenario.accent) }]}>
          <Text style={[styles.scenarioIcon, { color: toneForeground(theme, scenario.accent) }]}>{scenario.icon}</Text>
        </View>
        <View style={styles.scenarioText}>
          <Text style={[styles.scenarioTitle, { color: theme.semantic.textPrimary }]}>{scenario.title}</Text>
          <Text style={[styles.scenarioDescription, { color: theme.semantic.textSecondary }]}>{scenario.description}</Text>
        </View>
      </View>
      <View style={styles.scenarioFooter}>
        <InfoPill label={scenario.duration} compact />
        <InfoPill label={scenario.level} compact />
        {scenario.status === "new" ? (
          <View style={[styles.newBadge, { backgroundColor: "rgba(92,143,115,0.12)" }]}>
            <Text style={[styles.newBadgeText, { color: theme.colors.info }]}>{scenario.progressLabel}</Text>
          </View>
        ) : (
          <ProgressInfoPill label="" value={scenario.progressValue ?? 0} compact />
        )}
        <Pressable onPress={onPlay} style={[styles.playButton, { borderColor: theme.semantic.border, backgroundColor: theme.semantic.card }]}>
          <Text style={[styles.playButtonText, { color: theme.semantic.actionPrimary }]}>▶</Text>
        </Pressable>
      </View>
    </View>
  );
}

function CircleActionButton({ label }: { label: string }) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={() => {}}
      style={[styles.circleButton, { backgroundColor: theme.semantic.card, borderColor: theme.semantic.border }]}
    >
      <Text style={[styles.circleButtonText, { color: theme.semantic.textPrimary }]}>{label}</Text>
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
        { backgroundColor: theme.semantic.card, borderColor: theme.semantic.border }
      ]}
    >
      <Text style={[styles.infoPillText, { color: theme.semantic.textPrimary }]}>{label}</Text>
    </View>
  );
}

function ProgressInfoPill({
  label,
  value,
  compact
}: {
  label: string;
  value: number;
  compact?: boolean;
}) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.progressPill,
        compact && styles.progressPillCompact,
        { backgroundColor: theme.semantic.card, borderColor: theme.semantic.border }
      ]}
    >
      {label ? <Text style={[styles.progressPillLabel, { color: theme.semantic.actionPrimary }]}>{label}</Text> : null}
      <View style={[styles.progressPillTrack, { backgroundColor: theme.semantic.borderSubtle }]}>
        <View style={[styles.progressPillFill, { backgroundColor: theme.semantic.actionPrimary, width: `${value}%` }]} />
      </View>
      <Text style={[styles.progressPillValue, { color: theme.semantic.textPrimary }]}>{value}%</Text>
    </View>
  );
}

function toneBackground(theme: ReturnType<typeof useTheme>, tone: "mint" | "warning" | "info" | "violet" | "peach") {
  if (tone === "warning") {
    return "rgba(213,162,77,0.16)";
  }
  if (tone === "info") {
    return "rgba(92,143,115,0.14)";
  }
  if (tone === "violet") {
    return "rgba(120, 120, 180, 0.14)";
  }
  if (tone === "peach") {
    return "rgba(200,92,74,0.10)";
  }

  return theme.colors.primaryPale;
}

function toneForeground(theme: ReturnType<typeof useTheme>, tone: "mint" | "warning" | "info" | "violet" | "peach") {
  if (tone === "warning") {
    return theme.semantic.warning;
  }
  if (tone === "info") {
    return theme.colors.info;
  }
  if (tone === "violet") {
    return "#7B61B9";
  }
  if (tone === "peach") {
    return "#D97045";
  }

  return theme.semantic.actionPrimary;
}

const styles = StyleSheet.create({
  screen: {
    gap: 18
  },
  dialogueScreen: {
    minHeight: 0
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
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "800"
  },
  pageSubtitle: {
    fontSize: 16,
    lineHeight: 24
  },
  headerActions: {
    flexDirection: "row",
    gap: 10
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
  segmentLabel: {
    fontSize: 16,
    fontWeight: "700"
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: 30,
    padding: 18
  },
  heroContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20
  },
  heroStack: {
    flexDirection: "column",
    alignItems: "stretch"
  },
  heroText: {
    flex: 1,
    gap: 10
  },
  heroEyebrow: {
    fontSize: 16,
    fontWeight: "700"
  },
  heroTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800"
  },
  heroDescription: {
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 700
  },
  heroPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 4
  },
  infoPill: {
    minHeight: 42,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center"
  },
  infoPillCompact: {
    minHeight: 38,
    paddingHorizontal: 12
  },
  infoPillText: {
    fontSize: 14,
    fontWeight: "600"
  },
  progressPill: {
    minHeight: 42,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  progressPillCompact: {
    minHeight: 38,
    paddingHorizontal: 10,
    gap: 8
  },
  progressPillLabel: {
    fontSize: 14,
    fontWeight: "700"
  },
  progressPillTrack: {
    width: 92,
    height: 6,
    borderRadius: 999,
    overflow: "hidden"
  },
  progressPillFill: {
    height: "100%",
    borderRadius: 999
  },
  progressPillValue: {
    fontSize: 14,
    fontWeight: "700"
  },
  heroIllustrationWrap: {
    minWidth: 360,
    alignItems: "center",
    justifyContent: "center",
    gap: 14
  },
  heroIllustration: {
    width: 220,
    height: 150,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center"
  },
  chatBlobLarge: {
    position: "absolute",
    top: 22,
    left: 42,
    width: 86,
    height: 78,
    borderRadius: 22
  },
  chatBlobSmall: {
    position: "absolute",
    top: 76,
    left: 70,
    width: 72,
    height: 56,
    borderRadius: 18
  },
  priceTag: {
    position: "absolute",
    right: 40,
    top: 36,
    width: 58,
    height: 92,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "6deg" }]
  },
  priceTagText: {
    color: "#FFFFFF",
    fontSize: 38,
    fontWeight: "800"
  },
  heroCta: {
    minHeight: 58,
    borderRadius: 18,
    paddingHorizontal: 28,
    alignItems: "center",
    justifyContent: "center"
  },
  heroCtaText: {
    color: "#FFFFFF",
    fontSize: 18,
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
  sortChevron: {
    fontSize: 16
  },
  cardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 18
  },
  scenarioTile: {
    width: "32.2%",
    minWidth: 300,
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    gap: 16,
    flexGrow: 1
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
    gap: 8
  },
  scenarioTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800"
  },
  scenarioDescription: {
    fontSize: 15,
    lineHeight: 22
  },
  scenarioFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap"
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
    alignItems: "stretch"
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
    flexDirection: "column"
  },
  messagesWrap: {
    flex: 1,
    minHeight: 0,
    position: "relative"
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
  messageList: {
    flex: 1,
    minHeight: 0,
    paddingRight: 10
  },
  messageListContent: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    gap: 10
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
    minWidth: 48,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    paddingHorizontal: 10,
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
    justifyContent: "center"
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  typingText: {
    fontSize: 14
  },
  scrollTrack: {
    position: "absolute",
    top: 8,
    bottom: 8,
    right: 4,
    width: 6,
    borderRadius: 999,
    backgroundColor: "rgba(122, 145, 134, 0.18)",
    overflow: "hidden"
  },
  scrollThumb: {
    width: "100%",
    borderRadius: 999,
    backgroundColor: "rgba(66, 121, 95, 0.55)"
  },
  inputWrap: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8
  },
  inputRow: {
    minHeight: 48,
    maxHeight: 118,
    borderRadius: 18,
    borderWidth: 1,
    paddingLeft: 14,
    paddingRight: 8,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10
  },
  chatInput: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 20,
    maxHeight: 80,
    paddingVertical: 0
  },
  sendButton: {
    minWidth: 112,
    height: 36,
    borderRadius: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center"
  },
  sendButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF"
  },
  insightColumn: {
    flex: 1,
    gap: 18,
    alignSelf: "stretch",
    minHeight: 0,
    justifyContent: "flex-start",
    height: "100%"
  },
  insightCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 14,
    gap: 12
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
    minHeight: 50,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    marginTop: 4
  },
  finishButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800"
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 18,
    paddingBottom: 4
  }
});
