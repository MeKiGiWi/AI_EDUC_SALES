import React from "react";
import { StyleSheet, Text, View } from "react-native";

import type { LearningModule, Scenario } from "../../types/academy";
import { useTheme } from "../../theme/useTheme";
import { AppCard } from "../ui/AppCard";
import { AppButton } from "../ui/AppButton";

interface ScenarioPickerProps {
  modules: LearningModule[];
  scenarios: Scenario[];
  selectedModuleId: string;
  selectedScenarioId?: string;
  onSelectModule: (moduleId: string) => void;
  onSelectScenario: (scenarioId: string) => void;
}

export function ScenarioPicker({
  modules,
  scenarios,
  selectedModuleId,
  selectedScenarioId,
  onSelectModule,
  onSelectScenario
}: ScenarioPickerProps) {
  const theme = useTheme();
  const selectedModule = modules.find((module) => module.id === selectedModuleId);
  const filteredScenarios = scenarios.filter((scenario) => scenario.moduleId === selectedModuleId);

  return (
    <AppCard style={styles.wrapper}>
      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.semantic.textMuted }]}>Модуль</Text>
        <View style={styles.content}>
          {modules.map((module) => (
            <AppButton
              key={module.id}
              label={module.title}
              onPress={() => onSelectModule(module.id)}
              tone={module.id === selectedModuleId ? "primary" : "ghost"}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.semantic.textMuted }]}>Сценарий</Text>
        {filteredScenarios.length > 0 ? (
          <View style={styles.content}>
            {filteredScenarios.map((scenario) => (
              <AppButton
                key={scenario.id}
                label={scenario.title}
                onPress={() => onSelectScenario(scenario.id)}
                tone={scenario.id === selectedScenarioId ? "primary" : "ghost"}
              />
            ))}
          </View>
        ) : (
          <Text style={[styles.emptyText, { color: theme.semantic.textSecondary }]}>
            {selectedModule
              ? "Для этого модуля сценарии скоро появятся."
              : "Сначала выберите модуль, чтобы перейти к сценарию."}
          </Text>
        )}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 16
  },
  section: {
    gap: 10
  },
  label: {
    fontSize: 13,
    fontWeight: "700"
  },
  content: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "flex-start"
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20
  }
});
