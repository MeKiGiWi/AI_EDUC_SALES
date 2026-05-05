import type { SalesAcademyMock } from "../types/academy";

export const salesAcademyMock: SalesAcademyMock = {
  user: {
    id: "user-anna-morozova",
    fullName: "Анна Морозова",
    role: "student",
    title: "Менеджер по продажам",
    accessLevel: "self",
    teamName: "SMB pipeline",
    avatarLabel: "АМ",
    focusAreas: ["Работа с возражениями", "Аргументация ценности"],
    completionRate: 74,
    lastActiveAt: "Сегодня, 09:20"
  },
  progress: 74,
  lastReport: {
    badge: "Сегодня, 09:20",
    title: "Возражение на цену",
    meta: "Модуль: Возражение на цену · Сценарий: Клиент считает цену высокой",
    averageScore: 68,
    strengths: [
      "Хорошо выявляете потребности клиента",
      "Приводите понятные аргументы ценности",
      "Сохраняете спокойствие и тон в диалоге"
    ],
    growthPoints: [
      "Слабо уточняете бюджет клиента",
      "Не всегда предлагаете альтернативы",
      "Мало подтверждений понимания"
    ]
  },
  recommendations: [
    {
      id: "budget",
      title: "Уточняйте бюджет раньше",
      description: "Добавьте вопрос о бюджете на этапе выявления потребности.",
      icon: "◎",
      tone: "mint"
    },
    {
      id: "alternatives",
      title: "Предлагайте альтернативы",
      description: "Чаще предлагайте 2–3 варианта решения под разные бюджеты.",
      icon: "◌",
      tone: "violet"
    },
    {
      id: "confirm",
      title: "Подтверждайте понимание",
      description: "Используйте фразы подтверждения после каждого ключевого аргумента.",
      icon: "◠",
      tone: "warning"
    }
  ],
  reportHistory: [
    {
      id: "report-1",
      date: "Сегодня, 09:20",
      module: "Возражение на цену",
      scenario: "Клиент считает цену высокой",
      level: "middle"
    },
    {
      id: "report-2",
      date: "Вчера, 16:45",
      module: "Сравнение с конкурентом",
      scenario: "Клиент сравнивает с конкурентом",
      level: "middle"
    },
    {
      id: "report-3",
      date: "03.05.2025, 20:56",
      module: "Холодный звонок",
      scenario: "Первый контакт по телефону",
      level: "senior"
    },
    {
      id: "report-4",
      date: "02.05.2025, 15:30",
      module: "Апсейл текущему клиенту",
      scenario: "Предложение расширения",
      level: "junior"
    },
    {
      id: "report-5",
      date: "01.05.2025, 11:10",
      module: "Переговоры о сроках",
      scenario: "Клиент просит сдвинуть сроки",
      level: "junior"
    }
  ],
  scenarios: [
    {
      id: "price-objection",
      title: "Возражение на цену",
      description:
        "Клиент считает цену высокой и сомневается в решении. Научитесь грамотно обосновывать стоимость и работать с возражением.",
      duration: "8–10 мин",
      level: "Средний",
      progressLabel: "68%",
      progressValue: 68,
      status: "inProgress",
      segment: "B2B",
      icon: "🏷",
      accent: "mint"
    },
    {
      id: "competitor-comparison",
      title: "Сравнение с конкурентом",
      description: "Клиент сравнивает ваше решение с предложением конкурента.",
      duration: "7–9 мин",
      level: "Средний",
      progressLabel: "42%",
      progressValue: 42,
      status: "inProgress",
      segment: "B2B",
      icon: "👥",
      accent: "info"
    },
    {
      id: "timeline-negotiation",
      title: "Переговоры о сроках",
      description: "Клиент просит сдвинуть сроки или ускорить внедрение.",
      duration: "6–8 мин",
      level: "Средний",
      progressLabel: "25%",
      progressValue: 25,
      status: "inProgress",
      segment: "B2B",
      icon: "▦",
      accent: "violet"
    },
    {
      id: "cold-call",
      title: "Холодный звонок",
      description: "Первый контакт с потенциальным клиентом по телефону.",
      duration: "5–7 мин",
      level: "Легкий",
      progressLabel: "Новое",
      status: "new",
      segment: "B2B",
      icon: "⌁",
      accent: "warning"
    },
    {
      id: "upsell",
      title: "Апсейл текущему клиенту",
      description: "Предложите дополнительное решение или расширение.",
      duration: "6–9 мин",
      level: "Средний",
      progressLabel: "18%",
      progressValue: 18,
      status: "inProgress",
      segment: "B2B",
      icon: "↗",
      accent: "violet"
    },
    {
      id: "customer-return",
      title: "Возврат клиента",
      description: "Клиент ушел и может вернуться. Верните интерес к продукту.",
      duration: "7–10 мин",
      level: "Сложный",
      progressLabel: "Новое",
      status: "new",
      segment: "B2B",
      icon: "↩",
      accent: "peach"
    }
  ],
  activeDialogue: {
    selectedScenarioId: "price-objection",
    managerReplyCount: 6,
    replyTarget: 10,
    status: "Диалог активен",
    time: "15:24",
    persona: {
      name: "Руководитель производства",
      role: "Руководитель производства",
      company: "МетПром Системы",
      department: "Производство металлоконструкций"
    },
    context:
      "Входящий запрос на кондиционирование производственного цеха. Клиент сравнивает несколько поставщиков; важны сроки монтажа, простои и стабильность решения.",
    goal: "Договориться с покупателем о конкретном следующем шаге.",
    objection: "Цена кажется высокой по сравнению с конкурентами",
    messages: [
      {
        id: "dialog-1",
        author: "customer",
        text: "Мы сейчас рассматриваем ваше решение, но цена кажется немного высокой по сравнению с конкурентами.",
        time: "15:22"
      },
      {
        id: "dialog-2",
        author: "manager",
        text: "Понимаю ваше опасение. Давайте посмотрим не только на цену, но и на общую ценность решения. Какие факторы для вас наиболее критичны при выборе поставщика?",
        time: "15:22"
      },
      {
        id: "dialog-3",
        author: "customer",
        text: "Нам важно уложиться в бюджет этого квартала. У конкурентов похожее решение на 20% дешевле.",
        time: "15:23"
      },
      {
        id: "dialog-4",
        author: "manager",
        text: "Если смотреть на 3 года владения решением, наши клиенты в среднем экономят до 18% за счёт меньшего простоя оборудования и снижения брака. Могу показать расчёт по вашим данным, если интересно.",
        time: "15:24"
      },
      {
        id: "dialog-5",
        author: "customer",
        text: "Хм, интересно. А за счёт чего достигается такая экономия?",
        time: "15:24"
      }
    ],
    typingLabel: "Руководитель производства печатает...",
    quickActions: [
      "Показать расчёт TCO",
      "Объяснить преимущества",
      "Спросить о бюджете"
    ]
  },
  competencies: [
    { id: "needs", label: "Выявление потребностей", value: 72 },
    { id: "value", label: "Аргументация ценности", value: 66 },
    { id: "objection", label: "Работа с возражениями", value: 61 },
    { id: "agreement", label: "Достижение договорённостей", value: 58 }
  ]
};
