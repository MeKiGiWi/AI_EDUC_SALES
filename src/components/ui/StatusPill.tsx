import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../theme/useTheme";

interface StatusPillProps {
  label: string;
  tone?: "success" | "warning" | "danger" | "neutral";
}

export function StatusPill({ label, tone = "neutral" }: StatusPillProps) {
  const theme = useTheme();

  const textColor =
    tone === "success"
      ? theme.semantic.success
      : tone === "warning"
        ? theme.semantic.warning
        : tone === "danger"
          ? theme.semantic.danger
        : theme.semantic.textMuted;

  return (
    <View style={[styles.pill, { backgroundColor: theme.semantic.cardSubtle, borderColor: theme.semantic.border, borderRadius: theme.radius.pill }]}>
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: "flex-start",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  label: {
    fontSize: 12,
    fontWeight: "700"
  }
});
