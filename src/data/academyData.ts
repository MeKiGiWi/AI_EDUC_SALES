import type {
  AcademyUser,
  AccessRoleRule,
  ActionItem,
  AdminSettings,
  BestAnswerExample,
  Competency,
  CompetencyEvaluation,
  DashboardMetric,
  DevelopmentTrack,
  DialogueTranscript,
  FeedbackItem,
  GroupProgress,
  HrDashboard,
  KnowledgeImportStatus,
  KnowledgeSection,
  LearningModule,
  ManagerDashboard,
  ReportCard,
  RoleWorkspaceOption,
  ScenarioAdminItem,
  Scenario,
  ScheduledReportRule,
  ScoreTrendPoint,
  SkillScore,
  SimulatorEvaluation,
  StudentLevelSummary,
  StudentDashboard,
  TeamMember,
  TeamRecommendation,
  TeamSkillTrend,
  UserAccessSetting,
  UserRole
} from "../types/academy";

export const availableRoles: UserRole[] = ["student", "manager", "hr", "admin"];

export const roleWorkspaceOptions: RoleWorkspaceOption[] = [
  {
    role: "student",
    title: "Ученик",
    accessLabel: "Только свой профиль",
    summary: "Практика, учебные материалы, личный прогресс, оценка, точки роста и персональный план.",
    capabilities: [
      "Личный прогресс и ближайшая практика",
      "Учебные материалы и тренажер",
      "Оценка, точки роста и план развития",
      "Личный отчет в PDF"
    ]
  },
  {
    role: "manager",
    title: "Руководитель / линейный",
    accessLabel: "Команда",
    summary: "Командная панель, навыки, риски сотрудников, проблемные диалоги и назначение тренировок.",
    capabilities: [
      "Панель руководителя и прогресс команды",
      "Динамика навыков и сотрудники в риске",
      "Проблемные диалоги и лучшие ответы",
      "Командные отчеты PDF и CSV"
    ]
  },
  {
    role: "hr",
    title: "HR / L&D",
    accessLabel: "Группы и департамент",
    summary: "Прогресс групп, компетенции, треки развития, рекомендации и регулярные выгрузки.",
    capabilities: [
      "Прогресс групп и adoption обучения",
      "Отчеты по компетенциям и командные отчеты",
      "Треки развития и рекомендации",
      "Регулярные выгрузки XLSX, CSV и PDF"
    ]
  },
  {
    role: "admin",
    title: "Администратор",
    accessLabel: "Организация",
    summary: "Пользователи, роли, история обучения, материалы, сценарии и правила отправки отчетов.",
    capabilities: [
      "Профили пользователей и уровни доступа",
      "История обучения и настройки доступа",
      "Учебные материалы, импорты и сценарии",
      "Правила отправки отчетов по уровням доступа"
    ]
  }
];

export const usersByRole: Record<UserRole, AcademyUser> = {
  student: {
    id: "user-student-1",
    fullName: "Анна Морозова",
    role: "student",
    title: "Менеджер по продажам",
    accessLevel: "self",
    teamName: "",
    avatarLabel: "АМ",
    focusAreas: ["Работа с возражениями", "Финализация договоренностей"],
    completionRate: 74,
    lastActiveAt: "Сегодня, 09:20"
  },
  manager: {
    id: "user-manager-1",
    fullName: "Илья Громов",
    role: "manager",
    title: "Руководитель группы продаж",
    accessLevel: "team",
    teamName: "Команда Север-1",
    avatarLabel: "ИГ",
    focusAreas: ["Разбор звонков", "Единый стандарт открытия встречи"],
    completionRate: 81,
    lastActiveAt: "Сегодня, 10:05"
  },
  hr: {
    id: "user-hr-1",
    fullName: "Мария Тарасова",
    role: "hr",
    title: "HR / L&D partner",
    accessLevel: "department",
    teamName: "Learning & Enablement",
    avatarLabel: "МТ",
    focusAreas: ["Адаптация новых менеджеров", "Роль компетенций по грейдам"],
    completionRate: 88,
    lastActiveAt: "Сегодня, 08:45"
  },
  admin: {
    id: "user-admin-1",
    fullName: "Дмитрий Серов",
    role: "admin",
    title: "Администратор платформы",
    accessLevel: "organization",
    teamName: "Platform Ops",
    avatarLabel: "ДС",
    focusAreas: ["Роли доступа", "Регламенты выгрузки"],
    completionRate: 92,
    lastActiveAt: "Сегодня, 07:50"
  }
};

