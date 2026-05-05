import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import { useTheme } from "../../theme/useTheme";
import type { Scenario } from "../../types/academy";
import { AppButton } from "../ui/AppButton";
import { ScenarioSwitcher } from "./ScenarioSwitcher";

interface ChatHeaderProps {
  scenario?: Scenario;
  statusLabel: string;
  statusTone: "ready" | "loading" | "needsData" | "error";
  hasReport: boolean;
  onChangeScenario: () => void;
  onOpenReport: () => void;
}

const statusColors = {
  ready: "success",
  loading: "warning",
  needsData: "warning",
  error: "danger"
} as const;

export function ChatHeader({
  scenario,
  statusLabel,
  statusTone,
  hasReport,
  onChangeScenario,
  onOpenReport
}: ChatHeaderProps) {
  const theme = useTheme();
  const layout = useResponsiveLayout();
  const dotColor = theme.semantic[statusColors[statusTone]];

  return (
    <View
      style={[
        styles.header,
        layout.isMobile && styles.headerMobile,
        {
          backgroundColor: theme.semantic.card,
          borderColor: theme.semantic.border,
          borderRadius: theme.radius.xl
        }
      ]}
    >
      <View style={[styles.main, layout.isMobile && styles.mainMobile]}>
        <View style={styles.titleBlock}>
          <Text style={[styles.label, { color: theme.semantic.textMuted }]}>Текущий сценарий</Text>
        </View>
        <ScenarioSwitcher scenario={scenario} onPress={onChangeScenario} />
      </View>
      <View style={[styles.actions, layout.isMobile && styles.actionsMobile]}>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: theme.semantic.cardAccent,
              borderColor: theme.semantic.border
            }
          ]}
        >
          <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
          <Text style={[styles.statusText, { color: theme.semantic.textSecondary }]}>
            {statusLabel}
          </Text>
        </View>
        {hasReport ? (
          <AppButton label="Открыть отчет" onPress={onOpenReport} tone="secondary" />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    borderWidth: 0,
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  headerMobile: {
    alignItems: "stretch",
    flexDirection: "column",
    padding: 12
  },
  main: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  mainMobile: {
    alignItems: "stretch",
    flexDirection: "column"
  },
  titleBlock: {
    flexShrink: 0
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 10,
    flexWrap: "wrap"
  },
  actionsMobile: {
    justifyContent: "space-between"
  },
  statusBadge: {
    minHeight: 34,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 999
  },
  statusText: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "800"
  }
});
