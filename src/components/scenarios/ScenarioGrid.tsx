import React from "react";
import { StyleSheet, View } from "react-native";

import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import type { Scenario } from "../../types/academy";
import { ScenarioCard } from "./ScenarioCard";

interface ScenarioGridProps {
  scenarios: Scenario[];
  onLaunch: (scenarioId: string) => void;
}

export function ScenarioGrid({ scenarios, onLaunch }: ScenarioGridProps) {
  const layout = useResponsiveLayout();
  const cardWidth = layout.isWide ? "31.8%" : layout.isDesktop || layout.isTablet ? "48.4%" : "100%";

  return (
    <View style={styles.grid}>
      {scenarios.map((scenario, index) => (
        <View key={scenario.id} style={[styles.cardSlot, { width: cardWidth }]}>
          <ScenarioCard
            scenario={scenario}
            badge={index === 0 ? "Популярный" : index === 1 ? "MVP" : "Новый"}
            onLaunch={onLaunch}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "stretch",
    gap: 14
  },
  cardSlot: {
    alignSelf: "stretch",
    minHeight: 420
  }
});
