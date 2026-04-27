import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../theme/useTheme";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
}

export function SectionHeader({ eyebrow, title, description }: SectionHeaderProps) {
  const theme = useTheme();

  return (
    <View style={styles.wrapper}>
      {eyebrow ? (
        <Text style={[styles.eyebrow, { color: theme.semantic.textMuted, letterSpacing: theme.typography.tracking.eyebrow }]}>
          {eyebrow}
        </Text>
      ) : null}
      <Text style={[styles.title, { color: theme.semantic.textPrimary }]}>{title}</Text>
      {description ? <Text style={[styles.description, { color: theme.semantic.textSecondary }]}>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase"
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800"
  },
  description: {
    fontSize: 15,
    lineHeight: 22
  }
});
