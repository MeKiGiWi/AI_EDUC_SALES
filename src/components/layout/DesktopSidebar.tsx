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
  simulatorActions?: {
    onChangeScenario: () => void;
    onFinishScenario: () => void;
    isFinishing: boolean;
    canFinish: boolean;
  };
  reportActions?: {
    onOpenScenarios: () => void;
  };
}

const routeLabels: Record<RouteName, string> = {
  Landing: "Лендинг",
  Audit: "Аудит",
  StudentHome: "Главная",
  Simulator: "ИИ-Тренажер",
  Reports: "Отчеты",
  ReportViewer: "Просмотр отчета"
};

export function DesktopSidebar({
  activeRoute,
  user,
  routes,
  onNavigate,
  simulatorActions,
  reportActions
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
        <View
          style={[
            styles.brandBlock,
            { backgroundColor: theme.semantic.card, borderColor: theme.semantic.border }
          ]}
        >
          <View style={styles.brandRow}>
            <View style={styles.brandMark}>
              <View style={[styles.brandMarkStripe, styles.brandMarkStripeTop]} />
              <View style={[styles.brandMarkStripe, styles.brandMarkStripeBottom]} />
            </View>
            <Text style={[styles.brandTitle, { color: theme.semantic.textPrimary }]}>
              цифровая{"\n"}методология
            </Text>
          </View>
          <Pressable
            onPress={() => onNavigate("Landing")}
            style={({ pressed }) => [styles.landingLink, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Text style={[styles.landingLinkText, { color: theme.semantic.textMuted }]}>
              Вернуться на лендинг
            </Text>
          </Pressable>
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
                { backgroundColor: theme.semantic.textPrimary, borderColor: theme.semantic.textPrimary }
              ]}
            >
              <Text style={[styles.avatarText, { color: "#FFFFFF" }]}>АМ</Text>
            </View>
            <View style={styles.userMetaBlock}>
              <Text style={[styles.userName, { color: theme.semantic.textPrimary }]}>{user.fullName}</Text>
              <Text style={[styles.userMeta, { color: theme.semantic.textSecondary }]}>{user.title}</Text>
              <Text style={[styles.userMeta, { color: theme.semantic.textSecondary }]}>{user.teamName}</Text>
            </View>
          </View>

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
                    route === activeRoute ? "#dbe6f7" : theme.semantic.card,
                  borderColor:
                    route === activeRoute ? "#c4d4ee" : theme.semantic.border
                }
              ]}
            >
              <View style={styles.navInner}>
                <Text
                  style={[
                    styles.navLabel,
                    {
                      color: theme.semantic.textPrimary
                    }
                  ]}
                >
                  {routeLabels[route]}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        {activeRoute === "Simulator" && simulatorActions ? (
          <View style={styles.sidebarActions}>
            <Pressable
              onPress={simulatorActions.onChangeScenario}
              style={[
                styles.secondaryAction,
                { backgroundColor: theme.semantic.card, borderColor: theme.semantic.border }
              ]}
            >
              <Text style={[styles.secondaryActionIcon, { color: theme.semantic.textSecondary }]}>⇄</Text>
              <Text style={[styles.secondaryActionText, { color: theme.semantic.textPrimary }]}>
                Сменить сценарий
              </Text>
            </Pressable>
            <Pressable
              onPress={simulatorActions.onFinishScenario}
              disabled={simulatorActions.isFinishing}
              style={[
                styles.primaryAction,
                {
                  backgroundColor: theme.semantic.actionPrimary,
                  borderColor: "transparent",
                  opacity: simulatorActions.canFinish ? 1 : 0.5
                }
              ]}
            >
              <Text style={[styles.primaryActionText, { color: "#FFFFFF" }]}>
                {simulatorActions.isFinishing ? "Сохраняем..." : "Завершить и получить отчёт"}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {reportActions ? (
          <View style={styles.sidebarActions}>
            <Pressable
              onPress={reportActions.onOpenScenarios}
              style={[
                styles.secondaryAction,
                { backgroundColor: theme.semantic.card, borderColor: theme.semantic.border }
              ]}
            >
              <Text style={[styles.secondaryActionIcon, { color: theme.semantic.textSecondary }]}>←</Text>
              <Text style={[styles.secondaryActionText, { color: theme.semantic.textPrimary }]}>
                К сценариям
              </Text>
            </Pressable>
          </View>
        ) : null}

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
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 18,
    gap: 14
  },
  brandBlock: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 14,
    gap: 12
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  brandMark: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#121A68",
    position: "relative",
    overflow: "hidden"
  },
  brandMarkStripe: {
    position: "absolute",
    height: 9,
    borderRadius: 20,
    backgroundColor: "#9CF000",
    transform: [{ rotate: "-35deg" }]
  },
  brandMarkStripeTop: { width: 28, left: 6, top: 9 },
  brandMarkStripeBottom: { width: 22, left: 10, top: 21 },
  brandTitle: {
    fontSize: 14,
    lineHeight: 14,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: -0.4
  },
  brandSubtitle: {
    fontSize: 14,
    lineHeight: 20
  },
  landingLink: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 2
  },
  landingLinkText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700"
  },
  landingLinkArrow: {
    fontSize: 14,
    lineHeight: 16,
    fontWeight: "700"
  },
  userCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 14,
    gap: 12
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
    gap: 8
  },
  sidebarActions: {
    marginTop: "auto",
    gap: 10,
    paddingTop: 8,
    marginBottom: 18
  },
  blockLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.1
  },
  navItem: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
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
  },
  secondaryAction: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  secondaryActionIcon: {
    width: 20,
    fontSize: 18,
    lineHeight: 18,
    marginTop: -4,
    fontWeight: "800",
    textAlign: "center"
  },
  secondaryActionText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700"
  },
  primaryAction: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  primaryActionText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    textAlign: "center"
  }
});
