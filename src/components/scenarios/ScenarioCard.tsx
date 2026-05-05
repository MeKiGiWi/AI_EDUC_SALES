import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../theme/useTheme";
import type { Scenario } from "../../types/academy";
import { AppButton } from "../ui/AppButton";
import { AppCard } from "../ui/AppCard";
import { StatusPill } from "../ui/StatusPill";

interface ScenarioCardProps {
  scenario: Scenario;
  badge?: string;
  onLaunch: (scenarioId: string) => void;
}

export function ScenarioCard({ scenario, badge, onLaunch }: ScenarioCardProps) {
  const theme = useTheme();

  return (
    <AppCard style={styles.card}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.semantic.textPrimary }]} numberOfLines={2}>
          {scenario.title}
        </Text>
        {badge ? <StatusPill label={badge} tone="success" /> : null}
      </View>
      <View style={styles.content}>
        <View style={styles.descriptionSlot}>
          <Text style={[styles.description, { color: theme.semantic.textSecondary }]} numberOfLines={3}>
            {scenario.goal}
          </Text>
        </View>
        <View style={styles.competencyBlock}>
          <Text style={[styles.competencyLabel, { color: theme.semantic.textMuted }]}>
            Отрабатываемые компетенции
          </Text>
          <View style={styles.competencyList}>
            {scenario.targetCompetencies.slice(0, 4).map((competency) => (
              <Text
                key={competency}
                numberOfLines={1}
                style={[
                  styles.competencyPill,
                  {
                    color: theme.semantic.actionSecondaryText,
                    backgroundColor: theme.semantic.actionSecondary
                  }
                ]}
              >
                {competency}
              </Text>
            ))}
          </View>
        </View>
      </View>
      <AppButton label="Запустить" onPress={() => onLaunch(scenario.id)} tone="primary" fullWidth />
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 420,
    justifyContent: "space-between"
  },
  header: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10
  },
  title: {
    flex: 1,
    minWidth: 0,
    fontSize: 19,
    lineHeight: 25,
    fontWeight: "800"
  },
  description: {
    fontSize: 15,
    lineHeight: 22
  },
  descriptionSlot: {
    height: 70
  },
  content: {
    flex: 1,
    gap: 14
  },
  competencyBlock: {
    height: 134,
    gap: 10
  },
  competencyLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  competencyList: {
    maxHeight: 104,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    overflow: "hidden"
  },
  competencyPill: {
    maxWidth: "100%",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700"
  }
});
