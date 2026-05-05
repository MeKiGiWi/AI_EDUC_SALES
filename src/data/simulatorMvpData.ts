import type { Scenario, SimulatorPublicScenarioDto } from "../types/academy";

export const API_SIMULATOR_MODULE_ID = "mod-simulator-api";
export const DEFAULT_BACKEND_DIFFICULTY = "medium";
// UI hint until backend exposes the target dynamically via a settings/scenarios contract.
export const MANAGER_REPLY_TARGET = 10;
export const TRAINING_FORMAT_LABEL = "Симуляция текстового диалога с B2B-клиентом";
export const DEFAULT_SCENARIO_GOAL =
  "Договориться с покупателем о конкретном следующем шаге.";
export const DEFAULT_SCENARIO_CONTEXT = [
  "Входящий запрос на кондиционирование производственного цеха",
  "Клиент сравнивает нескольких поставщиков",
  "Важны сроки монтажа, простои и стабильность решения"
];

export const baselineDisplayScenario: Scenario = {
  id: "baseline",
  moduleId: API_SIMULATOR_MODULE_ID,
  title: "B2B-диалог с клиентом",
  goal: DEFAULT_SCENARIO_GOAL,
  difficulty: "Средний",
  status: "ready",
  channel: "Чат",
  targetCompetencies: [
    "Умение задавать вопросы",
    "Диагностика потребности",
    "Формулировка ценности через выгоду",
    "Работа с возражением «подумаю / не сейчас»",
    "Фиксация следующего шага"
  ],
  persona: {
    id: "persona-production-manager",
    name: "ИИ-покупатель",
    company: "Производственное предприятие",
    roleTitle: "Руководитель производства",
    mood: "Деловой, рациональный, умеренно требовательный",
    painPoints: DEFAULT_SCENARIO_CONTEXT,
    objectionStyle: "Проверяет сроки, простои, бюджет и риски внедрения"
  },
  openingMessage:
    "Добрый день. Подбираем кондиционирование для производственного цеха. Нужно понять, сможете ли вы предложить решение без остановки линии и с нормальными сроками монтажа.",
  suggestedActions: [
    "Уточнить контекст производства",
    "Сформулировать ценность через риски простоя",
    "Зафиксировать следующий шаг"
  ],
  quickReplies: [
    "Расскажите, пожалуйста, какой цех и какие ограничения по остановке линии?",
    "Что будет самым критичным при выборе поставщика: сроки, бюджет или риски монтажа?",
    "Давайте согласуем короткий аудит условий, чтобы предложить точное решение."
  ],
  customerReplies: [],
  transcript: []
};

