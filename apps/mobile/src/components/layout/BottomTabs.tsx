import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { RouteName } from "../../navigation/routes";
import { routeConfig } from "../../navigation/routes";
import { useTheme } from "../../theme/useTheme";

interface BottomTabsProps {
  routes: RouteName[];
  activeRoute: RouteName;
  onNavigate: (route: RouteName) => void;
}

const tabIcons: Record<RouteName, string> = {
  Landing: "Старт",
  StudentHome: "Дом",
  KnowledgeBase: "База",
  Simulator: "Практика",
  ManagerDashboard: "Команда",
  HrDashboard: "HR",
  Admin: "Доступ",
  Reports: "Отчеты"
};

const tabLabels: Record<RouteName, string> = {
  Landing: "Старт",
  StudentHome: "Домой",
  KnowledgeBase: "База",
  Simulator: "Практика",
  ManagerDashboard: "Команда",
  HrDashboard: "HR/L&D",
  Admin: "Админ",
  Reports: "Отчеты"
};

export function BottomTabs({ routes, activeRoute, onNavigate }: BottomTabsProps) {
  const theme = useTheme();

  return (
    <View style={[styles.wrapper, { backgroundColor: theme.semantic.card, borderColor: theme.semantic.border }]}>
      {routes.map((route) => {
        const active = route === activeRoute;

        return (
          <Pressable
            key={route}
            accessibilityRole="tab"
            accessibilityLabel={`Перейти в раздел ${routeConfig[route].title}`}
            accessibilityState={{ selected: active }}
            onPress={() => onNavigate(route)}
            style={[
              styles.tab,
              {
                backgroundColor: active ? theme.semantic.actionSecondary : "transparent",
                borderRadius: theme.radius.md
              }
            ]}
          >
            <Text style={[styles.icon, { color: active ? theme.semantic.actionSecondaryText : theme.semantic.textMuted }]}>
              {tabIcons[route]}
            </Text>
            <Text style={[styles.label, { color: active ? theme.semantic.actionSecondaryText : theme.semantic.textMuted }]}>
              {tabLabels[route]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 16,
    borderTopWidth: 1,
    gap: 8
  },
  tab: {
    flex: 1,
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    gap: 4
  },
  icon: {
    fontSize: 11,
    fontWeight: "700"
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center"
  }
});
