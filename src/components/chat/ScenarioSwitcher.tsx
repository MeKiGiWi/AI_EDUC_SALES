import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../theme/useTheme";
import type { Scenario } from "../../types/academy";

interface ScenarioSwitcherProps {
  scenario?: Scenario;
  onPress: () => void;
  disabled?: boolean;
}

export function ScenarioSwitcher({ scenario, onPress, disabled }: ScenarioSwitcherProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Сменить сценарий"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.switcher,
        {
          backgroundColor: pressed ? theme.semantic.actionSecondary : theme.semantic.cardSubtle,
          borderColor: theme.semantic.border,
          borderRadius: theme.radius.lg,
          opacity: disabled ? 0.7 : 1
        }
      ]}
    >
      <View style={styles.textBlock}>
        <Text style={[styles.title, { color: theme.semantic.textPrimary }]} numberOfLines={1}>
          {scenario?.title ?? "Выберите сценарий"}
        </Text>
      </View>
      <Text style={[styles.actionText, { color: theme.semantic.actionSecondaryText }]}>Сменить</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  switcher: {
    minHeight: 48,
    minWidth: 260,
    maxWidth: 520,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexShrink: 1
  },
  textBlock: {
    flex: 1,
    minWidth: 0
  },
  title: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800"
  },
  actionText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "800"
  }
});
