import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../theme/useTheme";
import type { Scenario } from "../../types/academy";
import { AppButton } from "../ui/AppButton";

interface ChatEmptyStateProps {
  selectedScenario?: Scenario;
  scenarios: Scenario[];
  canStartDialogue: boolean;
  reasonText: string;
  onPickScenario: (scenarioId: string) => void;
  onStart: () => void;
}

export function ChatEmptyState({
  selectedScenario,
  scenarios,
  canStartDialogue,
  reasonText,
  onPickScenario,
  onStart
}: ChatEmptyStateProps) {
  const theme = useTheme();

  if (!selectedScenario) {
    return (
      <View style={styles.wrap}>
        <Text style={[styles.title, { color: theme.semantic.textPrimary }]}>
          Выберите сценарий, чтобы начать
        </Text>
        <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>
          Сценарий задает контекст работы AI.
        </Text>
        <View style={styles.actions}>
          {scenarios.slice(0, 3).map((scenario) => (
            <AppButton
              key={scenario.id}
              label={scenario.title}
              onPress={() => onPickScenario(scenario.id)}
              tone="secondary"
            />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: theme.semantic.textPrimary }]}>Начните диалог</Text>
      <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>
        {canStartDialogue ? "Напишите сообщение, чтобы начать работу со сценарием." : reasonText}
      </Text>
      <AppButton label="Начать диалог" onPress={onStart} tone="primary" disabled={!canStartDialogue} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    maxWidth: 620,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 48
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
    textAlign: "center"
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center"
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10
  }
});
