import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { AppBottomSheet } from "../../components/ui/AppBottomSheet";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { StatusPill } from "../../components/ui/StatusPill";
import { landingContent } from "../../data/landingContent";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import { roleLabels } from "../../navigation/routes";
import { useTheme } from "../../theme/useTheme";
import type { RoleWorkspaceOption, UserRole } from "../../types/academy";

interface LandingScreenProps {
  roleOptions: RoleWorkspaceOption[];
  onEnterRole: (role: UserRole) => void;
}

type LandingSheetState =
  | { kind: "roles" }
  | { kind: "nav"; title: string; body: string }
  | { kind: "contact" }
  | null;

export function LandingScreen({ roleOptions, onEnterRole }: LandingScreenProps) {
  const theme = useTheme();
  const layout = useResponsiveLayout();
  const [sheetState, setSheetState] = useState<LandingSheetState>(null);
  const [selectedFaqIndex, setSelectedFaqIndex] = useState<number | null>(0);
  const [activeNavId, setActiveNavId] = useState(landingContent.navLinks[0]?.id ?? "platform");
  const [contactName, setContactName] = useState("");
  const [contactCompany, setContactCompany] = useState("");
  const [contactGoal, setContactGoal] = useState("");
  const [requestSent, setRequestSent] = useState(false);

  const navSummary = useMemo(
    () => landingContent.navLinks.find((item) => item.id === activeNavId)?.summary ?? "",
    [activeNavId]
  );

  const isDesktop = layout.isDesktop;
  const featureCardWidth = isDesktop ? "48%" : "100%";
  const pricingWidth = isDesktop ? "31.5%" : "100%";
  const audienceWidth = layout.isWide ? "31.5%" : isDesktop ? "48%" : "100%";

  function openRolePicker() {
    setSheetState({ kind: "roles" });
  }

  function openContact() {
    setSheetState({ kind: "contact" });
  }

  return (
    <>
      <View style={[styles.page, { gap: isDesktop ? 28 : 22 }]}>
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
                  onPress={() => {
                    setActiveNavId(link.id);
                    setSheetState({ kind: "nav", title: link.label, body: link.summary });
                  }}
                  tone={activeNavId === link.id ? "secondary" : "ghost"}
                />
              ))}
            </View>
            <AppButton label="Войти" onPress={openRolePicker} tone="primary" />
          </View>
          <Text style={[styles.navSummary, { color: theme.semantic.textMuted }]}>В фокусе: {navSummary}</Text>
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
              <AppButton label="Войти" onPress={openRolePicker} tone="primary" />
              <AppButton label="Запросить запуск" onPress={openContact} tone="secondary" />
              <AppButton
                label="Посмотреть роли"
                onPress={() => setSheetState({ kind: "nav", title: "Роли", body: landingContent.navLinks[2]?.summary ?? "" })}
                tone="ghost"
              />
            </View>
          </View>

          <View style={styles.heroSideColumn}>
            <AppCard tone="mint" style={styles.kpiCard}>
              <Text style={[styles.kpiEyebrow, { color: theme.semantic.textMuted }]}>Единый контур</Text>
              <Text style={[styles.kpiValue, { color: theme.semantic.textPrimary }]}>4 роли и 1 рабочая среда</Text>
              <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>
                Ученик, руководитель, HR / L&D и администратор работают в одном продукте с понятными зонами доступа.
              </Text>
            </AppCard>
            <AppCard style={styles.kpiCard}>
              <Text style={[styles.kpiEyebrow, { color: theme.semantic.textMuted }]}>Практика каждый день</Text>
              <Text style={[styles.kpiValue, { color: theme.semantic.textPrimary }]}>Короткие сессии и роль-ориентированная аналитика</Text>
              <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>
                Один и тот же интерфейс помогает и тренировать диалог, и управлять прогрессом команды.
              </Text>
            </AppCard>
          </View>
        </View>

        <AppCard>
          <Text style={[styles.sectionTitle, { color: theme.semantic.textPrimary }]}>
            Почему обычное обучение редко меняет поведение в продажах
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
          <Text style={[styles.sectionTitle, { color: theme.semantic.textPrimary }]}>Как устроен путь внутри продукта</Text>
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
            <Text style={[styles.sectionTitle, { color: theme.semantic.textPrimary }]}>Тренажер разговора</Text>
            {landingContent.trainerItems.map((item) => (
              <View key={item.title} style={styles.textGroup}>
                <Text style={[styles.cardTitle, { color: theme.semantic.textPrimary }]}>{item.title}</Text>
                <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>{item.description}</Text>
              </View>
            ))}
            <AppButton label="Войти" onPress={openRolePicker} tone="primary" />
          </AppCard>

          <AppCard tone="mint" style={styles.chatCard}>
            <Text style={[styles.cardTitle, { color: theme.semantic.textPrimary }]}>Как выглядит практика</Text>
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
              <Text style={[styles.cardTitle, { color: theme.semantic.textPrimary }]}>Что пользователь видит после завершения</Text>
              <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>Оценка по компетенциям</Text>
              <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>Точки роста и пример сильного ответа</Text>
              <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>Рекомендации, которые можно добавить в план</Text>
            </AppCard>
          </AppCard>
        </View>

        <AppCard>
          <Text style={[styles.sectionTitle, { color: theme.semantic.textPrimary }]}>Рабочие пространства по ролям</Text>
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
          <Text style={[styles.sectionTitle, { color: theme.semantic.textPrimary }]}>Что команда получает внутри платформы</Text>
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
          <Text style={[styles.sectionTitle, { color: theme.semantic.textPrimary }]}>Варианты запуска</Text>
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
                  <AppButton label={plan.ctaLabel} onPress={openRolePicker} tone={plan.featured ? "primary" : "secondary"} fullWidth />
                  <AppButton label="Запросить запуск" onPress={openContact} tone="ghost" fullWidth />
                </View>
              </View>
            ))}
          </View>
        </AppCard>

        <AppCard tone="mint">
          <Text style={[styles.sectionTitle, { color: theme.semantic.textPrimary }]}>Операционный контур и доступы</Text>
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
          <Text style={[styles.sectionTitle, { color: theme.semantic.textPrimary }]}>
            Вход в рабочее пространство начинается с выбора роли
          </Text>
          <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>
            Пользователь сначала выбирает, в каком контуре он работает сегодня, а затем попадает сразу в свой кабинет.
          </Text>
          <View style={styles.ctaRow}>
            <AppButton label="Войти" onPress={openRolePicker} tone="primary" />
            <AppButton label="Запросить запуск" onPress={openContact} tone="secondary" />
          </View>
        </AppCard>
      </View>

      <AppBottomSheet
        visible={sheetState !== null}
        title={
          sheetState?.kind === "roles"
            ? "Выберите роль"
            : sheetState?.kind === "contact"
              ? "Запросить запуск"
              : sheetState?.title ?? ""
        }
        description={
          sheetState?.kind === "roles"
            ? "После выбора вы сразу попадете в рабочее пространство нужной роли."
            : sheetState?.kind === "contact"
              ? "Заявка сохраняется локально и показывает будущий путь входа для команды."
              : "Раздел лендинга выбран из верхней навигации."
        }
        onClose={() => setSheetState(null)}
      >
        {sheetState?.kind === "roles" ? (
          <View style={styles.buttonColumn}>
            {roleOptions.map((option) => (
              <Pressable
                key={option.role}
                onPress={() => {
                  setSheetState(null);
                  onEnterRole(option.role);
                }}
                style={[
                  styles.roleCard,
                  {
                    borderColor: theme.semantic.border,
                    backgroundColor: theme.semantic.cardSubtle
                  }
                ]}
              >
                <View style={styles.roleHeader}>
                  <Text style={[styles.cardTitle, { color: theme.semantic.textPrimary }]}>{option.title}</Text>
                  <StatusPill label={option.accessLabel} tone="success" />
                </View>
                <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>{option.summary}</Text>
                {option.capabilities.map((capability) => (
                  <Text key={capability} style={[styles.listItem, { color: theme.semantic.textPrimary }]}>
                    • {capability}
                  </Text>
                ))}
                <Text style={[styles.roleEnterLabel, { color: theme.semantic.actionPrimary }]}>
                  Перейти в кабинет {roleLabels[option.role].toLowerCase()}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {sheetState?.kind === "contact" ? (
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
              placeholder="Какую задачу в продажах хотите улучшить"
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
            {requestSent ? (
              <AppCard tone="mint">
                <Text style={[styles.body, { color: theme.semantic.textPrimary }]}>
                  Запрос сохранен: {contactName || "контакт"} · {contactCompany || "компания"}.
                </Text>
              </AppCard>
            ) : null}
            <AppButton label="Отправить запрос" onPress={() => setRequestSent(true)} tone="primary" fullWidth />
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
  chatCard: {
    flex: 1,
    gap: 12
  },
  chatBubbleCoach: {
    borderRadius: 22,
    padding: 16,
    gap: 6
  },
  chatBubbleLearner: {
    borderRadius: 22,
    padding: 16,
    gap: 6,
    marginLeft: 28
  },
  chatName: {
    fontSize: 13,
    fontWeight: "700"
  },
  scoreCard: {
    gap: 8
  },
  audienceCard: {
    borderRadius: 24,
    padding: 18,
    gap: 8
  },
  featureCard: {
    borderRadius: 24,
    padding: 18,
    gap: 10
  },
  pricingCard: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 20,
    gap: 10
  },
  securityCard: {
    borderRadius: 24,
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
  faqRow: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    gap: 10
  },
  buttonColumn: {
    gap: 10
  },
  input: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    lineHeight: 20
  },
  textarea: {
    minHeight: 116,
    textAlignVertical: "top"
  },
  roleCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    gap: 10
  },
  roleHeader: {
    gap: 8
  },
  roleEnterLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700"
  }
});
