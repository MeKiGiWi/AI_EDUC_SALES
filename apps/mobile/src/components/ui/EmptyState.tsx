import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../theme/useTheme";
import { AppCard } from "./AppCard";
import { AppButton } from "./AppButton";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  const theme = useTheme();

  return (
    <AppCard tone="mint" style={styles.card}>
      <Text style={[styles.title, { color: theme.semantic.textPrimary }]}>{title}</Text>
      <Text style={[styles.description, { color: theme.semantic.textSecondary }]}>{description}</Text>
      <AppButton label={actionLabel} onPress={onAction} tone="primary" />
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "flex-start"
  },
  title: {
    fontSize: 18,
    fontWeight: "800"
  },
  description: {
    fontSize: 15,
    lineHeight: 22
  }
});
