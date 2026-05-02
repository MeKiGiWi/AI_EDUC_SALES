import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { AppButton } from "../ui/AppButton";
import { AppCard } from "../ui/AppCard";
import { landingContent } from "../../data/landingContent";
import { useTheme } from "../../theme/useTheme";

interface LandingNavbarProps {
  isDesktop: boolean;
  activeNavId: string;
  navSummary: string;
  onNavClick: (id: string, label: string, summary: string) => void;
  onEnterRole: () => void;
}

export function LandingNavbar({
  isDesktop,
  activeNavId,
  navSummary,
  onNavClick,
  onEnterRole
}: LandingNavbarProps) {
  const theme = useTheme();

  return (
    <AppCard tone="mint" style={styles.navbarCard}>
      <View style={[styles.navbarRow, !isDesktop && styles.stackOnMobile]}>
        <View style={styles.brandBlock}>
          <Text style={[styles.brandTitle, { color: theme.semantic.textPrimary }]}>AI Sales Academy</Text>
          <Text style={[styles.brandSubtitle, { color: theme.semantic.textSecondary }]}>
            Практика, обратная связь и развитие навыков
          </Text>
        </View>
        <View style={[styles.navLinksRow, isDesktop && styles.navLinksDesktop]}>
          {landingContent.navLinks.map((link) => (
            <AppButton
              key={link.id}
              label={link.label}
              onPress={() => onNavClick(link.id, link.label, link.summary)}
              tone={activeNavId === link.id ? "secondary" : "ghost"}
            />
          ))}
        </View>
        <AppButton label="Войти" onPress={onEnterRole} tone="primary" />
      </View>
      <Text style={[styles.navSummary, { color: theme.semantic.textMuted }]}>В фокусе: {navSummary}</Text>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  navbarCard: {
    gap: 14
  },
  navbarRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  stackOnMobile: {
    alignItems: "flex-start",
    flexDirection: "column"
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
  navLinksRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  navLinksDesktop: {
    flex: 1,
    justifyContent: "center"
  },
  navSummary: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600"
  }
});
