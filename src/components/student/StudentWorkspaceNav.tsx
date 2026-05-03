import React from "react";
import { StyleSheet, Text, View } from "react-native";

import type { RouteName } from "../../navigation/routes";
import { useTheme } from "../../theme/useTheme";
import { AppButton } from "../ui/AppButton";

type StudentWorkspaceRoute = "StudentHome" | "Simulator" | "Reports";

interface StudentWorkspaceNavProps {
  activeRoute: StudentWorkspaceRoute;
  onNavigate: (route: RouteName) => void;
  compact?: boolean;
}

const navItems: Array<{ route: StudentWorkspaceRoute; label: string }> = [
  { route: "StudentHome", label: "Личный кабинет" },
  { route: "Simulator", label: "Тренажер" },
  { route: "Reports", label: "Отчеты" }
];

export function StudentWorkspaceNav({ activeRoute, onNavigate, compact = false }: StudentWorkspaceNavProps) {
  const theme = useTheme();

  return (
    <View style={[styles.wrapper, compact ? styles.wrapperCompact : styles.wrapperWide]}>
      <Text style={[styles.title, { color: theme.semantic.textMuted }]}>Разделы</Text>
      <View style={compact ? styles.buttonsCompact : styles.buttonsWide}>
        {navItems.map((item) => (
          <AppButton
            key={item.route}
            label={item.label}
            onPress={() => onNavigate(item.route)}
            tone={item.route === activeRoute ? "primary" : "ghost"}
            fullWidth={compact}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 10
  },
  wrapperWide: {
    width: "100%"
  },
  wrapperCompact: {
    width: "100%"
  },
  title: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1
  },
  buttonsWide: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  buttonsCompact: {
    gap: 10
  }
});
