import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import type { RouteName } from "../../navigation/routes";
import type { AcademyUser, UserRole } from "../../types/academy";
import { useTheme } from "../../theme/useTheme";
import { AppButton } from "../ui/AppButton";

interface DesktopSidebarProps {
  activeRole: UserRole;
  activeRoute: RouteName;
  user: AcademyUser;
  routes: RouteName[];
  onNavigate: (route: RouteName) => void;
  onChangeRole: (role: UserRole) => void;
}

const roleLabels: Record<UserRole, string> = {
  student: "Ученик",
  manager: "Руководитель",
  hr: "HR / L&D",
  admin: "Админ"
};

const routeLabels: Record<RouteName, string> = {
  Landing: "Лендинг",
  StudentHome: "Ученик",
  KnowledgeBase: "База знаний",
  Simulator: "Симулятор",
  ManagerDashboard: "Руководитель",
  HrDashboard: "HR / L&D",
  Admin: "Админ",
  Reports: "Отчеты"
};

export function DesktopSidebar({
  activeRole,
  activeRoute,
  user,
  routes,
  onNavigate,
  onChangeRole
}: DesktopSidebarProps) {
  const theme = useTheme();

  return (
    <View style={[styles.sidebar, { backgroundColor: theme.semantic.cardSubtle, borderColor: theme.semantic.border }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.brandBlock}>
          <Text style={[styles.brandTitle, { color: theme.semantic.textPrimary }]}>AI Sales Academy</Text>
          <Text style={[styles.brandSubtitle, { color: theme.semantic.textSecondary }]}>
            ИИ-академия продаж
          </Text>
        </View>

        <View style={[styles.userCard, { backgroundColor: theme.semantic.card, borderColor: theme.semantic.border }]}>
          <Text style={[styles.userName, { color: theme.semantic.textPrimary }]}>{user.fullName}</Text>
          <Text style={[styles.userMeta, { color: theme.semantic.textSecondary }]}>
            {user.title} · {user.teamName}
          </Text>
        </View>

        <View style={styles.block}>
          <Text style={[styles.blockLabel, { color: theme.semantic.textMuted }]}>Разделы</Text>
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

        <View style={styles.block}>
          <Text style={[styles.blockLabel, { color: theme.semantic.textMuted }]}>Режим просмотра</Text>
          {(Object.keys(roleLabels) as UserRole[]).map((role) => (
            <AppButton
              key={role}
              label={roleLabels[role]}
              onPress={() => onChangeRole(role)}
              tone={role === activeRole ? "secondary" : "ghost"}
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
    gap: 6
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
