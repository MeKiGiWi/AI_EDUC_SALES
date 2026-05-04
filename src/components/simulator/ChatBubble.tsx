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
          alignItems: isLearner ? "flex-end" : "flex-start"
        }
      ]}
    >
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
            borderRadius: theme.radius.lg,
            borderBottomRightRadius: isLearner ? 6 : theme.radius.lg,
            borderBottomLeftRadius: isLearner ? theme.radius.lg : 6
          }
        ]}
      >
        <Text style={[styles.text, { color: isLearner ? "#FFFFFF" : theme.semantic.textPrimary }]}>
          {message.text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    maxWidth: 720
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
    maxWidth: "82%",
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderWidth: 1,
    shadowColor: "#1A3625",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1
  },
  meta: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "700"
  },
  text: {
    fontSize: 15,
    lineHeight: 22
  }
});
