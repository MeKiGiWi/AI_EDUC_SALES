import React, { ReactNode } from "react";
import { ScrollView, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import { useTheme } from "../../theme/useTheme";

interface AppScreenProps {
  children: ReactNode;
  footer?: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  variant?: "app" | "landing";
  disableBottomPadding?: boolean;
  sidebar?: ReactNode;
  fullBleed?: boolean;
  scrollEnabled?: boolean;
}

export function AppScreen({
  children,
  footer,
  contentContainerStyle,
  variant = "app",
  disableBottomPadding = false,
  sidebar,
  fullBleed = false,
  scrollEnabled = true
}: AppScreenProps) {
  const theme = useTheme();
  const layout = useResponsiveLayout();
  const hasDesktopSidebar = layout.isDesktop && Boolean(sidebar);
  const maxWidth =
    fullBleed
      ? undefined
      : variant === "landing"
      ? layout.isWide
        ? 1280
        : layout.isDesktop
          ? 1220
          : layout.contentMaxWidth
      : layout.isWide
        ? 1180
        : layout.isDesktop
          ? 1120
          : layout.contentMaxWidth;
  const bottomPadding = disableBottomPadding
    ? theme.spacing.screenBottom
    : fullBleed
      ? 0
    : footer && !layout.isDesktop
      ? theme.spacing.screenBottom + 92
      : theme.spacing.screenBottom + 24;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.semantic.background }]}>
      <View style={[styles.wrapper, hasDesktopSidebar && styles.desktopWrapper]}>
        {hasDesktopSidebar ? <View style={styles.sidebar}>{sidebar}</View> : null}
        <View style={styles.main}>
          <ScrollView
            contentContainerStyle={[
              {
                paddingTop: fullBleed ? 0 : theme.spacing.screenTop,
                paddingBottom: bottomPadding
              }
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            scrollEnabled={scrollEnabled}
          >
            <View
              style={[
                styles.content,
                fullBleed && styles.fullBleedContent,
                {
                  maxWidth,
                  paddingHorizontal: fullBleed ? 0 : layout.screenPadding
                },
                contentContainerStyle
              ]}
            >
              {children}
            </View>
          </ScrollView>
          {footer && !layout.isDesktop ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1
  },
  wrapper: {
    flex: 1
  },
  desktopWrapper: {
    flexDirection: "row"
  },
  sidebar: {
    width: 288
  },
  main: {
    flex: 1
  },
  content: {
    width: "100%",
    alignSelf: "center",
    gap: 18
  },
  fullBleedContent: {
    maxWidth: "100%",
    alignSelf: "stretch",
    gap: 0
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0
  }
});
