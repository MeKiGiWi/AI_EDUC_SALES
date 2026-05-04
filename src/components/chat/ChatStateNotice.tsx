import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../theme/useTheme";
import { AppButton } from "../ui/AppButton";

interface ChatStateNoticeProps {
  kind: "loading" | "error" | "info";
  text: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function ChatStateNotice({ kind, text, actionLabel, onAction }: ChatStateNoticeProps) {
  const theme = useTheme();
  const color =
    kind === "error"
      ? theme.semantic.danger
      : kind === "loading"
        ? theme.semantic.warning
        : theme.semantic.textSecondary;

  return (
    <View
      style={[
        styles.notice,
        {
          backgroundColor: theme.semantic.cardAccent,
          borderColor: theme.semantic.border,
          borderRadius: theme.radius.lg
        }
      ]}
    >
      {kind === "loading" ? <ActivityIndicator size="small" color={theme.semantic.actionPrimary} /> : null}
      <Text style={[styles.text, { color }]}>{text}</Text>
      {actionLabel && onAction ? (
        <AppButton label={actionLabel} onPress={onAction} tone={kind === "error" ? "secondary" : "ghost"} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    width: "100%",
    maxWidth: 820,
    alignSelf: "center",
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap"
  },
  text: {
    flex: 1,
    minWidth: 160,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700"
  }
});
