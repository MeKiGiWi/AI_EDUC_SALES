import React from "react";
import { StyleSheet, Text, View } from "react-native";

import type { CompetencyEvaluation } from "../../types/academy";
import { useTheme } from "../../theme/useTheme";
import { AppCard } from "../ui/AppCard";
import { ProgressBar } from "../ui/ProgressBar";

interface CompetencyScoreCardProps {
  score: CompetencyEvaluation;
}

export function CompetencyScoreCard({ score }: CompetencyScoreCardProps) {
  const theme = useTheme();

  return (
    <AppCard>
      <Text style={[styles.title, { color: theme.semantic.textPrimary }]}>{score.label}</Text>
      <ProgressBar value={score.value} label={score.summary} />
    </AppCard>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 16,
    fontWeight: "800"
  }
});
