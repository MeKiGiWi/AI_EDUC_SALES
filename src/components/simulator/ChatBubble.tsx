import React from "react";
import { StyleSheet, Text, View } from "react-native";

import type { ScenarioMessage } from "../../types/academy";
import { useTheme } from "../../theme/useTheme";

interface ChatBubbleProps {
  message: ScenarioMessage;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const theme = useTheme();
  const isLearner = message.speakerRole === "learner";
  const isCoach = message.speakerRole === "coach";
  const isSystem = message.speakerRole === "system";
  const initials = isLearner ? "ВЫ" : (message.speakerName.slice(0, 2) || "AI").toUpperCase();

  if (isSystem) {
    return (
      <View style={styles.systemWrapper}>
        <View
          style={[
            styles.systemBubble,
            {
              backgroundColor: theme.semantic.card,
              borderColor: theme.semantic.border,
              borderRadius: theme.radius.lg
            }
          ]}
        >
          <Text style={[styles.meta, { color: theme.semantic.actionPrimary }]}>
            {message.speakerName} · {message.timestampLabel}
          </Text>
          <Text style={[styles.text, { color: theme.semantic.textSecondary }]}>{message.text}</Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.wrapper,
        {
          alignSelf: isLearner ? "flex-end" : "flex-start",
          flexDirection: isLearner ? "row-reverse" : "row",
          alignItems: "flex-end"
        }
      ]}
    >
      <View
        style={[
          styles.avatar,
          {
            backgroundColor: isLearner ? theme.semantic.actionPrimary : theme.semantic.cardAccent,
            borderColor: isLearner ? theme.semantic.actionPrimary : theme.semantic.border
          }
        ]}
      >
        <Text style={[styles.avatarText, { color: isLearner ? "#FFFFFF" : theme.semantic.actionSecondaryText }]}>
          {initials}
        </Text>
      </View>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isLearner
              ? theme.semantic.actionPrimary
              : isCoach
                ? theme.semantic.actionSecondary
                : theme.semantic.card,
            borderColor: isLearner ? theme.semantic.actionPrimary : theme.semantic.border,
            borderRadius: theme.radius.lg
          }
        ]}
      >
        <Text style={[styles.meta, { color: isLearner ? "rgba(255,255,255,0.78)" : theme.semantic.textMuted }]}>
          {message.speakerName} · {message.timestampLabel}
        </Text>
        <Text style={[styles.text, { color: isLearner ? "#FFFFFF" : theme.semantic.textPrimary }]}>
          {message.text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    maxWidth: "76%",
    gap: 9
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  avatarText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "800"
  },
  systemWrapper: {
    width: "100%",
    alignItems: "center"
  },
  systemBubble: {
    width: "100%",
    maxWidth: 640,
    padding: 16,
    gap: 8,
    borderWidth: 1
  },
  bubble: {
    maxWidth: "100%",
    paddingHorizontal: 15,
    paddingVertical: 12,
    gap: 6,
    borderWidth: 1,
    shadowColor: "#1A3625",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2
  },
  meta: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700"
  },
  text: {
    fontSize: 15,
    lineHeight: 21
  }
});
