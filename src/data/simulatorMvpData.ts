import type { Scenario, SimulatorPublicScenarioDto } from "../types/academy";

export const API_SIMULATOR_MODULE_ID = "mod-simulator-api";
export const DEFAULT_BACKEND_DIFFICULTY = "medium";
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
  baselineDisplayScenario,
  {
    ...baselineDisplayScenario,
    id: "fallback-objection",
    title: "Работа с возражением по бюджету",
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
    id: "fallback-next-step",
    title: "Фиксация следующего шага",
    goal: "Перевести заинтересованность клиента в конкретное действие с датой и ответственным.",
    difficulty: "Базовый",
    persona: {
      ...baselineDisplayScenario.persona,
      id: "persona-next-step",
      roleTitle: "Операционный директор",
      painPoints: [
        "Клиент заинтересован, но откладывает решение",
        "Нужно согласовать участников со стороны производства",
        "Важно не потерять темп после первичного интереса"
      ],
      objectionStyle: "Говорит, что нужно подумать и вернуться позже"
    },
    openingMessage:
      "В целом интересно. Давайте я подумаю и вернусь к вам позже.",
    suggestedActions: [
      "Мягко уточнить причину паузы",
      "Снять неопределенность",
      "Предложить короткий следующий шаг"
    ],
    quickReplies: [
      "Чтобы я корректно подготовился, что именно нужно обдумать?",
      "Давайте зафиксируем 20 минут с техническим специалистом и проверим условия.",
      "Кого важно подключить к следующему разговору, чтобы не возвращаться к вводным?"
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
