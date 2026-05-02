import React, { ReactNode } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import { useTheme } from "../../theme/useTheme";
import { AppButton } from "./AppButton";

interface AppBottomSheetProps {
  visible: boolean;
  title: string;
  description?: string;
  children?: ReactNode;
  onClose: () => void;
  hideCloseButton?: boolean;
  centeredHeader?: boolean;
  minHeight?: number;
}

export function AppBottomSheet({
  visible,
  title,
  description,
  children,
  onClose,
  hideCloseButton,
  centeredHeader,
  minHeight
}: AppBottomSheetProps) {
  const theme = useTheme();
  const layout = useResponsiveLayout();
  const isDesktop = layout.isDesktop;

  return (
    <Modal animationType={isDesktop ? "fade" : "slide"} transparent visible={visible} onRequestClose={onClose}>
      <View
        style={[
          styles.overlay,
          isDesktop ? styles.overlayDesktop : styles.overlayMobile,
          { backgroundColor: theme.colors.overlayStrong, padding: layout.screenPadding }
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            styles.sheetBase,
            isDesktop ? styles.sheetDesktop : styles.sheetMobile,
            {
              backgroundColor: theme.semantic.card,
              borderRadius: isDesktop ? theme.radius.xl : undefined,
              borderTopLeftRadius: isDesktop ? undefined : theme.radius.xl,
              borderTopRightRadius: isDesktop ? undefined : theme.radius.xl,
              borderColor: theme.semantic.border,
              ...(minHeight ? { minHeight } : {})
            }
          ]}
        >
          <View style={styles.header}>
            {!isDesktop ? <View style={[styles.handle, { backgroundColor: theme.semantic.border }]} /> : null}
            <Text style={[styles.title, { color: theme.semantic.textPrimary }, centeredHeader && styles.titleCentered]}>{title}</Text>
            {description ? <Text style={[styles.description, { color: theme.semantic.textSecondary }, centeredHeader && styles.descriptionCentered]}>{description}</Text> : null}
          </View>
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
          {!hideCloseButton ? <AppButton label="Закрыть" onPress={onClose} tone="secondary" fullWidth /> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1
  },
  overlayMobile: {
    justifyContent: "flex-end"
  },
  overlayDesktop: {
    alignItems: "center",
    justifyContent: "center"
  },
  sheetBase: {
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 32,
    gap: 20,
    maxHeight: "82%"
  },
  sheetMobile: {
    borderBottomWidth: 0
  },
  sheetDesktop: {
    width: "100%",
    maxWidth: 760,
    borderBottomWidth: 1
  },
  header: {
    gap: 16
  },
  handle: {
    alignSelf: "center",
    width: 48,
    height: 5,
    borderRadius: 999
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800"
  },
  titleCentered: {
    textAlign: "center"
  },
  descriptionCentered: {
    textAlign: "center"
  },
  description: {
    fontSize: 15,
    lineHeight: 22
  },
  content: {
    gap: 10
  },
  scrollArea: {
    maxHeight: 420
  }
});
