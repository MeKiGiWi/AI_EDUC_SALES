export interface LandingNavLink {
  id: string;
  label: string;
  summary: string;
}

export interface LandingHeroContent {
  eyebrow: string;
  title: string;
  description: string;
  highlights: string[];
}

export interface LandingListItem {
  title: string;
  description: string;
}

export interface LandingAudienceItem {
  title: string;
  audience: string;
  result: string;
  skills: string[];
}

export interface LandingFeatureItem {
  title: string;
  description: string;
  tag: string;
}

export interface LandingPricingPlan {
  name: string;
  caption: string;
  features: string[];
  ctaLabel: string;
  featured?: boolean;
}

export interface LandingFaqItem {
  question: string;
  answer: string;
}

export const landingContent = {
  navLinks: [
    {
      id: "platform",
      label: "Платформа",
      summary: "База знаний, тренажер, оценка навыков и отчеты в одном мобильном контуре."
    },
    {
      id: "trainer",
      label: "ИИ-тренажер",
      summary: "Практика диалога с mock оценкой, рекомендациями и переносом в план развития."
    },
    {
      id: "audience",
      label: "Академии",
      summary: "Подходы для B2B, B2C, hunter, account и экспертных продаж."
    },
    {
      id: "pricing",
      label: "Пакеты",
      summary: "MVP-пакеты Base, Pro и Enterprise для разных этапов внедрения."
    },
    {
      id: "faq",
      label: "FAQ",
      summary: "Ответы про тренажер, отчеты, интеграции и адаптацию под вашу команду."
    }
  ] satisfies LandingNavLink[],
  hero: {
    eyebrow: "AI Sales Academy",
    title: "Развиваем продавцов через ИИ-практику, симуляции и аналитику",
    description:
      "Мобильная академия продаж: база знаний, ИИ-тренажер диалогов, оценка компетенций, персональный план развития и отчеты для руководителей.",
    highlights: [
      "Одна кодовая база Expo + React Native для телефона и браузера",
      "Практика продаж и обратная связь без backend-зависимости",
      "Готовность к будущей Python-интеграции через typed service layer"
    ]
  } satisfies LandingHeroContent,
  problemItems: [
    {
      title: "Знание не превращается в поведение",
      description: "Продавцы знают продукт, но не умеют уверенно проводить реальный разговор и фиксировать следующий шаг."
    },
    {
      title: "Нет регулярной практики",
      description: "Команда редко тренируется в коротком ритме, поэтому навыки не закрепляются до рабочего автоматизма."
    },
    {
      title: "Обратная связь несистемна",
      description: "Руководители оценивают по-разному, а единый стандарт ответа и диагностики не масштабируется на всю команду."
    },
    {
      title: "Сложно связать обучение с KPI",
      description: "Без понятной аналитики трудно показать, как обучение влияет на конверсию, адаптацию и выручку."
    }
  ] satisfies LandingListItem[],
  howItWorksSteps: [
    {
      title: "База знаний",
      description: "Собираем стандарты, playbooks, продуктовые материалы и кейсы в одном контуре."
    },
    {
      title: "ИИ-объяснение",
      description: "Менеджер быстро получает простое пояснение, пример ответа и связку с практикой."
    },
    {
      title: "Симулятор диалога",
      description: "Сценарий подбирается под роль, сегмент клиента, сложность и этап воронки."
    },
    {
      title: "Оценка навыков",
      description: "После практики платформа показывает score по компетенциям и конкретные зоны роста."
    },
    {
      title: "Отчеты и развитие",
      description: "Результат уходит в персональный план и в отчеты для руководителя, HR и админа."
    }
  ] satisfies LandingListItem[],
  trainerItems: [
    {
      title: "Практика в разговоре или переписке",
      description: "Формат близок к реальной работе: встреча, звонок, чат или follow-up."
    },
    {
      title: "Адаптация под роль и зрелость",
      description: "Сценарии меняются под hunter, account, B2B, B2C и разные уровни команды."
    },
    {
      title: "Оценка soft и hard skills",
      description: "Платформа смотрит на структуру, эмпатию, аргументацию и диагностику."
    }
  ] satisfies LandingListItem[],
  audienceItems: [
    {
      title: "B2B Sales Academy",
      audience: "Корпоративные продажи, длинный цикл, работа с ЛПР и сложной ценностью.",
      result: "Рост качества discovery, аргументации и управления этапами сделки.",
      skills: ["SPIN и discovery", "Value selling", "Следующий шаг"]
    },
    {
      title: "B2C Sales Academy",
      audience: "Розница, сервис, консультационные продажи и работа со средним чеком.",
      result: "Больше уверенных покупок, выше сервис и устойчивее upsell.",
      skills: ["Выявление потребности", "Cross-sell", "Работа с сомнениями"]
    },
    {
      title: "Hunter Academy",
      audience: "SDR, лидогенерация, холодные касания и первая встреча.",
      result: "Сильнее первые касания и выше качество квалификации.",
      skills: ["Холодный outreach", "Квалификация", "Call-to-action"]
    },
    {
      title: "Account Academy",
      audience: "Фермеры, аккаунт-менеджеры, удержание и развитие текущей базы.",
      result: "Больше удержания, допродаж и управляемости портфеля.",
      skills: ["Retention", "Upsell", "Развитие портфеля"]
    },
    {
      title: "Экспертные продажи",
      audience: "ПО, оборудование, внедрения, тендеры и сложные согласования.",
      result: "Команда лучше продает сложную ценность и экспертность.",
      skills: ["Consultative selling", "ROI-аргументация", "Продажа изменений"]
    }
  ] satisfies LandingAudienceItem[],
  featureItems: [
    {
      title: "Онлайн-контент",
      description: "Курсы, стандарты и материалы по продукту в одном окне.",
      tag: "Контент"
    },
    {
      title: "Практика и симуляции",
      description: "Сценарии под реальные этапы сделки, возражения и переговоры.",
      tag: "Практика"
    },
    {
      title: "Оценка компетенций",
      description: "Scorecards и прозрачная диагностика сильных и слабых зон.",
      tag: "Оценка"
    },
    {
      title: "Обратная связь",
      description: "Разборы, рекомендации и перенос следующего действия в план.",
      tag: "Feedback"
    },
    {
      title: "Управление результатом",
      description: "Единые стандарты, маршруты развития и контроль прохождения практик.",
      tag: "Управление"
    },
    {
      title: "Аналитика KPI",
      description: "Дашборды по людям и командам, связь навыков с коммерческими показателями.",
      tag: "KPI"
    }
  ] satisfies LandingFeatureItem[],
  pricingPlans: [
    {
      name: "Base",
      caption: "Для быстрого старта с ИИ-тренажером, базой знаний и базовой отчетностью.",
      features: ["ИИ-тренажер", "Базовая библиотека сценариев", "Базовые отчеты"],
      ctaLabel: "Запросить демо"
    },
    {
      name: "Pro",
      caption: "Для команд, которым нужна более глубокая настройка сценариев и процессов.",
      features: ["Расширенные сценарии", "Расширенная аналитика", "Ролевые кабинеты"],
      ctaLabel: "Запросить демо",
      featured: true
    },
    {
      name: "Enterprise",
      caption: "Для крупных контуров с ролями, безопасностью и будущими интеграциями.",
      features: ["Гибкие доступы", "Контур отчетности", "Backend-ready архитектура"],
      ctaLabel: "Запросить демо"
    }
  ] satisfies LandingPricingPlan[],
  securityItems: [
    {
      title: "Python backend later",
      description: "Текущий MVP живет на typed mock data, а будущая интеграция планируется через отдельный Python backend."
    },
    {
      title: "Роли и доступы",
      description: "Ученик, руководитель, HR/L&D и админ уже разведены по экранам и сценариям доступа."
    },
    {
      title: "Отчеты и контур управления",
      description: "PDF/CSV/XLSX логика пока mock, но UX уже показывает, как работает контур выгрузок."
    },
    {
      title: "Интеграции позже",
      description: "LMS, API и корпоративные источники данных предусмотрены как следующий этап, а не текущий runtime."
    }
  ] satisfies LandingListItem[],
  faqItems: [
    {
      question: "Чем ИИ-тренажер отличается от обычного курса?",
      answer: "Курс передает знания, а ИИ-тренажер дает практику в диалоге, обратную связь и понятный прогресс по навыкам."
    },
    {
      question: "Можно ли использовать наши продукты, скрипты и возражения?",
      answer: "Да. В будущем база знаний, сценарии и оценка могут быть адаптированы под ваш продукт и ваши стандарты."
    },
    {
      question: "Подходит ли платформа для B2B и B2C продаж?",
      answer: "Да. В MVP уже заложены разные типы академий и сценариев под разные модели продаж."
    },
    {
      question: "Как руководитель видит прогресс команды?",
      answer: "Через командный кабинет, карточки сотрудников, последние диалоги, рекомендации и центр отчетов."
    },
    {
      question: "Можно ли интегрировать с LMS?",
      answer: "Позже да. Сейчас мы фиксируем backend-ready направление и будущие точки интеграции без отдельного web frontend."
    }
  ] satisfies LandingFaqItem[]
} as const;
