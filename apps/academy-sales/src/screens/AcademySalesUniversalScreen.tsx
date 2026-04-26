import React, { useMemo, useState } from "react";
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
  ViewStyle,
} from "react-native";

type Direction = {
  title: string;
  audience: string;
  result: string;
  points: string[];
};

type Plan = {
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
};

type NumberFieldProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  suffix: string;
};

const colors = {
  bg: "#F7FAF8",
  dark: "#020617",
  text: "#0F172A",
  muted: "#64748B",
  line: "#E2E8F0",
  green: "#7BE7BF",
  greenDark: "#047857",
  white: "#FFFFFF",
};

const directions: Direction[] = [
  {
    title: "B2B Sales Academy",
    audience: "Корпоративные продажи",
    result: "Рост корпоративных продаж и среднего чека",
    points: ["Диагностика потребностей", "Сложные сделки", "Возражения", "Ценность"],
  },
  {
    title: "B2C Sales Academy",
    audience: "Розница и сервис",
    result: "Рост конверсии обращений и среднего чека",
    points: ["Клиентский сервис", "Потребности", "Допродажи", "Эмоции клиента"],
  },
  {
    title: "Hunter Academy",
    audience: "SDR и лидогенерация",
    result: "Привлечение новых клиентов",
    points: ["Холодные касания", "Квалификация", "Отказы", "Встречи"],
  },
  {
    title: "Account Academy",
    audience: "Клиентские менеджеры",
    result: "Рост выручки с текущей базы и удержание",
    points: ["Развитие аккаунта", "Апсейл", "Кросс-сейл", "ЛПР"],
  },
  {
    title: "Teach Sales Academy",
    audience: "ПО, оборудование, сложные решения",
    result: "Победа в сложных сделках и тендерах",
    points: ["Продажа решений", "ROI", "Экономическая ценность", "Тендеры"],
  },
];

const engine = [
  ["Онлайн-контент", "Обучение по ролям, этапам сделки, продукту и стандартам компании"],
  ["Практика", "Кейсы, симуляции, задания и ИИ-тренер для регулярной отработки"],
  ["Оценка", "Компетенции, тесты, карта навыков, индивидуальные и командные отчёты"],
  ["Live-формат", "Разбор реальных сделок, воркшопы, групповые и индивидуальные коучинги"],
  ["Управление результатом", "Аналитика, KPI, трекинг прогресса и связь обучения с бизнесом"],
];

const plans: Plan[] = [
  {
    name: "BASE",
    price: "99 000 ₽ / мес.",
    description: "Для быстрого запуска ИИ-тренажёра и проверки гипотезы.",
    features: ["AI-тренажёр диалогов", "Базовые отчёты", "Готовые сценарии", "10 учеников"],
  },
  {
    name: "PRO",
    price: "350 000 ₽ / мес.",
    description: "Для полноценного внедрения Академии в отдел продаж.",
    features: ["До 20 сценариев", "SCORM и API", "Оценка компетенций", "Командные отчёты"],
    highlighted: true,
  },
  {
    name: "PREMIUM",
    price: "800 000 ₽ / мес.",
    description: "Для кастомной Академии под продукты, процессы и KPI компании.",
    features: ["До 100 сценариев", "Расширенная аналитика", "Кастомная база знаний", "Архитектура обучения"],
  },
];

function formatRub(value: number) {
  return `${Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ")} ₽`;
}

function onlyNumber(value: string) {
  const normalized = value.replace(/[^0-9]/g, "");
  return normalized.length ? Number(normalized) : 0;
}