export const knowledgeSections: KnowledgeSection[] = [
  {
    id: "kb-1",
    categoryId: "product",
    title: "Продукт и ценность",
    description: "Материалы по позиционированию, value case и аргументации цены.",
    materials: [
      {
        id: "mat-1",
        categoryId: "product",
        title: "Как объяснять ценность Академии продаж за 90 секунд",
        description: "Короткий сценарий для первой презентации руководителю отдела продаж.",
        durationMinutes: 8,
        formatLabel: "Карточка",
        levelLabel: "База",
        tags: ["ценность", "презентация", "короткий питч"],
        updatedAt: "Обновлено вчера",
        shortExplanation: "Материал помогает быстро показать, что Академия влияет не на абстрактное обучение, а на качество реальных продаж.",
        aiPlainExplanation: "Если проще: не продавай курс. Покажи, как команда начнет быстрее говорить с клиентами увереннее и ровнее по стандарту.",
        applyInDialogue: "После первого интереса клиента свяжи продукт с сокращением адаптации и ростом управляемости разговоров.",
        clientAnswerExample: "Мы не просто учим теории. Мы даем команде практику, по которой видно, как меняется качество ответа и фиксация следующего шага."
      },
      {
        id: "mat-2",
        categoryId: "product",
        title: "Разговор про ROI обучения",
        description: "Как связывать обучение, скорость адаптации и качество конверсии.",
        durationMinutes: 14,
        formatLabel: "Гайд",
        levelLabel: "Средний",
        tags: ["ROI", "обучение", "финансы"],
        updatedAt: "Обновлено 3 дня назад",
        shortExplanation: "Материал объясняет, как перевести разговор о цене в разговор о потерях и измеримом эффекте.",
        aiPlainExplanation: "Не доказывай, что дорого или дешево. Покажи, сколько бизнес теряет без стабильного навыка команды.",
        applyInDialogue: "Сначала уточни, где проседают новые менеджеры, а затем свяжи это с конверсией и временем выхода на KPI.",
        clientAnswerExample: "Если команда дольше выходит на план и теряет качество звонка в первые недели, это уже прямые потери. Мы работаем именно с этим разрывом."
      }
    ]
  },
  {
    id: "kb-2",
    categoryId: "sales_skills",
    title: "Навыки продаж",
    description: "Приемы открытия, диагностики потребности и удержания структуры диалога.",
    materials: [
      {
        id: "mat-3",
        categoryId: "sales_skills",
        title: "Открытие звонка без потери контроля",
        description: "Практика первого вопроса и мягкого удержания повестки.",
        durationMinutes: 11,
        formatLabel: "Микроурок",
        levelLabel: "База",
        tags: ["открытие", "структура", "темп"],
        updatedAt: "Сегодня",
        shortExplanation: "Материал учит входить в разговор так, чтобы клиент не чувствовал давления, но ты сохранял рамку.",
        aiPlainExplanation: "Главная идея простая: сначала дай человеку понять, зачем разговор и как он пройдет, а потом переходи к вопросам.",
        applyInDialogue: "Открой разговор короткой рамкой и попроси разрешение уточнить 2-3 важных момента, прежде чем говорить о решении.",
        clientAnswerExample: "Чтобы не тратить ваше время, хочу за пару минут понять текущую ситуацию команды и потом предложить только релевантный следующий шаг."
      },
      {
        id: "mat-4",
        categoryId: "sales_skills",
        title: "Работа с скрытым возражением",
        description: "Как распознать сомнение клиента до прямого отказа.",
        durationMinutes: 16,
        formatLabel: "Кейс",
        levelLabel: "Продвинутый",
        tags: ["возражения", "диагностика", "контекст"],
        updatedAt: "Обновлено сегодня",
        shortExplanation: "Материал показывает, как замечать ранние признаки сомнения, пока клиент еще не сказал жесткое нет.",
        aiPlainExplanation: "Если клиент отвечает сухо, уходит в общие слова или сравнивает с прошлым опытом, сомнение уже появилось и его нужно назвать.",
        applyInDialogue: "Не дави аргументами сразу. Замедлись и уточни, что именно вызывает недоверие или осторожность.",
        clientAnswerExample: "Слышу, что у вас уже был похожий опыт и есть осторожность. Что именно тогда не сработало, чтобы сейчас не повторить тот же сценарий?"
      }
    ]
  },
  {
    id: "kb-3",
    categoryId: "assessment",
    title: "Оценка и обратная связь",
    description: "Как интерпретировать score, комментарии ИИ и план развития.",
    materials: [
      {
        id: "mat-5",
        categoryId: "assessment",
        title: "Что означает оценка по компетенциям",
        description: "Пояснение шкалы, бенчмарков и переходов между уровнями.",
        durationMinutes: 9,
        formatLabel: "Справка",
        levelLabel: "База",
        tags: ["оценка", "компетенции", "аналитика"],
        updatedAt: "Обновлено 2 дня назад",
        shortExplanation: "Материал помогает читать score не как абстрактную цифру, а как набор конкретных сигналов по навыкам.",
        aiPlainExplanation: "Оценка нужна не для контроля ради контроля, а чтобы быстро понять, какой навык сейчас мешает разговору сильнее всего.",
        applyInDialogue: "После тренировки сравни самый низкий блок оценки с реальной репликой, где разговор потерял темп или ясность.",
        clientAnswerExample: "По оценке видно не просто общий результат, а конкретный участок разговора, где вы либо раскрыли потребность, либо потеряли следующий шаг."
      }
    ]
  },
  {
    id: "kb-4",
    categoryId: "scenarios_cases",
    title: "Сценарии и кейсы",
    description: "Разбор ситуаций, objections и шаблонов перехода к следующему шагу.",
    materials: [
      {
        id: "mat-6",
        categoryId: "scenarios_cases",
        title: "Кейс: клиент сомневается в практической ценности",
        description: "Разбор ответа, когда клиент говорит, что обучение уже пробовали и эффекта не было.",
        durationMinutes: 13,
        formatLabel: "Кейс",
        levelLabel: "Средний",
        tags: ["кейс", "сомнение", "ценность"],
        updatedAt: "Сегодня",
        shortExplanation: "Кейс помогает не спорить с прошлым негативным опытом клиента, а встроить его в диагностику.",
        aiPlainExplanation: "Не нужно опровергать прошлый опыт клиента. Лучше показать, чем ваш подход отличается и как это проверяется на пилоте.",
        applyInDialogue: "Сначала спроси, что именно не сработало раньше, а затем свяжи ответ с пилотным форматом.",
        clientAnswerExample: "Если можно, уточню: в прошлом решении не сработал сам формат практики, качество обратной связи или перенос навыка в реальные звонки?"
      }
    ]
  },
  {
    id: "kb-5",
    categoryId: "learning",
    title: "Обучение",
    description: "Подсказки по работе с модулями, ритму практики и закреплению результата.",
    materials: [
      {
        id: "mat-7",
        categoryId: "learning",
        title: "Как проходить модули без перегруза",
        description: "Рекомендации по коротким сессиям и переносу навыка в рабочий день.",
        durationMinutes: 7,
        formatLabel: "Памятка",
        levelLabel: "База",
        tags: ["обучение", "ритм", "микропрактика"],
        updatedAt: "Вчера",
        shortExplanation: "Материал помогает встроить обучение в рабочий график без длинных блоков времени.",
        aiPlainExplanation: "Лучше 10 минут практики сегодня и завтра, чем один длинный блок раз в неделю.",
        applyInDialogue: "Используй материал перед тренировкой, чтобы выбрать один конкретный навык и не распыляться на весь разговор сразу.",
        clientAnswerExample: "Сейчас моя цель не пройти все сразу, а потренировать один навык, который сразу повлияет на качество следующего разговора."
      }
    ]
  },
  {
    id: "kb-6",
    categoryId: "feedback",
    title: "Обратная связь",
    description: "Как разбирать комментарии ИИ, выбирать одну точку роста и фиксировать следующий шаг.",
    materials: [
      {
        id: "mat-8",
        categoryId: "feedback",
        title: "Как превращать feedback в план действий",
        description: "Подход к разбору комментариев без перегруза и ощущения провала.",
        durationMinutes: 10,
        formatLabel: "Гайд",
        levelLabel: "База",
        tags: ["feedback", "план", "рефлексия"],
        updatedAt: "Сегодня",
        shortExplanation: "Материал показывает, как выбрать из обратной связи один следующий шаг, а не пытаться исправить все сразу.",
        aiPlainExplanation: "После разбора не нужно чинить весь диалог. Достаточно взять одну реплику и один навык, который сильнее всего влияет на результат.",
        applyInDialogue: "После тренировки сравни слабую реплику с сильным примером и выбери одну новую формулировку для следующей практики.",
        clientAnswerExample: "В следующей попытке я сначала уточню, что именно для клиента выглядит рискованным, и только потом перейду к аргументации."
      }
    ]
  }
];

