import React from "react";
import { StyleSheet, Text, View } from "react-native";

import type { DevelopmentTrack } from "../../types/academy";
import { useTheme } from "../../theme/useTheme";
import { AppCard } from "../ui/AppCard";
import { AppButton } from "../ui/AppButton";
import { StatusPill } from "../ui/StatusPill";

interface DevelopmentPlanCardProps {
  track: DevelopmentTrack;
  isAdded: boolean;
  onOpen: () => void;
  onAddToPlan: () => void;
  onDownloadPlan: () => void;
}

export function DevelopmentPlanCard({
  track,
  isAdded,
  onOpen,
  onAddToPlan,
  onDownloadPlan
}: DevelopmentPlanCardProps) {
  const theme = useTheme();

  return (
    <AppCard tone="mint">
      <StatusPill label={isAdded ? "В плане" : "План развития"} tone={isAdded ? "success" : "neutral"} />
      <Text style={[styles.title, { color: theme.semantic.textPrimary }]}>{track.title}</Text>
      <Text style={[styles.summary, { color: theme.semantic.textSecondary }]}>{track.summary}</Text>
      {track.milestones.slice(0, 3).map((milestone) => (
        <Text key={milestone} style={[styles.milestone, { color: theme.semantic.textPrimary }]}>
          • {milestone}
        </Text>
      ))}
      <View style={styles.buttonRow}>
        <AppButton label="Открыть план" onPress={onOpen} tone="primary" />
        <AppButton label={isAdded ? "Уже добавлено" : "Добавить в план"} onPress={onAddToPlan} tone="secondary" />
        <AppButton label="Скачать план" onPress={onDownloadPlan} tone="ghost" />
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800"
  },
  summary: {
    fontSize: 15,
    lineHeight: 22
  },
  milestone: {
    fontSize: 14,
    lineHeight: 20
  },
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  }
});