export default function AcademySalesUniversalScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 760;
  const isDesktop = width >= 1024;

  const [sellers, setSellers] = useState(50);
  const [revenuePerSeller, setRevenuePerSeller] = useState(1_000_000);
  const [investment, setInvestment] = useState(1_000_000);
  const [growth, setGrowth] = useState(20);

  const calc = useMemo(() => {
    const monthlyRevenue = sellers * revenuePerSeller;
    const monthlyGain = monthlyRevenue * (growth / 100);
    const sixMonthGain = monthlyGain * 6;
    const roi = investment > 0 ? ((sixMonthGain - investment) / investment) * 100 : 0;
    const paybackMonths = monthlyGain > 0 ? investment / monthlyGain : 0;

    return {
      monthlyRevenue,
      monthlyGain,
      sixMonthGain,
      roi,
      paybackMonths,
    };
  }, [sellers, revenuePerSeller, investment, growth]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, isDesktop && styles.heroDesktop]}>
          <View style={styles.blobOne} />
          <View style={styles.blobTwo} />

          <View style={[styles.container, styles.heroContainer]}>
            <View style={styles.header}>
              <View style={styles.logoMark}>
                <Text style={styles.logoMarkText}>✦</Text>
              </View>

              <View>
                <Text style={styles.logoKicker}>TEACHBASE</Text>
                <Text style={styles.logoTitle}>Академия продаж</Text>
              </View>
            </View>

            <View style={[styles.heroGrid, isDesktop && styles.heroGridDesktop]}>
              <View style={[styles.heroCopy, isDesktop && styles.heroCopyDesktop]}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>ИИ-тренажёр · обучение · оценка · KPI</Text>
                </View>

                <Text style={[styles.heroTitle, isDesktop && styles.heroTitleDesktop]}>
                  Доводим знания до продаж
                </Text>

                <Text style={[styles.heroText, isDesktop && styles.heroTextDesktop]}>
                  Академия продаж объединяет онлайн-обучение, ИИ-тренажёры, оценку компетенций,
                  live-разборы и аналитику, чтобы продавцы не просто прошли курс, а начали
                  продавать лучше.
                </Text>

                <View style={[styles.buttonRow, isTablet && styles.buttonRowWide]}>
                  <TouchableOpacity
                    activeOpacity={0.86}
                    style={[styles.primaryButton, isTablet && styles.ctaButtonWide]}
                  >
                    <Text style={styles.primaryButtonText}>Получить демо</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.86}
                    style={[styles.secondaryButton, isTablet && styles.ctaButtonWide]}
                  >
                    <Text style={styles.secondaryButtonText}>Рассчитать эффект</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.dialogCard, isDesktop && styles.dialogCardDesktop]}>
                <View style={styles.dialogHeader}>
                  <View>
                    <Text style={styles.dialogKicker}>AI Sales Session</Text>
                    <Text style={styles.dialogTitle}>Тренировка продавца</Text>
                  </View>

                  <View style={styles.liveBadge}>
                    <Text style={styles.liveBadgeText}>Live</Text>
                  </View>
                </View>

                <View style={styles.clientBubble}>
                  <Text style={styles.clientBubbleText}>
                    Добрый день. Хочу понять, как быстро команда начнёт работать по единому
                    стандарту.
                  </Text>
                </View>

                <View style={styles.managerBubble}>
                  <Text style={styles.managerBubbleText}>
                    Уточню: критичнее адаптация новичков, рост конверсии или контроль качества
                    диалогов?
                  </Text>
                </View>

                <View style={styles.metricsRow}>
                  <Metric value="78%" label="диагностика" />
                  <Metric value="86%" label="ценность" />
                  <Metric value="72%" label="закрытие" />
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.container, styles.statsGrid, isTablet && styles.statsGridWide]}>
          <Stat value="до 40%" label="сокращение времени выхода новичка на результат" />
          <Stat value="до 25%" label="рост конверсии в сделки" />
          <Stat value="до 20%" label="рост выручки" />
          <Stat value="до 30%" label="точность прогноза продаж" />
        </View>

        <View style={[styles.container, styles.sectionBlock]}>
          <View style={[styles.problemSection, isDesktop && styles.problemSectionDesktop]}>
            <View style={styles.problemIntro}>
              <SectionLabel label="Проблема" />

              <Text style={[styles.sectionTitle, isDesktop && styles.sectionTitleDesktop]}>
                Почему продажи не растут?
              </Text>

              <Text style={[styles.sectionText, isDesktop && styles.sectionTextDesktop]}>
                Курсы есть. Скрипты есть. Презентации тоже героически лежат в папке
                “финал_последняя_версия”. Но без практики и сопровождения обучение не превращается
                в навык.
              </Text>
            </View>

            <View style={[styles.problemGrid, isTablet && styles.problemGridWide]}>
              {[
                "Ситуативное обучение",
                "Нет единых стандартов",
                "Обратная связь субъективна",
                "Тренировки далеки от реальных разговоров",
                "Сложно оценить soft skills",
                "Обучение не связано с KPI",
              ].map((item) => (
                <View key={item} style={[styles.problemCard, isTablet && styles.problemCardWide]}>
                  <Text style={styles.problemIcon}>›</Text>
                  <Text style={styles.problemText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={[styles.container, styles.whitePanel, isDesktop && styles.whitePanelDesktop]}>
          <SectionLabel label="ИИ-тренажёр" />

          <Text style={[styles.sectionTitle, isDesktop && styles.centerText]}>
            Продавец тренируется не на клиентах
          </Text>

          <Text style={[styles.sectionText, isDesktop && styles.centerDescription]}>
            Тренажёр имитирует диалог с клиентом, оценивает soft skills и знание продукта, а затем
            формирует индивидуальный и командный отчёт.
          </Text>

          <View style={[styles.featureGrid, isTablet && styles.featureGridWide]}>
            <FeatureCard
              title="База знаний"
              text="Регламенты, продукты, скрипты и возражения собираются в управляемый источник правды."
              isWide={isTablet}
            />

            <FeatureCard
              title="ИИ-чат"
              text="Сотрудник быстро получает ответы по продукту и стандартам, а не ищет их в археологических слоях файлов."
              isWide={isTablet}
            />

            <FeatureCard
              title="ИИ-тренажёр"
              text="Менеджер проходит реалистичные сценарии, получает обратную связь и видит зоны роста."
              isWide={isTablet}
            />
          </View>
        </View>

        <View
          style={[
            styles.container,
            styles.calculatorCard,
            isDesktop && styles.calculatorCardDesktop,
          ]}
        >
          <View style={[styles.calculatorIntro, isDesktop && styles.calculatorIntroDesktop]}>
            <SectionLabel label="Калькулятор" isDark />

            <Text style={[styles.darkTitle, isDesktop && styles.darkTitleDesktop]}>
              Сколько денег съедает слабое обучение?
            </Text>

            <Text style={[styles.darkText, isDesktop && styles.darkTextDesktop]}>
              Быстрый расчёт потенциального эффекта. Реальность обычно ещё неприятнее, потому что
              тут не учтены текучесть, время руководителей и репутационные потери.
            </Text>
          </View>

          <View style={[styles.calculatorGrid, isDesktop && styles.calculatorGridDesktop]}>
            <View style={styles.calculatorInputs}>
              <NumberField
                label="Количество продавцов"
                value={sellers}
                onChange={setSellers}
                suffix="чел."
              />

              <NumberField
                label="Выручка на продавца"
                value={revenuePerSeller}
                onChange={setRevenuePerSeller}
                suffix="₽"
              />

              <NumberField
                label="Инвестиции в обучение"
                value={investment}
                onChange={setInvestment}
                suffix="₽"
              />

              <NumberField
                label="Ожидаемый рост"
                value={growth}
                onChange={setGrowth}
                suffix="%"
              />
            </View>

            <View style={[styles.resultGrid, isTablet && styles.resultGridWide]}>
              <ResultCard label="Выручка до обучения / мес." value={formatRub(calc.monthlyRevenue)} />
              <ResultCard label="Доп. выручка / мес." value={formatRub(calc.monthlyGain)} />
              <ResultCard label="Доп. выручка за 6 мес." value={formatRub(calc.sixMonthGain)} />
              <ResultCard label="ROI за 6 мес." value={`${Math.round(calc.roi)}%`} />

              <View style={[styles.paybackCard, isTablet && styles.paybackCardWide]}>
                <Text style={styles.paybackLabel}>Срок окупаемости</Text>
                <Text style={styles.paybackValue}>{calc.paybackMonths.toFixed(1)} мес.</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.darkPanel}>
          <View style={[styles.container, styles.darkPanelHeader]}>
            <SectionLabel label="Направления" isDark />

            <Text style={[styles.darkTitle, isDesktop && styles.darkTitleDesktop]}>
              Выберите Академию под задачи отдела продаж
            </Text>
          </View>

          {isDesktop ? (
            <View style={[styles.container, styles.directionGridDesktop]}>
              {directions.map((item) => (
                <DirectionCard key={item.title} item={item} style={styles.directionCardDesktop} />
              ))}
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {directions.map((item) => (
                <DirectionCard key={item.title} item={item} style={styles.directionCardMobile} />
              ))}
            </ScrollView>
          )}
        </View>

        <View style={[styles.container, styles.whitePanel, isDesktop && styles.whitePanelDesktop]}>
          <SectionLabel label="Продуктовый движок" />

          <Text style={[styles.sectionTitle, isDesktop && styles.centerText]}>
            Один цикл: обучение, практика, оценка, рост
          </Text>

          <View
            style={[
              styles.engineGrid,
              isTablet && styles.engineGridWide,
              isDesktop && styles.engineGridDesktop,
            ]}
          >
            {engine.map(([title, text]) => (
              <FeatureCard
                key={title}
                title={title}
                text={text}
                compact={!isDesktop}
                isWide={isTablet}
              />
            ))}
          </View>
        </View>

        <View style={[styles.container, styles.sectionBlock]}>
          <SectionLabel label="Тарифы" />

          <Text style={[styles.sectionTitle, isDesktop && styles.centerText]}>
            Пакеты под масштаб отдела продаж
          </Text>

          <Text style={[styles.sectionText, isDesktop && styles.centerDescription]}>
            Минимальный срок — 3 месяца. В каждом пакете включено 10 учеников.
          </Text>

          <View style={[styles.planGrid, isDesktop && styles.planGridDesktop]}>
            {plans.map((plan) => (
              <PlanCard key={plan.name} plan={plan} isDesktop={isDesktop} />
            ))}
          </View>
        </View>

        <View style={[styles.container, styles.enterpriseCard, isDesktop && styles.enterpriseCardDesktop]}>
          <View style={styles.enterpriseCopy}>
            <Text style={styles.enterpriseTitle}>Enterprise-решение</Text>

            <Text style={styles.enterpriseText}>
              Развёртывание в контуре компании, хранение данных на серверах клиента, интеграции с
              внутренними LMS и индивидуальные технические доработки.
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.86}
            style={[styles.enterpriseButton, isDesktop && styles.enterpriseButtonDesktop]}
          >
            <Text style={styles.enterpriseButtonText}>Запросить КП</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.finalCtaWrap}>
          <View style={[styles.container, styles.finalCta, isDesktop && styles.finalCtaDesktop]}>
            <View style={styles.finalCopy}>
              <SectionLabel label="Запуск" isDark />

              <Text style={[styles.finalTitle, isDesktop && styles.finalTitleDesktop]}>
                Покажем, как Академия будет работать на вашей команде
              </Text>

              <Text style={[styles.finalText, isDesktop && styles.finalTextDesktop]}>
                Разберём роли продавцов, первые сценарии, структуру отчётов, интеграции и эффект для
                адаптации, конверсии и выручки.
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.86}
              style={[styles.primaryButtonWide, isDesktop && styles.finalButtonDesktop]}
            >
              <Text style={styles.primaryButtonText}>Записаться на демо</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionLabel({ label, isDark = false }: { label: string; isDark?: boolean }) {
  return <Text style={[styles.sectionLabel, isDark && styles.sectionLabelDark]}>{label}</Text>;
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function FeatureCard({
  title,
  text,
  compact = false,
  isWide = false,
}: {
  title: string;
  text: string;
  compact?: boolean;
  isWide?: boolean;
}) {
  return (
    <View style={[styles.featureCard, compact && styles.featureCardCompact, isWide && styles.featureCardWide]}>
      <View style={styles.featureIcon}>
        <Text style={styles.featureIconText}>✦</Text>
      </View>

      <View style={styles.featureBody}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureText}>{text}</Text>
      </View>
    </View>
  );
}

