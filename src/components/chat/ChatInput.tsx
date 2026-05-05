import React from "react";
import { StyleSheet, TextInput, View } from "react-native";

import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import { useTheme } from "../../theme/useTheme";
import { AppButton } from "../ui/AppButton";

interface ChatInputProps {
  value: string;
  placeholder: string;
  disabled?: boolean;
  onChangeText: (value: string) => void;
  onSend: () => void;
}

export function ChatInput({
  value,
  placeholder,
  disabled,
  onChangeText,
  onSend
}: ChatInputProps) {
  const theme = useTheme();
  const layout = useResponsiveLayout();

  return (
    <View
      style={[
        styles.wrap,
        layout.isMobile && styles.wrapMobile,
        {
          backgroundColor: theme.semantic.card,
          borderColor: theme.semantic.border,
          borderRadius: theme.radius.lg
        }
      ]}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.semantic.textMuted}
        multiline
        editable={!disabled}
        style={[
          styles.input,
          layout.isMobile && styles.inputMobile,
          {
            color: theme.semantic.textPrimary,
            backgroundColor: theme.semantic.cardSubtle,
            borderColor: theme.semantic.border,
            borderRadius: theme.radius.md
          }
        ]}
      />
      <AppButton label="Отправить" onPress={onSend} tone="primary" disabled={disabled || value.trim().length === 0} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    maxWidth: 780,
    alignSelf: "center",
    borderWidth: 1,
    padding: 8,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8
  },
  wrapMobile: {
    flexDirection: "column",
    alignItems: "stretch"
  },
  input: {
    flex: 1,
    minHeight: 46,
    maxHeight: 128,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    lineHeight: 21,
    textAlignVertical: "top"
  },
  inputMobile: {
    width: "100%",
    minHeight: 92
  }
});
