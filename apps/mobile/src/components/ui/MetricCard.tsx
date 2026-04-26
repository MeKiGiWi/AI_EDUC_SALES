import React from "react";
import { StyleSheet, Text, View } from "react-native";

import type { DashboardMetric } from "../../types/academy";
import { useTheme } from "../../theme/useTheme";
import { AppCard } from "./AppCard";

interface MetricCardProps {
  metric: DashboardMetric;
}

export function MetricCard({ metric }: MetricCardProps) {
  const theme = useTheme();

  const toneColor =
    metric.tone === "positive"
      ? theme.semantic.success
      : metric.tone === "warning"
        ? theme.semantic.warning
        : theme.semantic.textMuted;

  return (
    <AppCard style={styles.card}>
      <Text style={[styles.label, { color: theme.semantic.textMuted }]}>{metric.label}</Text>
      <Text style={[styles.value, { color: theme.semantic.textPrimary }]}>{metric.value}</Text>
      <View style={[styles.badge, { backgroundColor: theme.semantic.cardSubtle }]}>
        <Text style={[styles.change, { color: toneColor }]}>{metric.changeLabel}</Text>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 180
  },
  label: {
    fontSize: 13,
    fontWeight: "600"
  },
  value: {
    fontSize: 24,
    fontWeight: "800"
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999
  },
  change: {
    fontSize: 12,
    fontWeight: "700"
  }
});
