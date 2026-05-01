import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../theme/useTheme";

interface AppButtonProps {
  label: string;
  onPress: () => void;
  tone?: "primary" | "secondary" | "ghost";
  icon?: string;
  fullWidth?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
}

export function AppButton({
  label,
  onPress,
  tone = "primary",
  icon,
  fullWidth = false,
  disabled = false,
  accessibilityLabel
}: AppButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        fullWidth && styles.fullWidth,
        {
          backgroundColor:
            disabled
              ? theme.semantic.borderSubtle
              : tone === "primary"
              ? pressed
                ? theme.semantic.actionPrimaryPressed
                : theme.semantic.actionPrimary
              : tone === "secondary"
                ? theme.semantic.actionSecondary
                : "transparent",
          borderColor: tone === "ghost" ? theme.semantic.border : "transparent",
          borderRadius: theme.radius.pill,
          opacity: disabled ? 0.72 : 1
        }
      ]}
    >
      <View style={styles.row}>
        {icon ? <Text style={styles.icon}>{icon}</Text> : null}
        <Text
          style={[
            styles.label,
            {
              color:
                disabled
                  ? theme.semantic.textMuted
                  : tone === "primary"
                    ? "#FFFFFF"
                    : tone === "secondary"
                      ? theme.semantic.actionSecondaryText
                      : theme.semantic.textPrimary
            }
          ]}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 46,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    maxWidth: "100%"
  },
  fullWidth: {
    width: "100%"
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
    flexShrink: 1,
    textAlign: "center"
  },
  icon: {
    fontSize: 15
  }
});
