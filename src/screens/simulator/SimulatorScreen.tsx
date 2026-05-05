import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
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
  onSendMessage: (text: string) => Promise<boolean>;
  onFinishScenario: (params: { scenarioId: string; scenarioTitle: string }) => void;
  startErrorText?: string | null;
  onDismissStartError?: () => void;
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

export function SimulatorScreen({
  data,
  activeScenarioId,
  activeSession,
  mode,
  onStartScenario,
  onBackToCatalog,
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
        onSendMessage={onSendMessage}
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
          <CircleActionButton label="◔" onPress={openProgressInfo} />
          <CircleActionButton label="?" onPress={openTrainerHelp} />
        </View>
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
            { backgroundColor: theme.semantic.card, borderColor: theme.semantic.border }
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
            <Text style={[styles.heroEyebrow, { color: theme.semantic.textSecondary }]}>
              Продолжить с места остановки
            </Text>
            <Text style={[styles.heroTitle, { color: theme.semantic.textPrimary }]}>
              {featuredScenario.title}
            </Text>
            <Text style={[styles.heroDescription, { color: theme.semantic.textSecondary }]}>
              {featuredScenario.description}
            </Text>
            <View style={styles.heroPills}>
              <InfoPill label={featuredScenario.duration} />
              <InfoPill label={`Уровень: ${featuredScenario.level}`} />
              <ProgressInfoPill label="Прогресс" value={featuredScenario.progressValue ?? 0} />
            </View>
          </View>

          <View style={styles.heroIllustrationWrap}>
            <View style={[styles.heroIllustration, { backgroundColor: theme.colors.primaryPale }]}>
              <View
                style={[styles.chatBlobLarge, { backgroundColor: "rgba(255,255,255,0.85)" }]}
              />
              <View
                style={[styles.chatBlobSmall, { backgroundColor: "rgba(255,255,255,0.72)" }]}
              />
              <View
                style={[
                  styles.priceTag,
                  {
                    backgroundColor: theme.colors.primarySoft,
                    borderColor: theme.semantic.actionPrimary
                  }
                ]}
              >
                <Text style={styles.priceTagText}>₽</Text>
              </View>
            </View>
            <Pressable
              onPress={() => onStartScenario(featuredScenario.id)}
              style={[styles.heroCta, { backgroundColor: theme.semantic.actionPrimary }]}
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
                  backgroundColor:
                    activeFilter === label ? theme.colors.primaryPale : theme.semantic.card,
                  borderColor: theme.semantic.border
                }
              ]}
            >
              <Text
                style={[
                  styles.filterPillText,
                  {
                    color:
                      activeFilter === label
                        ? theme.semantic.actionPrimary
                        : theme.semantic.textPrimary
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

      <AppBottomSheet
        visible={infoSheet !== null}
        title={infoSheet?.title ?? ""}
        description={infoSheet?.description}
        onClose={() => setInfoSheet(null)}
      >
        {infoSheet?.lines.map((line) => (
          <Text key={line} style={[styles.sheetLine, { color: theme.semantic.textPrimary }]}>
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
  onSendMessage,
  onFinishScenario
}: {
  data: SalesAcademyMock;
  selectedScenario: ScenarioCardItem;
  activeSession: ActiveDialogueSession | null;
  onBackToCatalog: () => void;
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
  const visibleReplyCountLabel =
    managerReplyCount > dialogue.replyTarget
      ? `${dialogue.replyTarget}+ / ${dialogue.replyTarget}`
      : `${Math.min(managerReplyCount, dialogue.replyTarget)} / ${dialogue.replyTarget}`;
  const isSending = activeSession?.isSending ?? false;
  const isFinishing = activeSession?.isFinishing ?? false;
  const isSessionActive = activeSession?.status === "active";
  const typingVisible = isSending;
  const typingDotsOpacity = useRef(new Animated.Value(0.35)).current;
  const errorText = activeSession?.errorText ?? null;
  const dialogueHeight = Math.max(theme.viewport.height - 18, 700);
  const dialogueBodyHeight = Math.max(theme.viewport.height - 96, 580);

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
    const wasSent = await onSendMessage(draftMessage);
    if (wasSent) {
      setDraftMessage("");
    }
  }

  return (
    <View
      style={[
        styles.screen,
        layout.isDesktop && { height: dialogueHeight, gap: 10 }
      ]}
    >
      <View style={[styles.dialogueHeader, !layout.isDesktop && styles.headerStack]}>
        <Text style={[styles.pageTitle, { color: theme.semantic.textPrimary }]}>Тренажер</Text>
        <View
          style={[
            styles.dialogueHeaderCenter,
            !layout.isDesktop && styles.dialogueHeaderCenterStack
          ]}
        >
          <Pressable
            onPress={onBackToCatalog}
            style={[
              styles.changeScenarioButton,
              { backgroundColor: theme.semantic.card, borderColor: theme.semantic.border }
            ]}
          >
            <Text style={[styles.changeScenarioIcon, { color: theme.semantic.textSecondary }]}>
              ⇄
            </Text>
            <Text style={[styles.changeScenarioText, { color: theme.semantic.textPrimary }]}>
              Сменить сценарий
            </Text>
          </Pressable>
        </View>
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
                Реплики менеджера:{" "}
                <Text
                  style={[styles.chatTopMetaStrong, { color: theme.semantic.textPrimary }]}
                >
                  {visibleReplyCountLabel}
                </Text>
              </Text>
              <View
                style={[
                  styles.chatProgressTrack,
                  { backgroundColor: theme.semantic.borderSubtle }
                ]}
              >
                <View
                  style={[
                    styles.chatProgressFill,
                    { backgroundColor: theme.semantic.actionPrimary, width: `${progress}%` }
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
                        activeSession?.status === "finished"
                          ? theme.semantic.warning
                          : theme.semantic.success
                    }
                  ]}
                />
                <Text style={[styles.chatTopMeta, { color: theme.semantic.textSecondary }]}>
                  {activeSession?.status === "finished" ? "Сессия завершена" : dialogue.status}
                </Text>
              </View>
              <Text style={[styles.chatTopMeta, { color: theme.semantic.textSecondary }]}>
                ◔ {messages[messages.length - 1]?.time ?? dialogue.time}
              </Text>
            </View>
          </View>

          <View style={styles.personaRow}>
            <View
              style={[
                styles.personaAvatar,
                { backgroundColor: theme.colors.primaryPale, borderColor: theme.semantic.border }
              ]}
            >
              <Text style={[styles.personaAvatarText, { color: theme.semantic.actionPrimary }]}>
                РП
              </Text>
            </View>
            <View style={styles.personaText}>
              <Text style={[styles.personaName, { color: theme.semantic.textPrimary }]}>
                {dialogue.persona.name}
              </Text>
              <Text style={[styles.personaMeta, { color: theme.semantic.textSecondary }]}>
                Компания: {dialogue.persona.company}
              </Text>
              <Text style={[styles.personaMeta, { color: theme.semantic.textSecondary }]}>
                Отдел: {dialogue.persona.department}
              </Text>
            </View>
          </View>

          {errorText ? (
            <View style={styles.errorNoticeWrap}>
              <ChatStateNotice
                kind="error"
                text={errorText}
                testID="simulator-chat-error"
              />
            </View>
          ) : null}

          <ScrollView
            ref={messageScrollRef}
            testID="simulator-message-list"
            style={styles.messageList}
            contentContainerStyle={styles.messageListContent}
            showsVerticalScrollIndicator={false}
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
                    backgroundColor:
                      message.author === "manager"
                        ? theme.colors.surfaceMint
                        : theme.semantic.card,
                    borderColor: theme.semantic.border
                  }
                ]}
              >
                <Text style={[styles.messageText, { color: theme.semantic.textPrimary }]}>
                  {message.text}
                </Text>
                <Text style={[styles.messageTime, { color: theme.semantic.textMuted }]}>
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
                      backgroundColor: theme.semantic.backgroundWarm,
                      borderColor: theme.semantic.border
                    }
                  ]}
                >
                  <Animated.Text
                    style={[
                      styles.typingDotsText,
                      { color: theme.semantic.textMuted, opacity: typingDotsOpacity }
                    ]}
                  >
                    ...
                  </Animated.Text>
                </View>
                <Text style={[styles.typingText, { color: theme.semantic.textMuted }]}>
                  Печатает
                </Text>
              </View>
            ) : null}
          </ScrollView>

          <View
            pointerEvents="none"
            style={[styles.inputFooterBackdrop, { backgroundColor: theme.semantic.card }]}
          />

          <View
            testID="simulator-chat-input-row"
            style={[
              styles.inputWrap,
              {
                backgroundColor: theme.semantic.card,
                borderTopColor: theme.semantic.borderSubtle
              }
            ]}
          >
            <View
              style={[
                styles.inputRow,
                { backgroundColor: theme.semantic.card, borderColor: theme.semantic.border }
              ]}
            >
              <TextInput
                testID="simulator-chat-input"
                accessibilityLabel="Поле ввода сообщения в тренажере"
                placeholder="Напишите сообщение..."
                placeholderTextColor={theme.semantic.textMuted}
                style={[styles.chatInput, chatInputWebReset, { color: theme.semantic.textPrimary }]}
                value={draftMessage}
                onChangeText={setDraftMessage}
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
                        ? theme.semantic.backgroundWarm
                        : theme.semantic.actionPrimary,
                    borderColor:
                      !draftMessage.trim() || isSending || !isSessionActive || isFinishing
                        ? theme.semantic.border
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
                          ? theme.semantic.textMuted
                          : "#FFFFFF"
                    }
                  ]}
                />
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.insightColumn}>
          <View
            style={[
              styles.insightCard,
              { backgroundColor: theme.semantic.card, borderColor: theme.semantic.border }
            ]}
          >
            <Text style={[styles.insightTitle, { color: theme.semantic.textPrimary }]}>
              Контекст сценария
            </Text>
            <InsightTextBlock label="Контекст" text={dialogue.context} />
            <InsightTextBlock label="Цель" text={dialogue.goal} />
            <InsightTextBlock label="Возражение" text={`«${dialogue.objection}»`} />
          </View>

          <Pressable
            testID="simulator-finish-button"
            onPress={() =>
              onFinishScenario({
                scenarioId: selectedScenario.id,
                scenarioTitle: selectedScenario.title
              })
            }
            disabled={isFinishing}
            style={[
              styles.finishButton,
              {
                backgroundColor: theme.semantic.actionPrimary,
                opacity: isFinishing ? 0.72 : 1
              }
            ]}
          >
            <Text style={styles.finishButtonText}>
              {isFinishing ? "Сохраняем отчет..." : "Завершить и получить отчет"}
            </Text>
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
      <Text
        style={[
          styles.segmentLabel,
          { color: active ? theme.semantic.actionPrimary : theme.semantic.textPrimary }
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
          <Text style={[styles.scenarioTitle, { color: theme.semantic.textPrimary }]}>
            {scenario.title}
          </Text>
          <Text style={[styles.scenarioDescription, { color: theme.semantic.textSecondary }]}>
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
              { backgroundColor: "rgba(92,143,115,0.12)" }
            ]}
          >
            <Text style={[styles.newBadgeText, { color: theme.colors.info }]}>
              {scenario.progressLabel}
            </Text>
          </View>
        ) : (
          <ProgressInfoPill label="" value={scenario.progressValue ?? 0} compact wide />
        )}
        <View style={styles.scenarioActionRow}>
          <InfoPill label={scenario.duration} compact />
          <InfoPill label={scenario.level} compact />
          <Pressable
            onPress={onPlay}
            style={[
              styles.playButton,
              { borderColor: theme.semantic.border, backgroundColor: theme.semantic.card }
            ]}
          >
            <Text style={[styles.playButtonText, { color: theme.semantic.actionPrimary }]}>▶</Text>
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
        { backgroundColor: theme.semantic.card, borderColor: theme.semantic.border }
      ]}
    >
      <Text style={[styles.circleButtonText, { color: theme.semantic.textPrimary }]}>
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
  compact,
  wide
}: {
  label: string;
  value: number;
  compact?: boolean;
  wide?: boolean;
}) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.progressPill,
        compact && styles.progressPillCompact,
        wide && styles.progressPillWide,
        { backgroundColor: theme.semantic.card, borderColor: theme.semantic.border }
      ]}
    >
      {label ? (
        <Text style={[styles.progressPillLabel, { color: theme.semantic.actionPrimary }]}>
          {label}
        </Text>
      ) : null}
      <View
        style={[styles.progressPillTrack, { backgroundColor: theme.semantic.borderSubtle }]}
      >
        <View
          style={[
            styles.progressPillFill,
            { backgroundColor: theme.semantic.actionPrimary, width: `${value}%` }
          ]}
        />
      </View>
      <Text style={[styles.progressPillValue, { color: theme.semantic.textPrimary }]}>
        {value}%
      </Text>
    </View>
  );
}

function toneBackground(
  theme: ReturnType<typeof useTheme>,
  tone: "mint" | "warning" | "info" | "violet" | "peach"
) {
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

function toneForeground(
  theme: ReturnType<typeof useTheme>,
  tone: "mint" | "warning" | "info" | "violet" | "peach"
) {
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
  sheetLine: {
    fontSize: 15,
    lineHeight: 22
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
  progressPillWide: {
    alignSelf: "stretch",
    justifyContent: "space-between"
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
    flexGrow: 1,
    minHeight: 248,
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
    minHeight: 104
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
    paddingBottom: 10
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
  messageList: {
    flex: 1,
    minHeight: 0,
    marginBottom: 78
  },
  messageListContent: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 96,
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
    gap: 14,
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
    marginTop: 0,
    minHeight: 46,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    marginBottom: 8
  },
  finishButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800"
  }
});