export const competencies: Competency[] = [
  {
    id: "comp-1",
    name: "Диагностика потребности",
    description: "Умеет раскрывать контекст клиента и уточнять критерии решения.",
    targetLevel: "Уверенный"
  },
  {
    id: "comp-2",
    name: "Работа с возражениями",
    description: "Снимает риски клиента, не споря и не давя.",
    targetLevel: "Сильный"
  },
  {
    id: "comp-3",
    name: "Фиксация следующего шага",
    description: "Каждую встречу завершает понятным договоренным действием.",
    targetLevel: "Уверенный"
  }
];

export const scenarios: Scenario[] = [
  {
    id: "scn-1",
    moduleId: "mod-1",
    title: "Первый разговор с руководителем отдела продаж",
    goal: "Выявить текущие пробелы команды и договориться о пилоте.",
    difficulty: "Средний",
    status: "ready",
    channel: "Голос / звонок",
    targetCompetencies: ["Диагностика потребности", "Работа с возражениями"],
    persona: {
      id: "persona-1",
      name: "Екатерина Павлова",
      company: "Nova Retail",
      roleTitle: "Head of Sales",
      mood: "Сдержанно скептична",
      painPoints: ["Длинная адаптация новых менеджеров", "Неровное качество созвонов"],
      objectionStyle: "Проверяет цифры и просит конкретику"
    },
    openingMessage: "Коллеги уже предлагали обучение. Чем ваш формат поможет команде быстрее выйти в план?",
    suggestedActions: [
      "Начни с уточнения текущей модели адаптации",
      "Привяжи решение к скорости выхода на KPI",
      "Зафиксируй пилот и критерии успеха"
    ],
    quickReplies: [
      "Сначала уточню, как вы сейчас адаптируете новых менеджеров.",
      "Где чаще всего теряется качество разговора в первые недели?",
      "Каким для вас был бы хороший результат пилота?"
    ],
    customerReplies: [
      "Новые менеджеры долго раскачиваются, а у руководителей нет времени на системную практику.",
      "Главная проблема в том, что после обучения мы не видим стабильного переноса в реальные звонки.",
      "Если пилот покажет рост качества первых разговоров, мы готовы обсуждать масштабирование."
    ],
    transcript: [
      {
        id: "msg-1",
        speakerName: "Екатерина",
        speakerRole: "customer",
        text: "Коллеги уже предлагали обучение. Чем ваш формат поможет команде быстрее выйти в план?",
        timestampLabel: "00:05"
      },
      {
        id: "msg-2",
        speakerName: "ИИ-коуч",
        speakerRole: "coach",
        text: "Сделай шаг назад: сначала уточни, как сейчас выглядит адаптация и где именно теряется скорость.",
        timestampLabel: "00:08"
      }
    ]
  },
  {
    id: "scn-2",
    moduleId: "mod-2",
    title: "Возражение про стоимость программы",
    goal: "Сохранить интерес и перевести разговор в плоскость эффекта на конверсию.",
    difficulty: "Продвинутый",
    status: "active",
    channel: "Чат",
    targetCompetencies: ["Работа с возражениями", "Фиксация следующего шага"],
    persona: {
      id: "persona-2",
      name: "Сергей Белкин",
      company: "Finbridge",
      roleTitle: "Коммерческий директор",
      mood: "Рационален и торопится",
      painPoints: ["Слабая предсказуемость результатов обучения", "Ограниченный бюджет"],
      objectionStyle: "Сразу сравнивает с альтернативами"
    },
    openingMessage: "Цена выше, чем у обычного тренинга. Почему это окупится?",
    suggestedActions: [
      "Не спорь с ценой, переведи фокус на эффект",
      "Покажи, где теряются деньги сейчас",
      "Предложи узкий пилот с проверяемыми метриками"
    ],
    quickReplies: [
      "С чем вы сейчас сравниваете стоимость?",
      "Где вы сильнее всего теряете деньги без устойчивого навыка команды?",
      "Если пилот покажет эффект за 3 недели, это будет достаточно?"
    ],
    customerReplies: [
      "Мы сравниваем с классическим тренингом, который заметно дешевле на старте.",
      "Честно говоря, мы боимся, что менеджеры пройдут обучение, а качество звонков не изменится.",
      "Если покажете понятный критерий эффекта и не затянете внедрение, разговор можно продолжить."
    ],
    transcript: [
      {
        id: "msg-3",
        speakerName: "Сергей",
        speakerRole: "customer",
        text: "Цена выше, чем у обычного тренинга. Почему это окупится?",
        timestampLabel: "00:12"
      }
    ]
  }
];

