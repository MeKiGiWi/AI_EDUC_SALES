import React, { ReactNode } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../theme/useTheme";
import { AppButton } from "./AppButton";

interface AppBottomSheetProps {
  visible: boolean;
  title: string;
  description?: string;
  children?: ReactNode;
  onClose: () => void;
}

export function AppBottomSheet({
  visible,
  title,
  description,
  children,
  onClose
}: AppBottomSheetProps) {
  const theme = useTheme();

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: theme.colors.overlayStrong }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.semantic.card,
              borderTopLeftRadius: theme.radius.xl,
              borderTopRightRadius: theme.radius.xl,
              borderColor: theme.semantic.border
            }
          ]}
        >
          <View style={styles.header}>
            <View style={[styles.handle, { backgroundColor: theme.semantic.border }]} />
            <Text style={[styles.title, { color: theme.semantic.textPrimary }]}>{title}</Text>
            {description ? <Text style={[styles.description, { color: theme.semantic.textSecondary }]}>{description}</Text> : null}
          </View>
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
          <AppButton label="Закрыть" onPress={onClose} tone="secondary" fullWidth />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end"
  },
  sheet: {
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    gap: 18,
    maxHeight: "82%"
  },
  header: {
    gap: 8
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
