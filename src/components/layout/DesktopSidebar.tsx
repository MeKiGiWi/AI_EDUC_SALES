import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { type RouteName } from "../../navigation/routes";
import type { AcademyUser, UserRole } from "../../types/academy";
import { useTheme } from "../../theme/useTheme";

interface DesktopSidebarProps {
  activeRole: UserRole;
  activeRoute: RouteName;
  user: AcademyUser;
  routes: RouteName[];
  onNavigate: (route: RouteName) => void;
}

const routeLabels: Record<RouteName, string> = {
  Landing: "Лендинг",
  StudentHome: "Главная",
  Simulator: "Тренажер",
  Reports: "Отчеты",
  ReportViewer: "Просмотр отчета"
};

export function DesktopSidebar({
  activeRoute,
  user,
  routes,
  onNavigate
}: DesktopSidebarProps) {
  const theme = useTheme();
  const routeIcons: Partial<Record<RouteName, string>> = {
    StudentHome: "⌂",
    Simulator: "◉"
  };

  return (
    <View
      style={[
        styles.sidebar,
        {
          backgroundColor: theme.semantic.backgroundWarm,
          borderColor: theme.semantic.border
        }
      ]}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.brandBlock}>
          <View style={styles.brandRow}>
            <View
              style={[
                styles.brandIcon,
                { backgroundColor: theme.semantic.actionSecondary }
              ]}
            >
              <Text style={[styles.brandIconText, { color: theme.semantic.actionPrimary }]}>🎓</Text>
            </View>
            <Text style={[styles.brandTitle, { color: theme.semantic.textPrimary }]}>
              AI Sales Academy
            </Text>
          </View>
          <Text style={[styles.brandSubtitle, { color: theme.semantic.textSecondary }]}>
            Рабочее пространство роли
          </Text>
        </View>

        <View
          style={[
            styles.userCard,
            {
              backgroundColor: theme.semantic.card,
              borderColor: theme.semantic.border,
              shadowColor: theme.shadows.soft.shadowColor,
              shadowOpacity: theme.shadows.soft.shadowOpacity,
              shadowRadius: theme.shadows.soft.shadowRadius,
              shadowOffset: theme.shadows.soft.shadowOffset,
              elevation: theme.shadows.soft.elevation
            }
          ]}
        >
          <View style={styles.userHeader}>
            <View
              style={[
                styles.avatar,
                { backgroundColor: theme.colors.primaryPale, borderColor: theme.semantic.border }
              ]}
            >
              <Text style={[styles.avatarText, { color: theme.semantic.actionPrimary }]}>АМ</Text>
            </View>
            <View style={styles.userMetaBlock}>
              <Text style={[styles.userName, { color: theme.semantic.textPrimary }]}>{user.fullName}</Text>
              <Text style={[styles.userMeta, { color: theme.semantic.textSecondary }]}>{user.title}</Text>
              <Text style={[styles.userMeta, { color: theme.semantic.textSecondary }]}>{user.teamName}</Text>
            </View>
          </View>

          <Pressable
            onPress={() => onNavigate("Landing")}
            style={[
              styles.statusRow,
              { borderColor: theme.semantic.border, backgroundColor: theme.semantic.backgroundWarm }
            ]}
          >
            <View style={styles.statusLabelRow}>
              <View style={[styles.statusDot, { backgroundColor: theme.semantic.success }]} />
              <Text style={[styles.statusText, { color: theme.semantic.textPrimary }]}>На лендинге</Text>
            </View>
            <Text style={[styles.statusArrow, { color: theme.semantic.textSecondary }]}>›</Text>
          </Pressable>
        </View>

        <View style={styles.block}>
          <Text style={[styles.blockLabel, { color: theme.semantic.textMuted }]}>РАЗДЕЛЫ</Text>
          {routes.map((route) => (
            <Pressable
              key={route}
              onPress={() => onNavigate(route)}
              style={[
                styles.navItem,
                {
                  backgroundColor:
                    route === activeRoute ? theme.semantic.actionPrimary : theme.semantic.card,
                  borderColor: theme.semantic.border
                }
              ]}
            >
              <View style={styles.navInner}>
                <View
                  style={[
                    styles.navIconTile,
                    {
                      backgroundColor:
                        route === activeRoute ? "rgba(255,255,255,0.14)" : theme.semantic.backgroundWarm
                    }
                  ]}
                >
                  <Text
                    style={[
                      styles.navIcon,
                      {
                        color:
                          route === activeRoute ? "#FFFFFF" : theme.semantic.textSecondary
                      }
                    ]}
                  >
                    {routeIcons[route] ?? "•"}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.navLabel,
                    {
                      color:
                        route === activeRoute ? "#FFFFFF" : theme.semantic.textPrimary
                    }
                  ]}
                >
                  {routeLabels[route]}
                </Text>
              </View>
            </Pressable>
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
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 28,
    gap: 20
  },
  brandBlock: {
    gap: 6
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  brandIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  brandIconText: {
    fontSize: 16
  },
  brandTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "800"
  },
  brandSubtitle: {
    fontSize: 14,
    lineHeight: 20
  },
  userCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 14,
    gap: 14
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  userMetaBlock: {
    flex: 1,
    gap: 3
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "700"
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
  },
  statusRow: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  statusLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 999
  },
  statusText: {
    fontSize: 15,
    fontWeight: "600"
  },
  statusArrow: {
    fontSize: 24,
    lineHeight: 24
  },
  navItem: {
    minHeight: 56,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    justifyContent: "center"
  },
  navInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  navIconTile: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center"
  },
  navIcon: {
    fontSize: 17,
    fontWeight: "700"
  },
  navLabel: {
    fontSize: 16,
    fontWeight: "700"
  }
});
