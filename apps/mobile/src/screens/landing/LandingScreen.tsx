import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import type { RootStackParamList, RouteName } from "../../navigation/routes";
import { useTheme } from "../../theme/useTheme";
import { AppBottomSheet } from "../../components/ui/AppBottomSheet";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { StatusPill } from "../../components/ui/StatusPill";
import { landingContent, type LandingPricingPlan } from "../../data/landingContent";

interface LandingScreenProps {
  onNavigate: <T extends RouteName>(route: T, params?: RootStackParamList[T]) => void;
}

type LandingSheetState =
  | { kind: "demo"; plan?: LandingPricingPlan }
  | { kind: "nav"; title: string; body: string }
  | null;

export function LandingScreen({ onNavigate }: LandingScreenProps) {
  const theme = useTheme();
  const layout = useResponsiveLayout();
  const [sheetState, setSheetState] = useState<LandingSheetState>(null);
  const [selectedFaqIndex, setSelectedFaqIndex] = useState<number | null>(0);
  const [activeNavId, setActiveNavId] = useState(landingContent.navLinks[0]?.id ?? "platform");
  const [contactName, setContactName] = useState("");
  const [contactCompany, setContactCompany] = useState("");
  const [contactGoal, setContactGoal] = useState("");
  const [demoRequested, setDemoRequested] = useState(false);

  const navSummary = useMemo(
    () => landingContent.navLinks.find((item) => item.id === activeNavId)?.summary ?? "",
    [activeNavId]
  );

  const isDesktop = layout.isDesktop;
  const featureCardWidth = isDesktop ? "48%" : "100%";
  const pricingWidth = isDesktop ? "31.5%" : "100%";
  const audienceWidth = layout.isWide ? "31.5%" : isDesktop ? "48%" : "100%";

  return (
    <>
      <View style={[styles.page, { gap: isDesktop ? 28 : 22 }]}>
        <AppCard tone="mint" style={styles.navbarCard}>
          <View style={[styles.navbarRow, !isDesktop && styles.stackOnMobile]}>
            <View style={styles.brandBlock}>
              <Text style={[styles.brandTitle, { color: theme.semantic.textPrimary }]}>AI Sales Academy</Text>
              <Text style={[styles.brandSubtitle, { color: theme.semantic.textSecondary }]}>ИИ-академия продаж</Text>
            </View>
            <View style={[styles.navLinksRow, isDesktop && styles.navLinksDesktop]}>
              {landingContent.navLinks.map((link) => (
                <AppButton
                  key={link.id}
                  label={link.label}
                  onPress={() => {
                    setActiveNavId(link.id);
                    setSheetState({ kind: "nav", title: link.label, body: link.summary });
                  }}
                  tone={activeNavId === link.id ? "secondary" : "ghost"}
                />
              ))}
            </View>
            <AppButton
              label="Открыть демо"
              onPress={() => setSheetState({ kind: "demo" })}
              tone="primary"
            />
          </View>
          <Text style={[styles.navSummary, { color: theme.semantic.textMuted }]}>
            В фокусе: {navSummary}
          </Text>
        </AppCard>

        <View style={[styles.heroSection, isDesktop && styles.heroDesktop]}>
          <View style={[styles.heroMain, { backgroundColor: theme.semantic.card }]}>
            <StatusPill label={landingContent.hero.eyebrow} tone="success" />
            <Text style={[styles.heroTitle, { color: theme.semantic.textPrimary }]}>
              {landingContent.hero.title}
            </Text>
            <Text style={[styles.heroDescription, { color: theme.semantic.textSecondary }]}>
              {landingContent.hero.description}
            </Text>
            {landingContent.hero.highlights.map((item) => (
              <Text key={item} style={[styles.listItem, { color: theme.semantic.textPrimary }]}>
                • {item}
              </Text>
            ))}
            <View style={styles.ctaRow}>
              <AppButton label="Открыть демо-кабинет" onPress={() => onNavigate("StudentHome")} tone="primary" />
              <AppButton label="Попробовать симулятор" onPress={() => onNavigate("Simulator")} tone="secondary" />
              <AppButton
                label="Посмотреть для руководителя"
                onPress={() => onNavigate("ManagerDashboard")}
                tone="ghost"
              />
            </View>
          </View>

          <View style={styles.heroSideColumn}>
            <AppCard tone="mint" style={styles.kpiCard}>
              <Text style={[styles.kpiEyebrow, { color: theme.semantic.textMuted }]}>Mobile-first MVP</Text>
              <Text style={[styles.kpiValue, { color: theme.semantic.textPrimary }]}>7 экранов ролей</Text>
              <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>
                Ученик, база знаний, симулятор, руководитель, HR, админ и отчеты уже живут в одном Expo-контуре.
              </Text>
            </AppCard>
            <AppCard style={styles.kpiCard}>
              <Text style={[styles.kpiEyebrow, { color: theme.semantic.textMuted }]}>Desktop-ready</Text>
              <Text style={[styles.kpiValue, { color: theme.semantic.textPrimary }]}>Expo Web без отдельного frontend</Text>
              <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>
                Тот же код открывается и на телефоне, и в браузере на ПК через React Native Web.
              </Text>
            </AppCard>
          </View>
        </View>

        <AppCard>
          <Text style={[styles.sectionTitle, { color: theme.semantic.textPrimary }]}>
            Почему обычное обучение не доводит до результата
          </Text>
          <View style={styles.responsiveWrap}>
            {landingContent.problemItems.map((item) => (
              <View key={item.title} style={[styles.problemCard, { width: audienceWidth }]}>
                <Text style={[styles.cardTitle, { color: theme.semantic.textPrimary }]}>{item.title}</Text>
                <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>{item.description}</Text>
              </View>
            ))}
          </View>
        </AppCard>

        <AppCard tone="mint">
          <Text style={[styles.sectionTitle, { color: theme.semantic.textPrimary }]}>Как это работает</Text>
          <View style={styles.responsiveWrap}>
            {landingContent.howItWorksSteps.map((step, index) => (
              <View key={step.title} style={[styles.stepCard, { width: audienceWidth }]}>
                <Text style={[styles.stepIndex, { color: theme.semantic.actionPrimary }]}>{`0${index + 1}`}</Text>
                <Text style={[styles.cardTitle, { color: theme.semantic.textPrimary }]}>{step.title}</Text>
                <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>{step.description}</Text>
              </View>
            ))}
          </View>
        </AppCard>

        <View style={[styles.trainerSection, isDesktop && styles.heroDesktop]}>
          <AppCard style={styles.trainerInfo}>
            <Text style={[styles.sectionTitle, { color: theme.semantic.textPrimary }]}>ИИ-тренажер</Text>
            {landingContent.trainerItems.map((item) => (
              <View key={item.title} style={styles.textGroup}>
                <Text style={[styles.cardTitle, { color: theme.semantic.textPrimary }]}>{item.title}</Text>
                <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>{item.description}</Text>
              </View>
            ))}
            <AppButton label="Начать тренировку" onPress={() => onNavigate("Simulator")} tone="primary" />
          </AppCard>

          <AppCard tone="mint" style={styles.chatMockCard}>
            <Text style={[styles.cardTitle, { color: theme.semantic.textPrimary }]}>Mock диалог</Text>
            <View style={styles.chatBubbleCoach}>
              <Text style={[styles.chatName, { color: theme.semantic.textPrimary }]}>Клиент</Text>
              <Text style={[styles.body, { color: theme.semantic.textPrimary }]}>
                Мы уже пробовали обучение, но в разговорах команды мало что менялось.
              </Text>
            </View>
            <View style={[styles.chatBubbleLearner, { backgroundColor: theme.semantic.card }]}>
              <Text style={[styles.chatName, { color: theme.semantic.actionSecondaryText }]}>Менеджер</Text>
              <Text style={[styles.body, { color: theme.semantic.textPrimary }]}>
                Понял. Что именно не переносилось в работу: диагностика, аргументация или следующий шаг после встречи?
              </Text>
            </View>
            <AppCard style={styles.scoreCard}>
              <Text style={[styles.cardTitle, { color: theme.semantic.textPrimary }]}>Оценка компетенций</Text>
              <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>Диагностика потребности: 82/100</Text>
              <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>Работа с сомнением: 76/100</Text>
              <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>Следующий шаг: 88/100</Text>
            </AppCard>
          </AppCard>
        </View>

        <AppCard>
          <Text style={[styles.sectionTitle, { color: theme.semantic.textPrimary }]}>Для кого подходит академия</Text>
          <View style={styles.responsiveWrap}>
            {landingContent.audienceItems.map((item) => (
              <View key={item.title} style={[styles.audienceCard, { width: audienceWidth }]}>
                <Text style={[styles.cardTitle, { color: theme.semantic.textPrimary }]}>{item.title}</Text>
                <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>{item.audience}</Text>
                <Text style={[styles.body, { color: theme.semantic.textPrimary }]}>{item.result}</Text>
                {item.skills.map((skill) => (
                  <Text key={skill} style={[styles.listItem, { color: theme.semantic.textSecondary }]}>
                    • {skill}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        </AppCard>

        <AppCard tone="mint">
          <Text style={[styles.sectionTitle, { color: theme.semantic.textPrimary }]}>Функциональные блоки MVP</Text>
          <View style={styles.responsiveWrap}>
            {landingContent.featureItems.map((item) => (
              <View key={item.title} style={[styles.featureCard, { width: featureCardWidth }]}>
                <StatusPill label={item.tag} tone="neutral" />
                <Text style={[styles.cardTitle, { color: theme.semantic.textPrimary }]}>{item.title}</Text>
                <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>{item.description}</Text>
              </View>
            ))}
          </View>
        </AppCard>

        <AppCard>
          <Text style={[styles.sectionTitle, { color: theme.semantic.textPrimary }]}>MVP-пакеты</Text>
          <View style={styles.responsiveWrap}>
            {landingContent.pricingPlans.map((plan) => (
              <View
                key={plan.name}
                style={[
                  styles.pricingCard,
                  {
                    width: pricingWidth,
                    backgroundColor: plan.featured ? theme.semantic.cardAccent : theme.semantic.cardSubtle,
                    borderColor: theme.semantic.border
                  }
                ]}
              >
                <Text style={[styles.cardTitle, { color: theme.semantic.textPrimary }]}>{plan.name}</Text>
                <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>{plan.caption}</Text>
                {plan.features.map((feature) => (
                  <Text key={feature} style={[styles.listItem, { color: theme.semantic.textPrimary }]}>
                    • {feature}
                  </Text>
                ))}
                <View style={styles.buttonColumn}>
                  <AppButton
                    label={plan.ctaLabel}
                    onPress={() => setSheetState({ kind: "demo", plan })}
                    tone={plan.featured ? "primary" : "secondary"}
                    fullWidth
                  />
                  <AppButton label="Открыть демо" onPress={() => onNavigate("StudentHome")} tone="ghost" fullWidth />
                </View>
              </View>
            ))}
          </View>
        </AppCard>

        <AppCard tone="mint">
          <Text style={[styles.sectionTitle, { color: theme.semantic.textPrimary }]}>Security / backend-ready</Text>
          <View style={styles.responsiveWrap}>
            {landingContent.securityItems.map((item) => (
              <View key={item.title} style={[styles.securityCard, { width: featureCardWidth }]}>
                <Text style={[styles.cardTitle, { color: theme.semantic.textPrimary }]}>{item.title}</Text>
                <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>{item.description}</Text>
              </View>
            ))}
          </View>
        </AppCard>

        <AppCard>
          <Text style={[styles.sectionTitle, { color: theme.semantic.textPrimary }]}>FAQ</Text>
          <View style={styles.buttonColumn}>
            {landingContent.faqItems.map((item, index) => {
              const opened = selectedFaqIndex === index;

              return (
                <Pressable
                  key={item.question}
                  onPress={() => setSelectedFaqIndex(opened ? null : index)}
                  style={[
                    styles.faqRow,
                    {
                      backgroundColor: opened ? theme.semantic.cardAccent : theme.semantic.card,
                      borderColor: theme.semantic.border
                    }
                  ]}
                >
                  <Text style={[styles.cardTitle, { color: theme.semantic.textPrimary }]}>{item.question}</Text>
                  <Text style={[styles.body, { color: opened ? theme.semantic.textPrimary : theme.semantic.textSecondary }]}>
                    {opened ? item.answer : "Нажмите, чтобы раскрыть ответ."}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </AppCard>

        <AppCard tone="mint">
          <Text style={[styles.sectionTitle, { color: theme.semantic.textPrimary }]}>Откройте продукт с того сценария, который нужен сейчас</Text>
          <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>
            Один входной экран для телефона и браузера на ПК: сначала понимание ценности, затем переход в нужный кабинет или симулятор.
          </Text>
          <View style={styles.ctaRow}>
            <AppButton label="Открыть приложение" onPress={() => onNavigate("StudentHome")} tone="primary" />
            <AppButton label="Симулятор диалога" onPress={() => onNavigate("Simulator")} tone="secondary" />
            <AppButton label="Отчеты" onPress={() => onNavigate("Reports")} tone="ghost" />
          </View>
        </AppCard>
      </View>

      <AppBottomSheet
        visible={sheetState !== null}
        title={
          sheetState?.kind === "demo"
            ? sheetState.plan
              ? `Запросить демо: ${sheetState.plan.name}`
              : "Запросить демо"
            : sheetState?.title ?? ""
        }
        description={
          sheetState?.kind === "demo"
            ? "Mock-заявка сохраняется локально и показывает будущий контур входа в продажу."
            : "Раздел лендинга выбран из верхней навигации."
        }
        onClose={() => setSheetState(null)}
      >
        {sheetState?.kind === "demo" ? (
          <>
            <TextInput
              value={contactName}
              onChangeText={setContactName}
              placeholder="Ваше имя"
              placeholderTextColor={theme.semantic.textMuted}
              style={[
                styles.input,
                {
                  borderColor: theme.semantic.border,
                  backgroundColor: theme.semantic.cardSubtle,
                  color: theme.semantic.textPrimary
                }
              ]}
            />
            <TextInput
              value={contactCompany}
              onChangeText={setContactCompany}
              placeholder="Компания"
              placeholderTextColor={theme.semantic.textMuted}
              style={[
                styles.input,
                {
                  borderColor: theme.semantic.border,
                  backgroundColor: theme.semantic.cardSubtle,
                  color: theme.semantic.textPrimary
                }
              ]}
            />
            <TextInput
              value={contactGoal}
              onChangeText={setContactGoal}
              placeholder="Что хотите улучшить в продажах"
              placeholderTextColor={theme.semantic.textMuted}
              multiline
              style={[
                styles.input,
                styles.textarea,
                {
                  borderColor: theme.semantic.border,
                  backgroundColor: theme.semantic.cardSubtle,
                  color: theme.semantic.textPrimary
                }
              ]}
            />
            {demoRequested ? (
              <AppCard tone="mint">
                <Text style={[styles.body, { color: theme.semantic.textPrimary }]}>
                  Mock-заявка сохранена: {contactName || "контакт"} · {contactCompany || "компания"}.
                </Text>
              </AppCard>
            ) : null}
            <AppButton
              label="Отправить mock-заявку"
              onPress={() => setDemoRequested(true)}
              tone="primary"
              fullWidth
            />
            <AppButton
              label="Сразу открыть демо-кабинет"
              onPress={() => {
                setSheetState(null);
                onNavigate("StudentHome");
              }}
              tone="secondary"
              fullWidth
            />
          </>
        ) : null}

        {sheetState?.kind === "nav" ? (
          <Text style={[styles.body, { color: theme.semantic.textPrimary }]}>{sheetState.body}</Text>
        ) : null}
      </AppBottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: 22
  },
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
  },
  heroSection: {
    gap: 16
  },
  heroDesktop: {
    flexDirection: "row",
    alignItems: "stretch"
  },
  heroMain: {
    flex: 1,
    borderRadius: 32,
    padding: 24,
    gap: 14
  },
  heroSideColumn: {
    flex: 0.78,
    gap: 16
  },
  heroTitle: {
    fontSize: 40,
    lineHeight: 44,
    fontWeight: "800"
  },
  heroDescription: {
    fontSize: 17,
    lineHeight: 25
  },
  ctaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  kpiCard: {
    minHeight: 148
  },
  kpiEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.4
  },
  kpiValue: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800"
  },
  sectionTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800"
  },
  responsiveWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14
  },
  problemCard: {
    borderRadius: 24,
    padding: 18,
    gap: 8
  },
  stepCard: {
    gap: 8
  },
  stepIndex: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "800"
  },
  trainerSection: {
    gap: 16
  },
  trainerInfo: {
    flex: 0.9
  },
  textGroup: {
    gap: 6
  },
  chatMockCard: {
    flex: 1,
    gap: 12
  },
  chatBubbleCoach: {
    borderRadius: 22,
    padding: 16,
    backgroundColor: "#D8F1E0",
    gap: 6
  },
  chatBubbleLearner: {
    borderRadius: 22,
    padding: 16,
    gap: 6
  },
  chatName: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.1
  },
  scoreCard: {
    padding: 16
  },
  audienceCard: {
    gap: 8
  },
  featureCard: {
    gap: 10
  },
  securityCard: {
    gap: 8
  },
  pricingCard: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 18,
    gap: 10
  },
  buttonColumn: {
    gap: 10
  },
  faqRow: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 18,
    gap: 8
  },
  cardTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800"
  },
  body: {
    fontSize: 15,
    lineHeight: 22
  },
  listItem: {
    fontSize: 14,
    lineHeight: 20
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    fontSize: 15
  },
  textarea: {
    minHeight: 108,
    paddingTop: 14,
    textAlignVertical: "top"
  }
});
