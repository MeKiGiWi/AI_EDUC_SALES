import React from "react";
import { StyleSheet, Text, View } from "react-native";

import type { AcademyUser } from "../../types/academy";
import { useTheme } from "../../theme/useTheme";
import { AppCard } from "../ui/AppCard";

interface MobileHeaderProps {
  title: string;
  subtitle: string;
  user: AcademyUser;
}

export function MobileHeader({ title, subtitle, user }: MobileHeaderProps) {
  const theme = useTheme();

  return (
    <AppCard tone="mint" style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.textBlock}>
          <Text style={[styles.title, { color: theme.semantic.textPrimary }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: theme.semantic.textSecondary }]}>{subtitle}</Text>
        </View>
        <View style={[styles.avatar, { backgroundColor: theme.semantic.actionSecondary }]}>
          <Text style={[styles.avatarText, { color: theme.semantic.actionSecondaryText }]}>{user.avatarLabel}</Text>
        </View>
      </View>
      <Text style={[styles.meta, { color: theme.semantic.textMuted }]}>
        {user.fullName} · {user.title} · {user.lastActiveAt}
      </Text>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 10
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12
  },
  textBlock: {
    flex: 1,
    gap: 6
  },
  title: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "800"
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center"
  },
  avatarText: {
    fontSize: 15,
    fontWeight: "800"
  },
  meta: {
    fontSize: 12,
    fontWeight: "600"
  }
});
