import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { AppButton } from "../ui/AppButton";
import { AppBottomSheet } from "../ui/AppBottomSheet";
import { useTheme } from "../../theme/useTheme";

interface FinishConfirmSheetProps {
  visible: boolean;
  learnerMessageCount: number;
  onClose: () => void;
  onConfirm: () => void;
  isBusy: boolean;
}

export function FinishConfirmSheet({
  visible,
  learnerMessageCount,
  onClose,
  onConfirm,
  isBusy
}: FinishConfirmSheetProps) {
  const theme = useTheme();

  return (
    <AppBottomSheet
      visible={visible}
      title="Недостаточно реплик"
      description={`Вы отправили ${learnerMessageCount} из рекомендуемых 10 реплик. Этого мало для хорошей точности оценки.`}
      onClose={onClose}
      hideCloseButton
      centeredHeader
    >
      <Text style={[styles.body, { color: theme.semantic.textSecondary, textAlign: "center" }]}>
        Чем больше реплик вы отправите, тем точнее будет оценка ваших навыков. Рекомендуем продолжить диалог.
      </Text>
      <View style={styles.confirmButtonRow}>
        <View style={styles.confirmButtonItem}>
          <AppButton
            label="Завершить"
            onPress={onConfirm}
            tone="secondary"
            fullWidth
            disabled={isBusy}
          />
        </View>
        <View style={styles.confirmButtonItem}>
          <AppButton
            label="Продолжить"
            onPress={onClose}
            tone="primary"
            fullWidth
          />
        </View>
      </View>
    </AppBottomSheet>
  );
}

const styles = StyleSheet.create({
  body: {
    fontSize: 15,
    lineHeight: 22
  },
  confirmButtonRow: {
    flexDirection: "row",
    gap: 10
  },
  confirmButtonItem: {
    flex: 1
  }
});