export const studentLevelSummary: StudentLevelSummary = {
  currentLevel: "Уверенный практик",
  levelDescription: "Анна стабильно проходит учебные модули и уже держит структуру разговора, но еще проседает в моменты ценового возражения.",
  nextLevel: "Сильный переговорщик",
  progressToNextLevel: 68
};

export const simulatorEvaluationByScenarioId: Record<string, SimulatorEvaluation> = {
  "scn-1": {
    overallScore: 84,
    competencyScores: [
      {
        id: "need-discovery",
        label: "Выявление потребности",
        value: 87,
        summary: "Хорошо раскрываешь текущий процесс и задаешь вопросы про адаптацию."
      },
      {
        id: "argumentation",
        label: "Аргументация",
        value: 79,
        summary: "Аргументы сильные, но можно раньше связать их с KPI команды."
      },
      {
        id: "objection-handling",
        label: "Работа с возражениями",
        value: 76,
        summary: "Не споришь, но иногда слишком быстро уходишь в объяснение."
      },
      {
        id: "dialogue-structure",
        label: "Структура диалога",
        value: 86,
        summary: "Разговор держится собранно и без лишних скачков."
      },
      {
        id: "next-step",
        label: "Следующий шаг",
        value: 81,
        summary: "Есть хороший задел на пилот, но финальную договоренность можно сделать конкретнее."
      }
    ],
    whatToImprove: [
      "Чуть раньше уточнять критерии успеха пилота.",
      "Перед аргументацией про эффект уточнять, откуда именно у клиента скепсис."
    ],
    strongAnswerExample:
      "Прежде чем обсуждать формат, хочу быстро понять, где команда сейчас теряет скорость адаптации и как это отражается на первых разговорах. Тогда я смогу говорить только о том эффекте, который вам действительно нужен.",
    recommendations: [
      "Возьми в следующую практику один фокус: сначала уточнение, потом аргументация.",
      "В финале разговора формулируй пилот через срок, критерий и ответственного."
    ]
  },
  "scn-2": {
    overallScore: 79,
    competencyScores: [
      {
        id: "need-discovery",
        label: "Выявление потребности",
        value: 72,
        summary: "Пока не всегда раскрываешь источник сомнения до аргументации."
      },
      {
        id: "argumentation",
        label: "Аргументация",
        value: 82,
        summary: "Умеешь связать решение с бизнес-эффектом, когда уже прояснил контекст."
      },
      {
        id: "objection-handling",
        label: "Работа с возражениями",
        value: 75,
        summary: "Есть потенциал сильнее отзеркаливать опасение клиента и замедляться."
      },
      {
        id: "dialogue-structure",
        label: "Структура диалога",
        value: 80,
        summary: "Диалог остается собранным даже в напряженном моменте."
      },
      {
        id: "next-step",
        label: "Следующий шаг",
        value: 83,
        summary: "Хорошо подводишь к пилоту, если не уходишь рано в цену."
      }
    ],
    whatToImprove: [
      "Перед ответом на цену сначала уточни, с чем клиент сравнивает предложение.",
      "Сделай одну короткую фразу сочувствия, прежде чем давать бизнес-аргумент."
    ],
    strongAnswerExample:
      "Понимаю, что на старте цена выглядит выше. Чтобы не отвечать общими словами, можно уточню: вы сравниваете нас с классическим тренингом или больше смотрите на скорость переноса навыка в реальные звонки?",
    recommendations: [
      "Тренируй связку: признать сомнение → уточнить источник → перевести в ROI.",
      "После прояснения обязательно зафиксируй тестовый следующий шаг вместо общего продолжения разговора."
    ]
  }
};

export const learningModules: LearningModule[] = [
  {
    id: "mod-1",
    title: "Открытие разговора и рамка встречи",
    description: "Как быстро получить согласие на структуру разговора.",
    durationMinutes: 18,
    completedPercent: 100,
    nextStep: "Перейти к разбору кейса",
    statusLabel: "Завершен"
  },
  {
    id: "mod-2",
    title: "Работа со скрытым возражением",
    description: "Сигналы, по которым клиент еще не сказал нет, но уже теряет интерес.",
    durationMinutes: 22,
    completedPercent: 64,
    nextStep: "Дойти до практики диалога",
    statusLabel: "В процессе"
  },
  {
    id: "mod-3",
    title: "Фиксация следующего шага",
    description: "Техники, которые помогают не завершать разговор размытой договоренностью.",
    durationMinutes: 15,
    completedPercent: 20,
    nextStep: "Открыть мини-тренажер",
    statusLabel: "Запланирован"
  }
];

export const studentMetrics: DashboardMetric[] = [
  {
    id: "metric-1",
    label: "Индекс практики",
    value: "74%",
    changeLabel: "+8 п.п. за неделю",
    tone: "positive"
  },
  {
    id: "metric-2",
    label: "Средний score",
    value: "82/100",
    changeLabel: "+5 к прошлой сессии",
    tone: "positive"
  },
  {
    id: "metric-3",
    label: "Фокус месяца",
    value: "Возражения",
    changeLabel: "2 кейса требуют доработки",
    tone: "warning"
  }
];

export const managerMetrics: DashboardMetric[] = [
  {
    id: "metric-4",
    label: "Команда в ритме",
    value: "11 из 14",
    changeLabel: "+2 человека к прошлой неделе",
    tone: "positive"
  },
  {
    id: "metric-5",
    label: "Средний score команды",
    value: "79/100",
    changeLabel: "+4 за 2 недели",
    tone: "positive"
  },
  {
    id: "metric-6",
    label: "Зона риска",
    value: "Открытие встречи",
    changeLabel: "4 участника ниже бенчмарка",
    tone: "warning"
  }
];