function DirectionCard({ item, style }: { item: Direction; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.directionCardBase, style]}>
      <Text style={styles.directionTitle}>{item.title}</Text>
      <Text style={styles.directionAudience}>{item.audience}</Text>
      <Text style={styles.directionResult}>{item.result}</Text>

      {item.points.map((point) => (
        <Text key={point} style={styles.directionPoint}>
          ✓ {point}
        </Text>
      ))}
    </View>
  );
}

function NumberField({ label, value, onChange, suffix }: NumberFieldProps) {
  return (
    <View style={styles.numberField}>
      <Text style={styles.numberLabel}>{label}</Text>

      <View style={styles.numberInputWrap}>
        <TextInput
          value={String(value)}
          onChangeText={(text) => onChange(onlyNumber(text))}
          keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
          style={styles.numberInput}
          placeholder="0"
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.numberSuffix}>{suffix}</Text>
      </View>
    </View>
  );
}

function ResultCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.resultCard}>
      <Text style={styles.resultLabel}>{label}</Text>
      <Text style={styles.resultValue}>{value}</Text>
    </View>
  );
}

function PlanCard({ plan, isDesktop }: { plan: Plan; isDesktop: boolean }) {
  return (
    <View style={[styles.planCard, isDesktop && styles.planCardDesktop, plan.highlighted && styles.planCardHighlighted]}>
      <View style={styles.planContent}>
        <View style={styles.planHeader}>
          <Text style={[styles.planName, plan.highlighted && styles.planNameHighlighted]}>
            {plan.name}
          </Text>

          {plan.highlighted && (
            <View style={styles.popularBadge}>
              <Text style={styles.popularBadgeText}>Популярный</Text>
            </View>
          )}
        </View>

        <Text style={[styles.planDescription, plan.highlighted && styles.planDescriptionHighlighted]}>
          {plan.description}
        </Text>

        <Text style={[styles.planPrice, plan.highlighted && styles.planPriceHighlighted]}>
          {plan.price}
        </Text>

        {plan.features.map((feature) => (
          <Text key={feature} style={[styles.planFeature, plan.highlighted && styles.planFeatureHighlighted]}>
            ✓ {feature}
          </Text>
        ))}
      </View>

      <TouchableOpacity
        activeOpacity={0.86}
        style={[styles.planButton, plan.highlighted && styles.planButtonHighlighted]}
      >
        <Text style={[styles.planButtonText, plan.highlighted && styles.planButtonTextHighlighted]}>
          Выбрать пакет
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const shadowCard =
  Platform.OS === "web"
    ? {
        shadowColor: "#0f172a",
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 18 },
        shadowRadius: 34,
      }
    : {
        shadowColor: "#0f172a",
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 10 },
        shadowRadius: 20,
        elevation: 3,
      };

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.dark,
  },
  page: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingBottom: 0,
  },
  container: {
    width: "100%",
    maxWidth: 1240,
    alignSelf: "center",
    paddingHorizontal: 20,
  },

  hero: {
    position: "relative",
    overflow: "hidden",
    backgroundColor: colors.dark,
    paddingTop: 20,
    paddingBottom: 32,
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
  },
  heroDesktop: {
    paddingBottom: 88,
  },
  heroContainer: {
    zIndex: 2,
  },
  blobOne: {
    position: "absolute",
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: "rgba(123, 231, 191, 0.28)",
    right: -110,
    top: 56,
  },
  blobTwo: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(103, 232, 249, 0.18)",
    left: -90,
    bottom: 80,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 30,
  },
  logoMark: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.green,
  },
  logoMarkText: {
    color: colors.dark,
    fontSize: 18,
    fontWeight: "800",
  },
  logoKicker: {
    color: "#BBF7D0",
    fontSize: 11,
    letterSpacing: 2.3,
    fontWeight: "700",
  },
  logoTitle: {
    color: colors.white,
    fontSize: 17,
    fontWeight: "700",
    marginTop: 2,
  },

  heroGrid: {
    gap: 28,
  },
  heroGridDesktop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 52,
    paddingTop: 42,
  },
  heroCopy: {
    flexShrink: 1,
  },
  heroCopyDesktop: {
    flex: 1.08,
    maxWidth: 700,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  badgeText: {
    color: "#DCFCE7",
    fontSize: 13,
    fontWeight: "600",
  },
  heroTitle: {
    marginTop: 22,
    color: colors.white,
    fontSize: 46,
    lineHeight: 50,
    fontWeight: "800",
    letterSpacing: -1.5,
  },
  heroTitleDesktop: {
    fontSize: 72,
    lineHeight: 76,
    letterSpacing: -2.4,
    maxWidth: 760,
  },
  heroText: {
    marginTop: 18,
    color: "#CBD5E1",
    fontSize: 17,
    lineHeight: 26,
  },
  heroTextDesktop: {
    maxWidth: 660,
    fontSize: 20,
    lineHeight: 31,
  },
  buttonRow: {
    marginTop: 26,
    gap: 12,
  },
  buttonRowWide: {
    flexDirection: "row",
    alignItems: "center",
  },
  ctaButtonWide: {
    width: 190,
  },
  primaryButton: {
    height: 54,
    borderRadius: 999,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
  },
  primaryButtonText: {
    color: colors.dark,
    fontSize: 16,
    fontWeight: "800",
  },
  secondaryButton: {
    height: 54,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "rgba(255,255,255,0.07)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
  },
  secondaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },

  dialogCard: {
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    padding: 16,
    ...shadowCard,
  },
  dialogCardDesktop: {
    flex: 0.92,
    maxWidth: 520,
    padding: 24,
    borderRadius: 34,
  },
  dialogHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  dialogKicker: {
    color: "#CBD5E1",
    fontSize: 12,
  },
  dialogTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "800",
    marginTop: 2,
  },
  liveBadge: {
    backgroundColor: "rgba(123,231,191,0.18)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  liveBadgeText: {
    color: "#BBF7D0",
    fontSize: 12,
    fontWeight: "800",
  },
  clientBubble: {
    alignSelf: "flex-start",
    maxWidth: "88%",
    borderRadius: 18,
    borderTopLeftRadius: 6,
    backgroundColor: colors.white,
    padding: 14,
    marginBottom: 12,
  },
  clientBubbleText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  managerBubble: {
    alignSelf: "flex-end",
    maxWidth: "88%",
    borderRadius: 18,
    borderTopRightRadius: 6,
    backgroundColor: colors.green,
    padding: 14,
    marginBottom: 16,
  },
  managerBubbleText: {
    color: colors.dark,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  metricsRow: {
    flexDirection: "row",
    gap: 8,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 18,
    paddingVertical: 13,
    alignItems: "center",
  },
  metricValue: {
    color: colors.white,
    fontSize: 21,
    fontWeight: "800",
  },
  metricLabel: {
    marginTop: 4,
    color: "#CBD5E1",
    fontSize: 11,
  },

  statsGrid: {
    paddingTop: 20,
    gap: 12,
  },
  statsGridWide: {
    flexDirection: "row",
    paddingTop: 28,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(226,232,240,0.75)",
    ...shadowCard,
  },
  statValue: {
    color: colors.text,
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -1,
  },
  statLabel: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },

  sectionBlock: {
    paddingTop: 58,
  },
  sectionLabel: {
    color: colors.greenDark,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  sectionLabelDark: {
    color: colors.green,
  },
  sectionTitle: {
    marginTop: 10,
    color: colors.text,
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "800",
    letterSpacing: -1.1,
  },
  sectionTitleDesktop: {
    fontSize: 52,
    lineHeight: 58,
    letterSpacing: -1.8,
  },
  sectionText: {
    marginTop: 14,
    color: colors.muted,
    fontSize: 16,
    lineHeight: 25,
  },
  sectionTextDesktop: {
    fontSize: 18,
    lineHeight: 29,
  },
  centerText: {
    textAlign: "center",
    maxWidth: 760,
    alignSelf: "center",
  },
  centerDescription: {
    textAlign: "center",
    maxWidth: 760,
    alignSelf: "center",
  },

  problemSection: {
    gap: 22,
  },
  problemSectionDesktop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 54,
  },
  problemIntro: {
    flex: 0.86,
  },
  problemGrid: {
    gap: 10,
  },
  problemGridWide: {
    flex: 1.1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  problemCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadowCard,
  },
  problemCardWide: {
    width: "48%",
    minHeight: 92,
  },
  problemIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    color: "#EF4444",
    backgroundColor: "#FEF2F2",
    textAlign: "center",
    lineHeight: 31,
    fontSize: 28,
    fontWeight: "600",
  },
  problemText: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },

  whitePanel: {
    marginTop: 58,
    paddingVertical: 26,
    backgroundColor: colors.white,
    borderRadius: 32,
  },
  whitePanelDesktop: {
    paddingVertical: 58,
    paddingHorizontal: 32,
  },
  featureGrid: {
    marginTop: 18,
    gap: 14,
  },
  featureGridWide: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  featureCard: {
    backgroundColor: colors.bg,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.line,
  },
  featureCardCompact: {
    flexDirection: "row",
    gap: 14,
  },
  featureCardWide: {
    flex: 1,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  featureIconText: {
    color: colors.dark,
    fontSize: 17,
    fontWeight: "900",
  },
  featureBody: {
    flex: 1,
  },
  featureTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
  },
  featureText: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 23,
    marginTop: 8,
  },

  calculatorCard: {
    marginTop: 58,
    backgroundColor: colors.dark,
    borderRadius: 32,
    padding: 20,
  },
  calculatorCardDesktop: {
    padding: 42,
  },
  calculatorIntro: {
    marginBottom: 8,
  },
  calculatorIntroDesktop: {
    maxWidth: 820,
  },
  darkTitle: {
    color: colors.white,
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "800",
    letterSpacing: -1,
    marginTop: 10,
  },
  darkTitleDesktop: {
    fontSize: 52,
    lineHeight: 58,
    letterSpacing: -1.8,
  },
  darkText: {
    color: "#CBD5E1",
    fontSize: 16,
    lineHeight: 25,
    marginTop: 14,
    marginBottom: 6,
  },
  darkTextDesktop: {
    fontSize: 18,
    lineHeight: 29,
  },
  calculatorGrid: {
    gap: 14,
  },
  calculatorGridDesktop: {
    flexDirection: "row",
    gap: 28,
    alignItems: "stretch",
  },
  calculatorInputs: {
    flex: 1,
  },
  numberField: {
    marginTop: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 22,
    padding: 14,
  },
  numberLabel: {
    color: "#CBD5E1",
    fontSize: 13,
    marginBottom: 9,
  },
  numberInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 18,
    paddingHorizontal: 14,
    height: 50,
  },
  numberInput: {
    flex: 1,
    color: colors.text,
    fontSize: 17,
    fontWeight: "700",
    padding: 0,
  },
  numberSuffix: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "700",
  },
  resultGrid: {
    gap: 10,
  },
  resultGridWide: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    alignContent: "flex-start",
  },
  resultCard: {
    flexGrow: 1,
    flexBasis: "45%",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 22,
    padding: 16,
    minHeight: 96,
  },
  resultLabel: {
    color: "#CBD5E1",
    fontSize: 13,
  },
  resultValue: {
    color: colors.white,
    fontSize: 23,
    fontWeight: "800",
    marginTop: 6,
  },
  paybackCard: {
    backgroundColor: colors.green,
    borderRadius: 24,
    padding: 20,
  },
  paybackCardWide: {
    flexBasis: "100%",
    flexGrow: 1,
  },
  paybackLabel: {
    color: colors.dark,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1.8,
    fontWeight: "900",
  },
  paybackValue: {
    color: colors.dark,
    fontSize: 36,
    fontWeight: "900",
    marginTop: 4,
  },

  darkPanel: {
    marginTop: 58,
    paddingVertical: 44,
    backgroundColor: colors.dark,
  },
  darkPanelHeader: {
    marginBottom: 18,
  },
  horizontalList: {
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 6,
    gap: 12,
  },
  directionGridDesktop: {
    flexDirection: "row",
    gap: 12,
  },
  directionCardBase: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderRadius: 28,
    padding: 20,
  },
  directionCardMobile: {
    width: 260,
    minHeight: 310,
  },
  directionCardDesktop: {
    flex: 1,
    minHeight: 330,
  },
  directionTitle: {
    color: colors.white,
    fontSize: 22,
    lineHeight: 27,
    fontWeight: "800",
  },
  directionAudience: {
    color: "#BBF7D0",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 14,
  },
  directionResult: {
    color: "#CBD5E1",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 12,
    marginBottom: 14,
  },
  directionPoint: {
    color: colors.white,
    fontSize: 14,
    lineHeight: 23,
  },

  engineGrid: {
    marginTop: 18,
    gap: 14,
  },
  engineGridWide: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  engineGridDesktop: {
    flexWrap: "nowrap",
  },

  planGrid: {
    gap: 14,
    marginTop: 22,
  },
  planGridDesktop: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  planCard: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 28,
    padding: 22,
    minHeight: 384,
    justifyContent: "space-between",
    ...shadowCard,
  },
  planCardDesktop: {
    flex: 1,
  },
  planCardHighlighted: {
    backgroundColor: colors.dark,
    borderColor: colors.green,
  },
  planContent: {
    flexShrink: 1,
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  planName: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "900",
  },
  planNameHighlighted: {
    color: colors.white,
  },
  popularBadge: {
    backgroundColor: colors.green,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  popularBadgeText: {
    color: colors.dark,
    fontSize: 11,
    fontWeight: "900",
  },
  planDescription: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 23,
    marginTop: 14,
  },
  planDescriptionHighlighted: {
    color: "#CBD5E1",
  },
  planPrice: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "900",
    marginTop: 20,
    marginBottom: 14,
  },
  planPriceHighlighted: {
    color: colors.white,
  },
  planFeature: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 24,
    marginTop: 6,
  },
  planFeatureHighlighted: {
    color: colors.white,
  },
  planButton: {
    height: 52,
    borderRadius: 999,
    backgroundColor: colors.dark,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
  },
  planButtonHighlighted: {
    backgroundColor: colors.green,
  },
  planButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "800",
  },
  planButtonTextHighlighted: {
    color: colors.dark,
  },

  enterpriseCard: {
    marginTop: 18,
    backgroundColor: colors.green,
    borderRadius: 28,
    padding: 22,
  },
  enterpriseCardDesktop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 30,
    padding: 34,
  },
  enterpriseCopy: {
    flex: 1,
  },
  enterpriseTitle: {
    color: colors.dark,
    fontSize: 25,
    fontWeight: "900",
  },
  enterpriseText: {
    color: "#164E3A",
    fontSize: 15,
    lineHeight: 23,
    marginTop: 10,
  },
  enterpriseButton: {
    marginTop: 18,
    height: 52,
    borderRadius: 999,
    backgroundColor: colors.dark,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 26,
  },
  enterpriseButtonDesktop: {
    marginTop: 0,
    minWidth: 190,
  },
  enterpriseButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "800",
  },

  finalCtaWrap: {
    marginTop: 58,
    backgroundColor: colors.dark,
    paddingVertical: 40,
  },
  finalCta: {
    backgroundColor: colors.dark,
    borderRadius: 32,
  },
  finalCtaDesktop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 40,
    paddingVertical: 40,
  },
  finalCopy: {
    flex: 1,
  },
  finalTitle: {
    color: colors.white,
    fontSize: 36,
    lineHeight: 40,
    fontWeight: "900",
    letterSpacing: -1.2,
    marginTop: 10,
  },
  finalTitleDesktop: {
    fontSize: 58,
    lineHeight: 62,
    maxWidth: 780,
  },
  finalText: {
    color: "#CBD5E1",
    fontSize: 16,
    lineHeight: 25,
    marginTop: 14,
  },
  finalTextDesktop: {
    maxWidth: 680,
    fontSize: 18,
    lineHeight: 29,
  },
  primaryButtonWide: {
    height: 54,
    borderRadius: 999,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    paddingHorizontal: 26,
  },
  finalButtonDesktop: {
    marginTop: 0,
    minWidth: 210,
  },
});