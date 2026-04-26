import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../theme/useTheme";

interface ProgressBarProps {
  value: number;
  label?: string;
}

export function ProgressBar({ value, label }: ProgressBarProps) {
  const theme = useTheme();
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={[styles.label, { color: theme.semantic.textSecondary }]}>{label}</Text> : null}
      <View style={[styles.track, { backgroundColor: theme.semantic.cardSubtle, borderRadius: theme.radius.pill }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${safeValue}%`,
              backgroundColor: theme.semantic.actionPrimary,
              borderRadius: theme.radius.pill
            }
          ]}
        />
      </View>
      <Text style={[styles.value, { color: theme.semantic.textPrimary }]}>{safeValue}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8
  },
  label: {
    fontSize: 13,
    fontWeight: "600"
  },
  track: {
    height: 10,
    overflow: "hidden"
  },
  fill: {
    height: "100%"
  },
  value: {
    fontSize: 12,
    fontWeight: "700"
  }
});
