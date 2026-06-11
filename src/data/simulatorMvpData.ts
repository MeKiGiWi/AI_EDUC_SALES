import type { Scenario, SimulatorPublicScenarioDto } from "../types/academy";

export const API_SIMULATOR_MODULE_ID = "mod-simulator-api";
export const DEFAULT_BACKEND_DIFFICULTY = "medium";
export const MANAGER_REPLY_TARGET = 10;
export const TRAINING_FORMAT_LABEL = "Симуляция текстового диалога с пациентом";
export const DEFAULT_SCENARIO_GOAL = "Довести разговор до понятного и безопасного следующего шага.";

const clinicCompetencies = [
  "Умение установить спокойный контакт",
  "Умение задавать уточняющие вопросы по симптомам без постановки диагноза",
  "Первичная маршрутизация пациента к подходящему врачу",
  "Работа с тревогой и сомнениями пациента",
  "Фиксация следующего шага"
];

export const baselineDisplayScenario: Scenario = {
  id: "clinic-appointment",
  moduleId: API_SIMULATOR_MODULE_ID,
  title: "Первичная запись: тревожный пациент с симптомами",
  goal: DEFAULT_SCENARIO_GOAL,
  difficulty: "Средний",
  status: "ready",
  channel: "Чат",
  targetCompetencies: clinicCompetencies,
  persona: {
    id: "persona-clinic-appointment",
    name: "Анна",
    company: "Частная клиника",
    roleTitle: "Пациент, 34 года",
    mood: "Тревожная, сомневающаяся, но конструктивная",
    painPoints: [
      "Есть симптомы, но непонятно, к какому врачу идти",
      "Не хочется тратить деньги на лишние визиты",
      "Важно понять срочность и безопасный следующий шаг"
    ],
    objectionStyle: "Сомневается, тревожится и просит понятную логику маршрута"
  },
  openingMessage:
    "Здравствуйте. Я впервые к вам обращаюсь. У меня уже несколько дней какое-то странное состояние: периодически кружится голова, бывает слабость, иногда как будто сердце бьётся сильнее обычного. Я не понимаю, к кому мне вообще надо записаться.",
  suggestedActions: [
    "Снять начальное напряжение",
    "Уточнить симптомы без постановки диагноза",
    "Предложить логичную запись и зафиксировать шаг"
  ],
  quickReplies: [
    "Давайте я задам несколько вопросов, чтобы помочь сориентироваться по записи.",
    "Подскажите, пожалуйста, как давно это началось и как часто повторяется?",
    "По тому, что вы описываете, могу предложить понятный первый шаг и удобное окно записи."
  ],
  customerReplies: [],
  transcript: []
};

export const fallbackSimulatorScenarios: Scenario[] = [
  baselineDisplayScenario,
  {
    ...baselineDisplayScenario,
    id: "clinic-complaint",
    title: "Жалоба на сервис клиники и длительное ожидание",
    persona: {
      id: "persona-clinic-complaint",
      name: "Елена",
      company: "Частная клиника",
      roleTitle: "Пациент, 41 год",
      mood: "Раздраженная, но конструктивная",
      painPoints: [
        "Долгое ожидание приёма при записи на точное время",
        "Никто не объяснял реальные сроки ожидания",
        "Важно понять, что жалоба не потеряется"
      ],
      objectionStyle: "Требует конкретики, ясности и уважительного отношения"
    },
    openingMessage:
      "Здравствуйте. Хотела бы оставить жалобу по поводу вчерашнего визита. Я была записана на конкретное время, приехала заранее, а в итоге очень долго ждала, и при этом мне никто толком не мог сказать, сколько ещё ждать. Для частной клиники это, честно говоря, очень странный сервис.",
    targetCompetencies: [
      "Контакт в жалобной коммуникации",
      "Сбор фактов по жалобе",
      "Эмпатия без обороны",
      "Предложение решения по обращению",
      "Фиксация следующего шага"
    ],
    suggestedActions: [
      "Принять жалобу без оправданий",
      "Собрать факты и ожидания пациента",
      "Зафиксировать понятный следующий шаг"
    ],
    quickReplies: [
      "Спасибо, что сказали об этом. Давайте уточню детали, чтобы корректно зафиксировать обращение.",
      "Подскажите, пожалуйста, на какое время вы были записаны и сколько в итоге ждали?",
      "Я отмечу ключевые детали жалобы и зафиксирую удобный способ обратной связи."
    ]
  }
];

export function mapApiScenarioToScenario(
  item: SimulatorPublicScenarioDto,
  moduleId: string = API_SIMULATOR_MODULE_ID
): Scenario {
  const personaName = item.id === "clinic-complaint" ? "Елена" : "Анна";
  const personaRole = item.id === "clinic-complaint" ? "Пациент, 41 год" : "Пациент, 34 года";

  return {
    id: item.id,
    moduleId,
    title: item.title,
    goal: DEFAULT_SCENARIO_GOAL,
    difficulty: item.level || "Средний",
    status: item.status,
    channel: "chat",
    targetCompetencies: item.targetCompetencies,
    persona: {
      id: `persona-${item.id}`,
      name: personaName,
      company: "Частная клиника",
      roleTitle: personaRole,
      mood: item.id === "clinic-complaint" ? "Раздраженная, но конструктивная" : "Тревожная и сомневающаяся",
      painPoints: item.introLines,
      objectionStyle:
        item.id === "clinic-complaint"
          ? "Хочет быть услышанной и получить понятный разбор жалобы"
          : "Хочет понять, к какому врачу идти и насколько это срочно"
    },
    openingMessage: item.openingMessage,
    suggestedActions: [],
    quickReplies: [],
    customerReplies: [],
    transcript: []
  };
}

export function buildTrainingContextRows(
  scenario?: Scenario
): Array<{ label: string; value: string }> {
  if (!scenario) {
    return [
      { label: "Сценарий", value: "Не выбран" },
      { label: "Формат", value: TRAINING_FORMAT_LABEL }
    ];
  }

  return [
    { label: "Сценарий", value: scenario.title },
    { label: "Собеседник", value: scenario.persona.roleTitle || "Пациент" },
    { label: "Контекст", value: scenario.persona.painPoints.join("; ") },
    { label: "Фокус", value: scenario.persona.objectionStyle },
    { label: "Цель", value: scenario.goal || DEFAULT_SCENARIO_GOAL }
  ].filter((row) => row.value.trim().length > 0);
}
