import React, { ReactNode } from "react";
import { ScrollView, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "../../theme/useTheme";

interface AppScreenProps {
  children: ReactNode;
  footer?: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export function AppScreen({ children, footer, contentContainerStyle }: AppScreenProps) {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.semantic.background }]}>
      <View style={styles.wrapper}>
        <ScrollView
          contentContainerStyle={[
            {
              paddingTop: theme.spacing.screenTop,
              paddingBottom: theme.spacing.screenBottom + 92
            }
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.content,
              {
                paddingHorizontal: theme.spacing.screenHorizontal
              },
              contentContainerStyle
            ]}
          >
            {children}
          </View>
        </ScrollView>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
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
  content: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    gap: 18
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0
  }
});
