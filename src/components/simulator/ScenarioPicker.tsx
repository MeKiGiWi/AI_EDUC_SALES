import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import type { Scenario } from "../../types/academy";
import { useTheme } from "../../theme/useTheme";
import { AppButton } from "../ui/AppButton";

interface ScenarioPickerProps {
  scenarios: Scenario[];
  selectedScenarioId: string;
  onSelect: (scenarioId: string) => void;
}

export function ScenarioPicker({
  scenarios,
  selectedScenarioId,
  onSelect
}: ScenarioPickerProps) {
  const theme = useTheme();

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: theme.semantic.textMuted }]}>Сценарий</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {scenarios.map((scenario) => (
          <AppButton
            key={scenario.id}
            label={scenario.title}
            onPress={() => onSelect(scenario.id)}
            tone={scenario.id === selectedScenarioId ? "primary" : "ghost"}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 10
  },
  label: {
    fontSize: 13,
    fontWeight: "700"
  },
  content: {
    gap: 8,
    paddingRight: 12
  }
});
