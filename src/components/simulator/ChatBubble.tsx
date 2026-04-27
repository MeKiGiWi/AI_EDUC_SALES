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

  return (
    <View
      style={[
        styles.wrapper,
        {
          alignSelf: isLearner ? "flex-end" : "stretch"
        }
      ]}
    >
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isLearner
              ? theme.semantic.cardAccent
              : isCoach
                ? theme.semantic.actionSecondary
                : theme.semantic.cardSubtle,
            borderRadius: theme.radius.lg
          }
        ]}
      >
        <Text style={[styles.meta, { color: theme.semantic.textMuted }]}>
          {message.speakerName} · {message.timestampLabel}
        </Text>
        <Text style={[styles.text, { color: theme.semantic.textPrimary }]}>{message.text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%"
  },
  bubble: {
    maxWidth: "92%",
    padding: 14,
    gap: 6
  },
  meta: {
    fontSize: 12,
    fontWeight: "700"
  },
  text: {
    fontSize: 15,
    lineHeight: 21
  }
});