export const fallbackSimulatorScenarios: Scenario[] = [
  {
    ...baselineDisplayScenario,
    id: "price-objection",
    title: "Возражение на цену",
    goal: "Сохранить интерес клиента и перевести разговор из цены в измеримый эффект.",
    difficulty: "Средний",
    persona: {
      ...baselineDisplayScenario.persona,
      id: "persona-budget",
      roleTitle: "Коммерческий директор",
      painPoints: [
        "Сравнивает решение с более дешевыми поставщиками",
        "Боится переплатить без понятного эффекта",
        "Хочет короткий и проверяемый пилот"
      ],
      objectionStyle: "Сразу сравнивает цену и требует конкретику по окупаемости"
    },
    openingMessage:
      "Цена выглядит выше рынка. Почему нам не выбрать более дешевый вариант?",
    suggestedActions: [
      "Не спорить с ценой",
      "Уточнить, с чем клиент сравнивает решение",
      "Предложить критерии короткого пилота"
    ],
    quickReplies: [
      "С чем именно вы сейчас сравниваете стоимость?",
      "Где для вас риск дороже: в цене решения или в простоях после монтажа?",
      "Если покажем эффект на коротком пилоте, это будет достаточным основанием?"
    ]
  },
  {
    ...baselineDisplayScenario,
    id: "competitor-comparison",
    title: "Сравнение с конкурентом",
    goal: "Понять, по каким критериям клиент сравнивает поставщиков, и показать разницу через практическую ценность.",
    difficulty: "Базовый",
    persona: {
      ...baselineDisplayScenario.persona,
      id: "persona-competitor-comparison",
      roleTitle: "Коммерческий директор",
      painPoints: [
        "Сравнивает нескольких поставщиков по цене и срокам",
        "Не хочет переплатить за необязательные опции",
        "Ищет понятные критерии сравнения предложений"
      ],
      objectionStyle: "Сравнивает предложения и просит объяснить практическую разницу"
    },
    openingMessage:
      "Мы уже сравниваем вас с другим поставщиком. У них предложение выглядит проще и дешевле. В чем практическая разница для нас?",
    suggestedActions: [
      "Уточнить критерии сравнения",
      "Показать разницу через риски и эффект",
      "Согласовать следующий шаг для проверки гипотез"
    ],
    quickReplies: [
      "Какие критерии сейчас для вас самые важные при сравнении вариантов?",
      "Если сравнить не только цену, а риск простоя и срок внедрения, что для вас критичнее?",
      "Давайте соберем короткое сравнение по вашим реальным требованиям и быстро проверим его вместе."
    ]
  },
  {
    ...baselineDisplayScenario,
    id: "timeline-negotiation",
    title: "Переговоры о сроках",
    goal: "Подтвердить реалистичный срок внедрения и показать, как снизить риск простоя.",
    difficulty: "Средний",
    persona: {
      ...baselineDisplayScenario.persona,
      id: "persona-timeline-negotiation",
      roleTitle: "Операционный директор",
      painPoints: [
        "Нужно успеть до запуска новой линии",
        "Остановка производства крайне нежелательна",
        "Любая задержка влияет на план и выручку"
      ],
      objectionStyle: "Фокусируется на сроках, рисках срыва и практической реализуемости проекта"
    },
    openingMessage:
      "Если проект затянется, мы рискуем сорвать запуск линии. Насколько реально уложиться в короткие сроки без лишнего простоя?",
    suggestedActions: [
      "Уточнить временные ограничения",
      "Показать, как минимизируется простой",
      "Предложить реалистичный следующий шаг"
    ],
    quickReplies: [
      "Какая дата запуска для вас сейчас критична?",
      "Где для вас самый болезненный риск: монтаж, согласование или остановка линии?",
      "Давайте быстро проверим условия, чтобы подтвердить реалистичный график."
    ]
  }
];

export function formatScenarioTitle(title: string): string {
  return title.trim().toLowerCase() === "baseline"
    ? baselineDisplayScenario.title
    : title;
}

export function mapApiScenarioToScenario(
  item: SimulatorPublicScenarioDto,
  moduleId: string = API_SIMULATOR_MODULE_ID
): Scenario {
  return {
    id: item.id,
    moduleId,
    title: formatScenarioTitle(item.title),
    goal: DEFAULT_SCENARIO_GOAL,
    difficulty: "medium",
    status: item.status,
    channel: "chat",
    targetCompetencies: baselineDisplayScenario.targetCompetencies,
    persona: {
      id: `persona-${item.id}`,
      name: "ИИ-покупатель",
      company: "Производственное предприятие",
      roleTitle: "Руководитель производства",
      mood: "Деловой, рациональный, умеренно требовательный",
      painPoints: DEFAULT_SCENARIO_CONTEXT,
      objectionStyle: "Проверяет сроки, простои, бюджет и риски внедрения"
    },
    openingMessage: item.openingMessage,
    suggestedActions: baselineDisplayScenario.suggestedActions,
    quickReplies: baselineDisplayScenario.quickReplies,
    customerReplies: [],
    transcript: []
  };
}

export function buildTrainingContextRows(
  scenario?: Scenario
): Array<{ label: string; value: string }> {
  if (!scenario) {
    return [
      {
        label: "Сценарий",
        value: "Не выбран"
      },
      {
        label: "Формат",
        value: TRAINING_FORMAT_LABEL
      }
    ];
  }

  const persona = scenario.persona;
  const buyer = persona.roleTitle || "Руководитель производства";
  const context =
    persona.painPoints.length > 0
      ? persona.painPoints.join("; ")
      : DEFAULT_SCENARIO_CONTEXT.join("; ");
  const objections =
    persona.objectionStyle || "Проверяет сроки, простои, бюджет и риски внедрения";
  const rows = [
    { label: "Сценарий", value: scenario.title },
    { label: "Покупатель", value: buyer },
    { label: "Контекст", value: context },
    { label: "Возражение", value: objections },
    { label: "Цель", value: scenario.goal || DEFAULT_SCENARIO_GOAL }
  ];

  return rows.filter((row) => row.value.trim().length > 0);
}
