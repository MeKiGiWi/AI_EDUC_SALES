import React from "react";
import { StyleSheet, View } from "react-native";

import { AppButton } from "../ui/AppButton";

interface QuickActionsProps {
  canGenerateReport: boolean;
  canCopy: boolean;
  busy?: boolean;
  onGenerateReport: () => void;
  onCopy: () => void;
}

export function QuickActions({
  canGenerateReport,
  canCopy,
  busy,
  onGenerateReport,
  onCopy
}: QuickActionsProps) {
  if (!canGenerateReport && !canCopy) {
    return null;
  }

  return (
    <View style={styles.row}>
      {canGenerateReport ? (
        <AppButton
          label={busy ? "Генерируется..." : "Сформировать отчет"}
          onPress={onGenerateReport}
          tone="primary"
          disabled={busy}
        />
      ) : null}
      {canCopy ? <AppButton label="Скопировать ответ" onPress={onCopy} tone="ghost" disabled={busy} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: "100%",
    maxWidth: 820,
    alignSelf: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    alignItems: "center"
  }
});