export const hrMetrics: DashboardMetric[] = [
  {
    id: "metric-7",
    label: "Активные треки",
    value: "6",
    changeLabel: "2 новых за месяц",
    tone: "positive"
  },
  {
    id: "metric-8",
    label: "Скорость адаптации",
    value: "34 дня",
    changeLabel: "-5 дней к кварталу",
    tone: "positive"
  },
  {
    id: "metric-9",
    label: "Запрос на поддержку",
    value: "Оценка ответа",
    changeLabel: "Требует единых правил",
    tone: "warning"
  }
];

export const adminMetrics: DashboardMetric[] = [
  {
    id: "metric-10",
    label: "Активные организации",
    value: "4",
    changeLabel: "Без изменений",
    tone: "neutral"
  },
  {
    id: "metric-11",
    label: "Роли с доступом к экспорту",
    value: "3",
    changeLabel: "HR ограничен по PDF",
    tone: "neutral"
  },
  {
    id: "metric-12",
    label: "Политики в фокусе",
    value: "2",
    changeLabel: "Нужно утвердить до пятницы",
    tone: "warning"
  }
];

export const studentScores: SkillScore[] = [
  {
    competencyId: "comp-1",
    competencyName: "Диагностика потребности",
    value: 84,
    trend: "+6",
    benchmarkLabel: "Выше базового уровня"
  },
  {
    competencyId: "comp-2",
    competencyName: "Работа с возражениями",
    value: 69,
    trend: "+3",
    benchmarkLabel: "Ниже целевого уровня"
  },
  {
    competencyId: "comp-3",
    competencyName: "Фиксация следующего шага",
    value: 78,
    trend: "+1",
    benchmarkLabel: "Близко к целевому уровню"
  }
];

export const feedbackItems: FeedbackItem[] = [
  {
    id: "fb-1",
    title: "Сильное уточнение контекста",
    summary: "Ты задаешь хорошие диагностические вопросы, когда клиент уже включился в разговор.",
    tone: "positive",
    recommendedAction: "Сохрани этот темп и раньше переходи к критериям успеха."
  },
  {
    id: "fb-2",
    title: "Есть риск поспешного ответа на цену",
    summary: "В момент возражения про бюджет ты слишком быстро перешел к аргументации, не прояснив источник сомнения.",
    tone: "focus",
    recommendedAction: "Сначала уточни, с чем клиент сравнивает стоимость и чего боится."
  }
];

export const developmentTrack: DevelopmentTrack = {
  id: "track-1",
  title: "Уверенная работа с возражениями",
  summary: "Трек на 2 недели для перехода от защитной реакции к структурной работе с рисками клиента.",
  focusCompetencies: ["Работа с возражениями", "Фиксация следующего шага"],
  milestones: [
    "Пройти 2 микроурока",
    "Завершить 3 тренировки со score выше 80",
    "Закрепить новый шаблон ответа на бюджетное возражение"
  ]
};

export const studentActionItems: ActionItem[] = [
  {
    id: "act-1",
    title: "Повторить кейс про стоимость",
    description: "Запусти короткую тренировку и попробуй удержать разговор в плоскости ROI.",
    dueLabel: "Сегодня до 18:00",
    impactLabel: "Поднимет score по возражениям"
  },
  {
    id: "act-2",
    title: "Открыть разбор лучшего ответа",
    description: "Сравни свой вариант с эталонным и выпиши 2 формулировки в заметки.",
    dueLabel: "Завтра",
    impactLabel: "Ускорит перенос навыка в звонки"
  }
];

export const learningHistory: string[] = [
  "Вчера: завершен модуль по открытию встречи",
  "2 дня назад: score 82 в тренировке по диагностике",
  "На прошлой неделе: добавлен новый трек развития"
];

export const teamMembers: TeamMember[] = [
  {
    id: "tm-1",
    fullName: "Анна Морозова",
    roleTitle: "Менеджер по продажам",
    progressPercent: 74,
    latestScore: 82,
    focusArea: "Работа с возражениями",
    riskLabel: "Низкий"
  },
  {
    id: "tm-2",
    fullName: "Кирилл Егоров",
    roleTitle: "Менеджер по продажам",
    progressPercent: 58,
    latestScore: 71,
    focusArea: "Открытие встречи",
    riskLabel: "Средний"
  },
  {
    id: "tm-3",
    fullName: "Светлана Шаповалова",
    roleTitle: "Аккаунт-менеджер",
    progressPercent: 86,
    latestScore: 88,
    focusArea: "Фиксация next step",
    riskLabel: "Низкий"
  }
];

export const managerActionItems: ActionItem[] = [
  {
    id: "m-act-1",
    title: "Назначить коучинг по открытию встречи",
    description: "Собрать 4 участника и дать единый шаблон первого блока разговора.",
    dueLabel: "Завтра",
    impactLabel: "Снизит провалы в начале диалога"
  },
  {
    id: "m-act-2",
    title: "Проверить 3 проблемные тренировки",
    description: "Разобрать последние сессии, где участники потеряли договоренность о следующем шаге.",
    dueLabel: "До пятницы",
    impactLabel: "Улучшит управляемость практики"
  }
];

export const managerTeamSummary: GroupProgress = {
  id: "group-main",
  groupName: "Команда Север-1",
  completionRate: 73,
  averageScore: 79,
  activeSimulations: 5,
  riskCount: 2
};

export const managerGroupProgress: GroupProgress[] = [
  managerTeamSummary,
  {
    id: "group-west",
    groupName: "Команда Запад-2",
    completionRate: 68,
    averageScore: 76,
    activeSimulations: 4,
    riskCount: 3
  },
  {
    id: "group-key",
    groupName: "Key Accounts",
    completionRate: 84,
    averageScore: 86,
    activeSimulations: 2,
    riskCount: 1
  }
];

export const managerSkillDynamics: TeamSkillTrend[] = [
  {
    id: "skill-1",
    label: "Выявление потребности",
    currentValue: 81,
    targetValue: 88
  },
  {
    id: "skill-2",
    label: "Аргументация",
    currentValue: 77,
    targetValue: 85
  },
  {
    id: "skill-3",
    label: "Работа с возражениями",
    currentValue: 71,
    targetValue: 84
  },
  {
    id: "skill-4",
    label: "Следующий шаг",
    currentValue: 79,
    targetValue: 86
  }
];

