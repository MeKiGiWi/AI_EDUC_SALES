import React from "react";
import { Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { legalContent } from "../../data/legal";

interface LeadConsentCheckboxesProps {
  marketingAccepted: boolean;
  personalDataAccepted: boolean;
  onMarketingChange: (accepted: boolean) => void;
  onPersonalDataChange: (accepted: boolean) => void;
  tone?: "dark" | "light";
}

function LegalLink({ href, children, tone }: { href: string; children: string; tone: "dark" | "light" }) {
  return (
    <Text
      accessibilityRole="link"
      {...(Platform.OS === "web" ? ({ href } as object) : null)}
      onPress={() => {
        void Linking.openURL(href);
      }}
      style={[styles.link, tone === "dark" ? styles.linkDark : styles.linkLight]}
    >
      {children}
    </Text>
  );
}

function ConsentRow({
  checked,
  onChange,
  children,
  tone
}: {
  checked: boolean;
  onChange: (accepted: boolean) => void;
  children: React.ReactNode;
  tone: "dark" | "light";
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={() => onChange(!checked)}
      style={styles.row}
    >
      <View style={[styles.box, tone === "dark" ? styles.boxDark : styles.boxLight, checked && styles.boxChecked]}>
        {checked ? <Text style={styles.check}>✓</Text> : null}
      </View>
      <Text style={[styles.text, tone === "dark" ? styles.textDark : styles.textLight]}>{children}</Text>
    </Pressable>
  );
}

export function LeadConsentCheckboxes({
  marketingAccepted,
  personalDataAccepted,
  onMarketingChange,
  onPersonalDataChange,
  tone = "dark"
}: LeadConsentCheckboxesProps) {
  return (
    <View style={styles.wrap}>
      <ConsentRow checked={marketingAccepted} onChange={onMarketingChange} tone={tone}>
        Согласие на рекламную рассылку
      </ConsentRow>
      <ConsentRow checked={personalDataAccepted} onChange={onPersonalDataChange} tone={tone}>
        Я даю{" "}
        <LegalLink href={legalContent.pages.personalDataConsent} tone={tone}>
          согласие
        </LegalLink>{" "}
        на обработку своих персональных данных в соответствии с{" "}
        <LegalLink href={legalContent.pages.personalDataPolicy} tone={tone}>
          политикой
        </LegalLink>
      </ConsentRow>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  box: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1
  },
  boxDark: { borderColor: "rgba(255,255,255,.58)", backgroundColor: "rgba(255,255,255,.12)" },
  boxLight: { borderColor: "#cfd6e8", backgroundColor: "#fff" },
  boxChecked: { borderColor: "#9cf000", backgroundColor: "#9cf000" },
  check: { color: "#121a68", fontSize: 13, lineHeight: 15, fontWeight: "900" },
  text: { flex: 1, fontSize: 12, lineHeight: 18 },
  textDark: { color: "rgba(255,255,255,.78)" },
  textLight: { color: "#60688d" },
  link: { fontSize: 12, lineHeight: 18, textDecorationLine: "underline", fontWeight: "700" },
  linkDark: { color: "#b8ff43" },
  linkLight: { color: "#121a68" }
});
