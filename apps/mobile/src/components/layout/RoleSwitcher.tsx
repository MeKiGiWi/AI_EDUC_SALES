import React from "react";
import { StyleSheet, Text, View } from "react-native";

import type { UserRole } from "../../types/academy";
import { useTheme } from "../../theme/useTheme";
import { AppButton } from "../ui/AppButton";

interface RoleSwitcherProps {
  activeRole: UserRole;
  onChangeRole: (role: UserRole) => void;
}

const roleLabels: Record<UserRole, string> = {
  student: "Ученик",
  manager: "Руководитель",
  hr: "HR / L&D",
  admin: "Админ"
};

export function RoleSwitcher({ activeRole, onChangeRole }: RoleSwitcherProps) {
  const theme = useTheme();
  const roles = Object.keys(roleLabels) as UserRole[];

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: theme.semantic.textMuted }]}>Режим просмотра</Text>
      <View style={styles.row}>
        {roles.map((role) => (
          <AppButton
            key={role}
            label={roleLabels[role]}
            onPress={() => onChangeRole(role)}
            tone={role === activeRole ? "primary" : "ghost"}
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
  label: {
    fontSize: 13,
    fontWeight: "700"
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  }
});