export const managerLatestDialogues: DialogueTranscript[] = [
  {
    id: "dlg-1",
    learnerName: "Кирилл Егоров",
    scenarioTitle: "Возражение про стоимость программы",
    updatedAt: "Сегодня, 11:20",
    messages: [
      {
        id: "dlg-msg-1",
        speakerName: "Сергей",
        speakerRole: "customer",
        text: "Цена выше, чем у обычного тренинга. Почему это окупится?",
        timestampLabel: "00:04"
      },
      {
        id: "dlg-msg-2",
        speakerName: "Кирилл",
        speakerRole: "learner",
        text: "Если честно, мы даем более глубокий продукт, поэтому цена выше.",
        timestampLabel: "00:17"
      },
      {
        id: "dlg-msg-3",
        speakerName: "Сергей",
        speakerRole: "customer",
        text: "Понимаю, но мне пока не хватает связи с результатом команды.",
        timestampLabel: "00:24"
      }
    ]
  },
  {
    id: "dlg-2",
    learnerName: "Анна Морозова",
    scenarioTitle: "Первый разговор с руководителем отдела продаж",
    updatedAt: "Вчера, 18:40",
    messages: [
      {
        id: "dlg-msg-4",
        speakerName: "Екатерина",
        speakerRole: "customer",
        text: "Чем ваш формат поможет команде быстрее выйти в план?",
        timestampLabel: "00:05"
      },
      {
        id: "dlg-msg-5",
        speakerName: "Анна",
        speakerRole: "learner",
        text: "Сначала хочу уточнить, где сейчас команда сильнее всего теряет скорость адаптации.",
        timestampLabel: "00:15"
      }
    ]
  }
];

export const managerBestAnswers: BestAnswerExample[] = [
  {
    id: "best-1",
    learnerName: "Светлана Шаповалова",
    scenarioTitle: "Скрытое возражение о ценности",
    answerText:
      "Чтобы не уходить в общие слова, можно уточню: когда вы говорите, что обучение уже пробовали, что именно не сработало в прошлый раз?",
    whyItWorks:
      "Ответ не спорит, а сначала раскрывает источник сомнения. Это сохраняет доверие и переводит диалог в диагностику."
  },
  {
    id: "best-2",
    learnerName: "Анна Морозова",
    scenarioTitle: "Первый разговор с руководителем отдела продаж",
    answerText:
      "Если мы поймем, где именно команда теряет качество первых разговоров, я предложу только тот пилот, который можно измерить по скорости выхода на KPI.",
    whyItWorks:
      "Связка диагностики и измеримого пилота помогает не уходить в абстрактное обучение."
  }
];

export const managerRecommendations: TeamRecommendation[] = [
  {
    id: "mgr-rec-1",
    title: "Сфокусировать команду на открытии разговора",
    summary: "У двух сотрудников повторяется потеря рамки в первые 40 секунд диалога.",
    suggestedAction: "Назначь короткий коучинг и дай единый opening template."
  },
  {
    id: "mgr-rec-2",
    title: "Поднять качество ответа на цену",
    summary: "Команда часто уходит в аргументацию раньше, чем уточняет источник сомнения.",
    suggestedAction: "Закрепи связку: признание сомнения → уточнение → ROI."
  }
];

export const scheduledReportRules: ScheduledReportRule[] = [
  {
    id: "rule-1",
    title: "Еженедельный PDF для руководителя",
    role: "manager",
    audience: "Руководители групп",
    frequencyLabel: "Каждый понедельник",
    format: "pdf",
    enabled: true
  },
  {
    id: "rule-2",
    title: "HR выгрузка по динамике компетенций",
    role: "hr",
    audience: "HR / L&D",
    frequencyLabel: "Каждую пятницу",
    format: "xlsx",
    enabled: true
  },
  {
    id: "rule-3",
    title: "Админ-отчет по доступам",
    role: "admin",
    audience: "Администратор",
    frequencyLabel: "Раз в месяц",
    format: "csv",
    enabled: false
  },
  {
    id: "rule-4",
    title: "Индивидуальный отчет после практики",
    role: "student",
    audience: "Ученик",
    frequencyLabel: "После завершения упражнения",
    format: "pdf",
    enabled: true
  }
];

