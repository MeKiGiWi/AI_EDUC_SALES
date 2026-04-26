import React from "react";
import { StyleSheet, Text, View } from "react-native";

import type { KnowledgeMaterial } from "../../types/academy";
import { useTheme } from "../../theme/useTheme";
import { AppCard } from "../ui/AppCard";
import { AppButton } from "../ui/AppButton";
import { StatusPill } from "../ui/StatusPill";

interface MaterialCardProps {
  material: KnowledgeMaterial;
  onOpen: () => void;
  onExplainSimply: () => void;
  onGiveAnswerExample: () => void;
  onAddToPlan: () => void;
  onStartTraining: () => void;
}

export function MaterialCard({
  material,
  onOpen,
  onExplainSimply,
  onGiveAnswerExample,
  onAddToPlan,
  onStartTraining
}: MaterialCardProps) {
  const theme = useTheme();

  return (
    <AppCard>
      <View style={styles.topRow}>
        <View style={styles.textBlock}>
          <Text style={[styles.title, { color: theme.semantic.textPrimary }]}>{material.title}</Text>
          <Text style={[styles.description, { color: theme.semantic.textSecondary }]}>{material.description}</Text>
        </View>
        <StatusPill label={material.levelLabel} tone="success" />
      </View>
      <Text style={[styles.meta, { color: theme.semantic.textMuted }]}>
        {material.formatLabel} · {material.durationMinutes} мин · {material.updatedAt}
      </Text>
      <Text style={[styles.shortExplanation, { color: theme.semantic.textPrimary }]}>{material.shortExplanation}</Text>
      <View style={styles.buttonRow}>
        <AppButton label="Открыть материал" onPress={onOpen} tone="primary" />
        <AppButton label="Объясни проще" onPress={onExplainSimply} tone="secondary" />
        <AppButton label="Пример ответа" onPress={onGiveAnswerExample} tone="ghost" />
        <AppButton label="Добавить в план" onPress={onAddToPlan} tone="ghost" />
        <AppButton label="Начать тренировку" onPress={onStartTraining} tone="secondary" />
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12
  },
  textBlock: {
    flex: 1,
    gap: 8
  },
  title: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "800"
  },
  description: {
    fontSize: 14,
    lineHeight: 20
  },
  meta: {
    fontSize: 12,
    fontWeight: "600"
  },
  shortExplanation: {
    fontSize: 14,
    lineHeight: 20
  },
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  }
});
