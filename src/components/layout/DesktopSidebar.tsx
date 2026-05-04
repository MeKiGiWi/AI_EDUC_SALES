import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { roleLabels, type RouteName } from "../../navigation/routes";
import type { AcademyUser, UserRole } from "../../types/academy";
import { useTheme } from "../../theme/useTheme";
import { AppButton } from "../ui/AppButton";

interface DesktopSidebarProps {
  activeRole: UserRole;
  activeRoute: RouteName;
  user: AcademyUser;
  routes: RouteName[];
  onNavigate: (route: RouteName) => void;
  onGoToLanding: () => void;
}

const routeLabels: Record<RouteName, string> = {
  Landing: "Лендинг",
  StudentHome: "Личный кабинет",
  Simulator: "Чат",
  Scenarios: "Сценарии",
  ManagerDashboard: "Панель команды",
  HrDashboard: "HR / L&D",
  Admin: "Администрирование",
  Reports: "Отчеты",
  ReportViewer: "Просмотр отчета"
};

export function DesktopSidebar({
  activeRole,
  activeRoute,
  user,
  routes,
  onNavigate,
  onGoToLanding
}: DesktopSidebarProps) {
  const theme = useTheme();

  return (
    <View style={[styles.sidebar, { backgroundColor: theme.semantic.cardSubtle, borderColor: theme.semantic.border }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.brandBlock}>
          <Text style={[styles.brandTitle, { color: theme.semantic.textPrimary }]}>AI Sales Academy</Text>
          <Text style={[styles.brandSubtitle, { color: theme.semantic.textSecondary }]}>
            Практика продаж с AI
          </Text>
        </View>

        <View style={[styles.userCard, { backgroundColor: theme.semantic.card, borderColor: theme.semantic.border }]}>
          <Text style={[styles.userName, { color: theme.semantic.textPrimary }]}>{user.fullName}</Text>
          <Text style={[styles.userMeta, { color: theme.semantic.textSecondary }]}>
            {roleLabels[activeRole]} · {user.title}
          </Text>
          <Text style={[styles.userMeta, { color: theme.semantic.textMuted }]}>{user.teamName}</Text>
          <AppButton label="На лендинг" onPress={onGoToLanding} tone="ghost" fullWidth />
        </View>

        <View style={styles.block}>
          <Text style={[styles.blockLabel, { color: theme.semantic.textMuted }]}>MVP</Text>
          {routes.map((route) => (
            <AppButton
              key={route}
              label={routeLabels[route]}
              onPress={() => onNavigate(route)}
              tone={route === activeRoute ? "primary" : "ghost"}
              fullWidth
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    flex: 1,
    borderRightWidth: 1
  },
  content: {
    padding: 20,
    gap: 18
  },
  brandBlock: {
    gap: 4
  },
  brandTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800"
  },
  brandSubtitle: {
    fontSize: 14,
    lineHeight: 20
  },
  userCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    gap: 8
  },
  userName: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700"
  },
  userMeta: {
    fontSize: 13,
    lineHeight: 18
  },
  block: {
    gap: 10
  },
  blockLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.1
  }
});