export const reportCards: ReportCard[] = [
  {
    id: "rep-1",
    title: "Индивидуальный прогресс ученика",
    role: "student",
    reportType: "student_progress",
    scenarioId: "price-objection",
    scenarioTitle: "Возражение на цену",
    status: "ready",
    summary: "История практики, score по компетенциям и рекомендации на следующую неделю.",
    format: "pdf",
    createdAt: "2026-05-05T09:10:00.000Z",
    updatedAt: "Сегодня, 09:10",
    ownerLabel: "Ученик",
    sourceLabel: "Диалог в чате",
    sessionId: "session-rep-1",
    availableFormats: ["pdf", "csv"],
    previewSections: [
      {
        id: "rep-1-sec-1",
        title: "Прогресс",
        lines: ["Общий прогресс: 74%", "Средний score: 82/100", "Фокус: возражения"]
      },
      {
        id: "rep-1-sec-2",
        title: "Рекомендации",
        lines: ["Уточнять источник сомнения клиента", "Четче фиксировать следующий шаг"]
      }
    ]
  },
  {
    id: "rep-2",
    title: "Динамика команды по качеству диалога",
    role: "manager",
    reportType: "team_performance",
    scenarioId: null,
    scenarioTitle: "Командная сводка",
    status: "ready",
    summary: "Сравнение команды по score, активности и проблемным кейсам.",
    format: "xlsx",
    createdAt: "2026-05-05T08:40:00.000Z",
    updatedAt: "Сегодня, 08:40",
    ownerLabel: "Руководитель",
    sourceLabel: "Командный отчет",
    sessionId: null,
    availableFormats: ["pdf", "xlsx", "csv"],
    previewSections: [
      {
        id: "rep-2-sec-1",
        title: "Сводка команды",
        lines: ["Средний score: 79/100", "В риске: 2 участника", "Активных тренировок: 5"]
      },
      {
        id: "rep-2-sec-2",
        title: "Фокус",
        lines: ["Открытие встречи", "Работа с возражениями"]
      }
    ]
  },
  {
    id: "rep-3",
    title: "Динамика компетенций для HR/L&D",
    role: "hr",
    reportType: "competency_dynamics",
    scenarioId: null,
    scenarioTitle: "HR аналитика компетенций",
    status: "ready",
    summary: "Изменение оценки по компетенциям и принятие учебных треков.",
    format: "xlsx",
    createdAt: "2026-05-04T18:20:00.000Z",
    updatedAt: "Вчера, 18:20",
    ownerLabel: "HR / L&D",
    sourceLabel: "HR / L&D отчет",
    sessionId: null,
    availableFormats: ["xlsx", "csv", "pdf"],
    previewSections: [
      {
        id: "rep-3-sec-1",
        title: "Динамика",
        lines: ["Диагностика: +6", "Аргументация: +4", "Возражения: +3"]
      },
      {
        id: "rep-3-sec-2",
        title: "Adoption",
        lines: ["Активных треков: 6", "Средняя доходимость: 78%"]
      }
    ]
  },
  {
    id: "rep-4",
    title: "Командный отчет по группе Север-1",
    role: "manager",
    reportType: "team_performance",
    scenarioId: null,
    scenarioTitle: "Группа Север-1",
    status: "ready",
    summary: "Прогресс группы, skill dynamics и список действий для руководителя.",
    format: "pdf",
    createdAt: "2026-05-05T12:10:00.000Z",
    updatedAt: "Сегодня, 12:10",
    ownerLabel: "Команда",
    sourceLabel: "Командный отчет",
    sessionId: null,
    availableFormats: ["pdf", "csv"],
    previewSections: [
      {
        id: "rep-4-sec-1",
        title: "Результаты",
        lines: ["Прогресс: 73%", "Средний score: 79", "Активных тренировок: 5"]
      }
    ]
  },
  {
    id: "rep-5",
    title: "Регламент отправки отчетов и доступов",
    role: "admin",
    reportType: "learning_adoption",
    scenarioId: null,
    scenarioTitle: "Регламент отчетности",
    status: "ready",
    summary: "Правила отправки, форматы выгрузок, права доступа и расписание системных отчетов.",
    format: "pdf",
    createdAt: "2026-05-05T11:25:00.000Z",
    updatedAt: "Сегодня, 11:25",
    ownerLabel: "Администратор",
    sourceLabel: "Системный отчет",
    sessionId: null,
    availableFormats: ["pdf", "xlsx", "csv"],
    previewSections: [
      {
        id: "rep-5-sec-1",
        title: "Правила доступа",
        lines: ["Ученик: личный PDF", "Руководитель: командный PDF/CSV", "HR: XLSX/CSV/PDF по группам"]
      },
      {
        id: "rep-5-sec-2",
        title: "Расписание",
        lines: ["Еженедельные отчеты для руководителей", "Пятничные выгрузки для HR", "Ежемесячный контроль доступа"]
      }
    ]
  }
];

export const hrGroupProgress: GroupProgress[] = [
  {
    id: "hr-group-1",
    groupName: "Команда Север-1",
    completionRate: 73,
    averageScore: 79,
    activeSimulations: 5,
    riskCount: 2
  },
  {
    id: "hr-group-2",
    groupName: "Команда Запад-2",
    completionRate: 68,
    averageScore: 76,
    activeSimulations: 4,
    riskCount: 3
  },
  {
    id: "hr-group-3",
    groupName: "Junior onboarding",
    completionRate: 82,
    averageScore: 74,
    activeSimulations: 6,
    riskCount: 1
  }
];

export const hrScoreDynamics: ScoreTrendPoint[] = [
  { id: "dyn-1", label: "Янв", value: 64 },
  { id: "dyn-2", label: "Фев", value: 69 },
  { id: "dyn-3", label: "Мар", value: 72 },
  { id: "dyn-4", label: "Апр", value: 77 }
];

export const hrTeamRecommendations: TeamRecommendation[] = [
  {
    id: "hr-rec-1",
    title: "Усилить работу с early objection",
    summary: "По двум группам повторяется одинаковый провал в момент ценового сомнения.",
    suggestedAction: "Добавить короткий трек по диагностике источника возражения."
  },
  {
    id: "hr-rec-2",
    title: "Сократить перегруз в адаптации",
    summary: "Junior onboarding показывает высокую доходимость, но перегружен длинными блоками теории.",
    suggestedAction: "Разбить программу на более короткие практики, которые легче встроить в рабочий день."
  }
];

export const hrRiskGroups: string[] = [
  "Запад-2: просадка по открытию разговора и удержанию структуры.",
  "SMB pipeline: нужен дополнительный трек по работе с возражениями."
];

export const hrTracks: DevelopmentTrack[] = [
  developmentTrack,
  {
    id: "track-2",
    title: "Адаптация новых менеджеров за 30 дней",
    summary: "Трек для новых сотрудников с акцентом на первые разговоры и базовую структуру звонка.",
    focusCompetencies: ["Диагностика потребности", "Фиксация следующего шага"],
    milestones: [
      "Пройти стартовый knowledge pack",
      "Закрыть 5 практик по открытию разговора",
      "Выйти на средний score 75+"
    ]
  }
];

