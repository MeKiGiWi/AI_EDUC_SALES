import React, { ReactNode } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { useTheme } from "../../theme/useTheme";

interface AppCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  tone?: "default" | "mint";
}

export function AppCard({ children, style, tone = "default" }: AppCardProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        tone === "mint"
          ? {
              backgroundColor: theme.semantic.cardAccent
            }
          : {
              backgroundColor: theme.semantic.card
            },
        {
          borderColor: theme.semantic.border,
          borderRadius: theme.radius.xl
        },
        theme.shadows.soft,
        style
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    padding: 18,
    gap: 14
  }
});