export const adminRoleRules: AccessRoleRule[] = [
  {
    id: "role-rule-1",
    role: "student",
    accessLevel: "self",
    permissions: ["Просмотр своего прогресса", "Тренажер", "База знаний"],
    exportTargets: ["pdf"]
  },
  {
    id: "role-rule-2",
    role: "manager",
    accessLevel: "team",
    permissions: ["Просмотр команды", "Отчеты команды", "Назначение тренировок"],
    exportTargets: ["pdf", "csv"]
  },
  {
    id: "role-rule-3",
    role: "hr",
    accessLevel: "department",
    permissions: ["Групповые отчеты", "Треки развития", "Компетенции"],
    exportTargets: ["xlsx", "csv", "pdf"]
  },
  {
    id: "role-rule-4",
    role: "admin",
    accessLevel: "organization",
    permissions: ["Управление ролями", "Настройки доступа", "Регламенты выгрузок"],
    exportTargets: ["pdf", "xlsx", "csv"]
  }
];

export const adminUserAccessSettings: UserAccessSetting[] = [
  {
    id: "uas-1",
    userName: "Анна Морозова",
    role: "student",
    accessScope: "Только свой профиль",
    reportAccessLabel: "Индивидуальный PDF"
  },
  {
    id: "uas-2",
    userName: "Илья Громов",
    role: "manager",
    accessScope: "Команда Север-1",
    reportAccessLabel: "Team PDF + CSV"
  },
  {
    id: "uas-3",
    userName: "Мария Тарасова",
    role: "hr",
    accessScope: "Learning & Enablement",
    reportAccessLabel: "HR XLSX + CSV"
  }
];

export const adminKnowledgeImports: KnowledgeImportStatus[] = [
  {
    id: "ki-1",
    title: "База знаний: sales skills",
    materialsCount: 24,
    statusLabel: "Синхронизировано",
    lastSyncLabel: "Сегодня, 07:30"
  },
  {
    id: "ki-2",
    title: "База знаний: сценарии и кейсы",
    materialsCount: 11,
    statusLabel: "Требует обновления",
    lastSyncLabel: "2 дня назад"
  }
];

export const adminScenarioItems: ScenarioAdminItem[] = [
  {
    id: "adm-scn-1",
    title: "Возражение про стоимость программы",
    difficulty: "Продвинутый",
    statusLabel: "Активен",
    ownerLabel: "Sales enablement"
  },
  {
    id: "adm-scn-2",
    title: "Первый разговор с руководителем отдела продаж",
    difficulty: "Средний",
    statusLabel: "Активен",
    ownerLabel: "Sales enablement"
  },
  {
    id: "adm-scn-3",
    title: "Скрытое сомнение в ценности",
    difficulty: "Сложный",
    statusLabel: "Черновик",
    ownerLabel: "L&D"
  }
];

export const adminSettingsData: AdminSettings = {
  user: usersByRole.admin,
  metrics: adminMetrics,
  roleRules: adminRoleRules,
  userAccessSettings: adminUserAccessSettings,
  knowledgeImports: adminKnowledgeImports,
  scenarioItems: adminScenarioItems,
  settings: [
    {
      id: "setting-1",
      title: "Доступ руководителей к PDF",
      description: "Разрешить руководителям экспорт сводного PDF по своей команде.",
      enabled: true
    },
    {
      id: "setting-2",
      title: "HR доступ к полным расшифровкам",
      description: "Показывать детальные расшифровки диалога только при повышенном доступе.",
      enabled: false
    },
    {
      id: "setting-3",
      title: "Автоматическая отправка monthly access report",
      description: "Формировать выгрузку по ролям и правилам доступа раз в месяц.",
      enabled: false
    }
  ],
  reportRules: scheduledReportRules,
  actionItems: [
    {
      id: "admin-act-1",
      title: "Проверить политику доступа HR",
      description: "Согласовать, какие поля оценки можно выгружать по организациям.",
      dueLabel: "До пятницы",
      impactLabel: "Снизит риск лишних данных в выгрузках"
    },
    {
      id: "admin-act-2",
      title: "Утвердить шаблон monthly report",
      description: "Подготовить финальный набор полей для админ-отчета по ролям.",
      dueLabel: "Следующая неделя",
      impactLabel: "Упростит контроль доступа"
    }
  ]
};

export const studentDashboardData: StudentDashboard = {
  user: usersByRole.student,
  level: studentLevelSummary,
  overallProgressPercent: 74,
  nearestPracticeTitle: "Сценарий про возражение на цену",
  nearestPracticeDescription: "15 минут практики, чтобы спокойнее отвечать на сравнение с обычным тренингом и не спорить с клиентом.",
  metrics: studentMetrics,
  modules: learningModules,
  scores: studentScores,
  feedback: feedbackItems,
  developmentTrack,
  growthPoints: [
    "Сначала уточнять источник сомнения клиента, а не сразу аргументировать.",
    "Четче завершать разговор конкретным следующим шагом и сроком."
  ],
  aiRecommendations: [
    "Перед каждой тренировкой выбери один навык, который хочешь проверить в разговоре.",
    "После оценки забери только 1 рекомендацию в план, чтобы быстрее перенести ее в реальные звонки."
  ],
  actionItems: studentActionItems,
  history: learningHistory,
  highlightedScenario: scenarios[0]
};

export const managerDashboardData: ManagerDashboard = {
  user: usersByRole.manager,
  metrics: managerMetrics,
  teamSummary: managerTeamSummary,
  skillDynamics: managerSkillDynamics,
  teamMembers,
  latestDialogues: managerLatestDialogues,
  bestAnswers: managerBestAnswers,
  growthPoints: [
    "Команда спешит переходить к аргументации без уточнения источника сомнения.",
    "В части тренировок теряется конкретный следующий шаг в финале разговора."
  ],
  recommendations: managerRecommendations,
  actionItems: managerActionItems,
  reportCards
};

export const hrDashboardData: HrDashboard = {
  user: usersByRole.hr,
  metrics: hrMetrics,
  groupProgress: hrGroupProgress,
  competencies,
  scoreDynamics: hrScoreDynamics,
  teamRecommendations: hrTeamRecommendations,
  riskGroups: hrRiskGroups,
  tracks: hrTracks,
  scheduledReports: scheduledReportRules
};
