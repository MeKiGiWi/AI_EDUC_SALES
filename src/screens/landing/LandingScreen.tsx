import React, { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextStyle,
  type ViewStyle
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import { leadService } from "../../services/leadService";
import type { RoleWorkspaceOption } from "../../types/academy";

interface LandingScreenProps {
  roleOptions: RoleWorkspaceOption[];
  onOpenAudit: () => void;
}

type SectionId = "about" | "compare" | "trainer" | "case" | "pricing" | "contact" | "blog" | "faq";

interface CloudProblem {
  title: string;
  text: string;
  points: string[];
}

interface CompareCard {
  name: string;
  price: string;
  priceNote: string;
  extraPrice?: string;
  extraNote?: string;
  sub: string;
  featured?: boolean;
  params: Array<{ label: string; value: string; tone?: "green" | "red" }>;
}

const NAV_LINKS: Array<{ id: SectionId; label: string }> = [
  { id: "about", label: "Это про вас" },
  { id: "compare", label: "Сравнение" },
  { id: "faq", label: "FAQ" },
  { id: "contact", label: "Аудит" }
];

const HERO_FLOW = [
  ["Анализ звонков", "Понимаем, где команда теряет пациента и на каких этапах срывается следующий шаг."],
  [
    "Сценарии диалогов на базе анализа звонков",
    "Создаем релевантные сценарии обучения не из теории, а из реальных ошибок и паттернов."
  ],
  [
    "Отработка точечных навыков",
    "Тренируем работу с ценой, страхом, сомнениями и фиксацией следующего шага."
  ],
  [
    "Оценка компетенций после обучения",
    "Система показывает, какие навыки усилились и где сотруднику нужна дополнительная практика."
  ],
  [
    "Аналитика",
    "Связываем качество навыков с бизнес-показателями клиники: конверсией, записью, доходимостью и выручкой."
  ]
];

const STATS = [
  ["+50%", "к росту выручки за счет корректной квалификации клиентов"],
  ["+25%", "к текущей конверсии в пациента за счет изменения действий администраторов"],
  ["+70%", "в точности прогноза выручки благодаря аналитике"],
  ["1 мес.", "ориентир окупаемости после завершения внедрения"]
];

const CLOUD_PROBLEMS: CloudProblem[] = [
  {
    title: "Выручка не растет",
    text: "Клиника получает обращения, но деньги не растут, потому что команда не доводит входящий поток до нужной записи, консультации и операции.",
    points: [
      "Лиды есть, но конверсия ниже потенциала",
      "Пациенты не переходят к следующему шагу",
      "Часть выручки теряется на уровне коммуникации"
    ]
  },
  {
    title: "Маркетинг не справляется",
    text: "Часто кажется, что проблема в рекламе, но маркетинг уже привел лиды. Настоящая проблема в том, что команда не обрабатывает этот поток с нужным качеством.",
    points: [
      "Лиды приходят, но не превращаются в запись",
      "Конверсия низкая не из-за количества, а из-за качества диалога",
      "Клиника докупает маркетинг вместо исправления коммуникации"
    ]
  },
  {
    title: "Пациенты не доходят",
    text: "Запись есть, но пациент выпадает между касаниями: не подтверждает визит, не доходит до консультации или срывает следующий этап.",
    points: [
      "Нет системы подтверждения и дожима",
      "Не фиксируется следующий шаг после разговора",
      "Клиника теряет теплого пациента после первого контакта"
    ]
  },
  {
    title: "Следующий шаг не зафиксирован",
    text: "После общения пациент остается без конкретного действия: нет даты, нет обязательства, нет понятного движения по воронке.",
    points: [
      "Разговор заканчивается без фиксации шага",
      "Пациент уходит думать и пропадает",
      "Конверсия падает из-за отсутствия контроля перехода"
    ]
  },
  {
    title: "Не видно реальной картины",
    text: "Руководитель видит только итоговые цифры, но не понимает, какое поведение команды привело к ним и где именно точка просадки.",
    points: [
      "Нельзя связать качество диалога с выручкой",
      "Непонятно, кто из команды тянет вниз результат",
      "Сложно прогнозировать рост и окупаемость обучения"
    ]
  },
  {
    title: "Знают, но не делают",
    text: "Скрипты и стандарты могут быть прописаны, но сотрудники не превращают их в устойчивое поведение в реальном разговоре с пациентом.",
    points: [
      "После обучения навыки быстро откатываются",
      "Нет регулярной отработки сложных возражений",
      "Контроль знаний не равен контролю действий"
    ]
  },
  {
    title: "Новый администратор долго входит в роль",
    text: "Онбординг затягивается, потому что он не привязан к реальным сценариям клиники: новый сотрудник долго выходит на стабильную конверсию.",
    points: [
      "План выполняется только через месяцы",
      "Руководитель тратит время на ручное сопровождение",
      "Ошибки повторяются до первой серьезной обратной связи"
    ]
  },
  {
    title: "Нет единого стандарта обработки",
    text: "Каждый администратор разговаривает по-своему, из-за чего качество клиентского опыта и конверсия зависят от конкретной смены.",
    points: [
      "Сильные сотрудники вытягивают результат вручную",
      "Слабые сотрудники теряют пациентов на базовых этапах",
      "Нельзя масштабировать лучший подход на всю команду"
    ]
  },
  {
    title: "Нет связи между обучением и выручкой",
    text: "Обучение проходит отдельно от бизнес-результата, поэтому непонятно, какие навыки реально влияют на запись, доходимость и средний чек.",
    points: [
      "Бюджет на обучение не связан с ROI",
      "Нельзя доказать эффект от развития команды",
      "Решение о продолжении обучения принимается вслепую"
    ]
  }
];

const COMPARE_CARDS: CompareCard[] = [
  {
    name: "Комплексное решение: тренажер + аналитика",
    price: "450\u00a0000\u00a0₽",
    priceNote: "внедрение и настройка",
    extraPrice: "80\u00a0000\u00a0₽",
    extraNote: "в месяц поддержка",
    sub: "Высокая цена входа оправдана тем, что вы получаете работающий контур изменений, а не отдельный кусок инфраструктуры.",
    featured: true,
    params: [
      { label: "Цена входа", value: "Выше, чем у альтернатив", tone: "green" },
      { label: "Сценарии под клинику", value: "Да, на базе анализа звонков и ваших задач", tone: "green" },
      { label: "Регулярная практика", value: "Да, сотрудник тренируется постоянно", tone: "green" },
      { label: "Оценка компетенций", value: "Да, после тренировки видно качество навыка", tone: "green" },
      { label: "Связь с KPI и дашбордом", value: "Да, навыки привязаны к записи, доходимости и выручке", tone: "green" },
      { label: "Итог для клиники", value: "Устойчивый навык и управляемый рост результата", tone: "green" }
    ]
  },
  {
    name: "Тренер",
    price: "от\u00a0100\u00a0000\u00a0₽",
    priceNote: "за запуск / сессию",
    sub: "Ниже цена старта, но без системы закрепления результат быстро рассеивается.",
    params: [
      { label: "Цена входа", value: "Ниже" },
      { label: "Сценарии под клинику", value: "Частично, вручную и на конкретную сессию" },
      { label: "Регулярная практика", value: "Нет", tone: "red" },
      { label: "Оценка компетенций", value: "Нет прозрачной системы", tone: "red" },
      { label: "Связь с KPI и дашбордом", value: "Нет", tone: "red" },
      { label: "Итог для клиники", value: "Краткосрочный эффект до 3 дней", tone: "red" }
    ]
  },
  {
    name: "LMS + разработка курсов",
    price: "от\u00a0200\u00a0000\u00a0₽",
    priceNote: "в месяц · эксперты и методологи",
    sub: "Платформа и контент сами по себе не меняют поведение в разговоре.",
    params: [
      { label: "Цена входа", value: "Средняя / высокая" },
      { label: "Сценарии под клинику", value: "Можно сделать, но отдельно и долго" },
      { label: "Регулярная практика", value: "Чаще нет живой отработки", tone: "red" },
      { label: "Оценка компетенций", value: "Обычно оценивается прохождение, а не навык", tone: "red" },
      { label: "Связь с KPI и дашбордом", value: "Нужна отдельная настройка", tone: "red" },
      { label: "Итог для клиники", value: "Есть инфраструктура, но нет гарантии результата", tone: "red" }
    ]
  },
  {
    name: "Покупка онлайн-курсов",
    price: "от\u00a050\u00a0000\u00a0₽",
    priceNote: "за пакет / доступ",
    sub: "Самая низкая цена, но почти нулевая управляемость результата.",
    params: [
      { label: "Цена входа", value: "Низкая" },
      { label: "Сценарии под клинику", value: "Нет", tone: "red" },
      { label: "Регулярная практика", value: "Нет", tone: "red" },
      { label: "Оценка компетенций", value: "Нет", tone: "red" },
      { label: "Связь с KPI и дашбордом", value: "Нет", tone: "red" },
      { label: "Итог для клиники", value: "Низкая цена, но вы почти ничего не получаете", tone: "red" }
    ]
  }
];

const COMPACT_CARDS = [
  ["Методология трех экспертов", "Внутри системы соединены разные тренерские подходы, чтобы не сводить обучение к одной узкой модели поведения."],
  [
    "Сценарии под клинику",
    "Отдельно настраиваем генерацию сценариев под вашу специализацию, этапы воронки, боли пациентов и типовые возражения."
  ],
  [
    "Связка с KPI",
    "Тренировки и оценка навыков связаны с тем, что реально важно бизнесу: запись, доходимость, следующий шаг и выручка."
  ]
];

const DIALOGS = [
  {
    title: "Возражение по цене",
    messages: [
      ["user", "У вас дорого. Мне уже называли цену ниже."],
      [
        "ai",
        "Понимаю вас. У нас вы платите не просто за услугу, а за сервис, высокую квалификацию врача и репутацию клиники. Для многих пациентов это как раз то, что помогает чувствовать себя спокойно и уверенно."
      ],
      ["user", "Да, но разница в цене все равно заметная."],
      [
        "ai",
        "Согласна. Поэтому здесь важно сравнивать не только стоимость, а то, насколько безопасно, предсказуемо и качественно пройдет весь путь лечения."
      ]
    ],
    score: "Навык: работа с ценой · 81/100"
  },
  {
    title: "Возражение «мне страшно»",
    messages: [
      ["user", "Мне страшно. Я боюсь, что что-то пойдет не так."],
      [
        "ai",
        "Понимаю ваше волнение. Скажу по-человечески: у нас еще никто не умирал и с вами ничего не случится. А если врач увидит, что вы действительно не в зоне показаний или есть риски, он ничего лишнего советовать не будет."
      ],
      ["user", "То есть меня не будут уговаривать на ненужное?"],
      ["ai", "Нет. Наша задача — чтобы вы приняли безопасное и взвешенное решение, а не просто согласились на процедуру."]
    ],
    score: "Навык: управление эмоциями · 86/100"
  },
  {
    title: "Возражение «я подумаю»",
    messages: [
      ["user", "Спасибо, я еще подумаю и посоветуюсь с супругом."],
      ["ai", "Конечно. Подскажите, пожалуйста, супруг будет влиять на решение или вы принимаете его вместе?"],
      ["user", "Скорее вместе."],
      [
        "ai",
        "Тогда давайте подумаем, что может быть для вас двоих полезно. Например, если супруг тоже рассматривает консультацию, мы можем предложить специальное условие или скидку за двоих — это поможет обсудить решение предметно."
      ]
    ],
    score: "Навык: следующий шаг · 79/100"
  }
];

const PRICES = [
  ["Модуль 01", "Аналитика звонков", "150 тыс", "+ 50 тыс/мес", "Анализ коммуникаций, выявление точек потерь и регулярная аналитика по качеству обработки входящего потока."],
  ["Модуль 02", "ИИ-тренажер", "250 тыс", "+ 80 тыс/мес", "Запуск сценариев тренировки, оценка компетенций и развитие администраторов на основе реальных кейсов клиники."],
  ["Модуль 03", "Аналитика и дашборды", "250 тыс", "+ 50 тыс/мес", "Управленческие панели, показатели конверсии, доходимости, причин отказов и точек потери выручки."],
  ["Пакет", "Всё вместе", "450 тыс", "+ 80 тыс/мес", "Единый контур: аналитика звонков, ИИ-тренажер и дашборды в одной системе с общей логикой управления."]
];
  
const BLOG = [
  [
    "Материал 01",
    "Почему клиника теряет выручку, даже когда лиды уже пришли",
    "Разбираем, как пациент теряется между первым звонком, записью, консультацией и следующим шагом — и что с этим делать.",
    "Обсудить похожую ситуацию →",
    "contact"
  ],
  [
    "Материал 02",
    "Почему обучение администраторов не влияет на деньги",
    "Как связать тренировки команды с конверсией, доходимостью и показателями выручки — а не только с прохождением курса.",
    "Посмотреть механику тренажера →",
    "trainer"
  ],
  [
    "Материал 03",
    "Как собственнику увидеть реальную причину просадки воронки",
    "Какие данные нужны руководителю, чтобы принимать решения не по ощущениям, а по фактам из звонков и переписок команды.",
    "Сравнить подходы →",
    "compare"
  ]
];

const CASES = [
  {
    id: "neuro",
    eyebrow: "Кейс 01",
    sphere: "Нейрохирургия и неврология",
    region: "Казахстан",
    title: "Клиника таламотомии — устранение тремора при болезни Паркинсона",
    summary:
      "Системная диагностика продаж, ИИ-анализ звонков и управленческая аналитика вывели работу команды из «черного ящика» и увеличили выручку.",
    metrics: [
      ["+50%", "Рост выручки"],
      ["+50%", "Конверсия"],
      ["3 мес", "Окупаемость"]
    ],
    file: "cases/case-neuro.pdf"
  },
  {
    id: "aesthetic",
    eyebrow: "Кейс 02",
    sphere: "Пластическая и эстетическая хирургия",
    region: "Казань",
    title: "Клиника эстетической медицины — продажи как управляемый канал",
    summary:
      "Перестроили внутреннюю модель продаж, убрали конфликт интересов в команде и превратили работу администраторов в управляемый канал роста.",
    metrics: [
      ["+30%", "Конверсия"],
      ["2 мес", "Окупаемость"],
      ["1 млн", "Чек, до ₽"]
    ],
    file: "cases/case-aesthetic.pdf"
  },
  {
    id: "ortho",
    eyebrow: "Кейс 03",
    sphere: "Ортопедия, опорно-двигательная система",
    region: "Москва",
    title: "Ортопедическая клиника — оборудование как центр прибыли",
    summary:
      "Превратили дорогостоящее оборудование из «мёртвого актива» в прогнозируемый центр прибыли: администраторы стали формировать спрос.",
    metrics: [
      ["+32%", "Рост выручки"],
      ["+20%", "Запись в процедуру"],
      ["3 мес", "Окупаемость"]
    ],
    file: "cases/case-ortho.pdf"
  }
];

const NAVY = "#121a68";
const LIME = "#9cf000";
const LIME_2 = "#b8ff43";
const RED = "#c84242";
const TEXT = "#1f2559";
const MUTED = "#60688d";
const LINE = "#dfe3f2";
const SOFT = "#f6f8ff";
const SOFT_2 = "#eef2ff";
const FONT_FAMILY = Platform.OS === "web" ? "Inter, system-ui, sans-serif" : undefined;

const FAQ = [
  [
    "Обязательно ли анализировать звонки?",
    "Да, если вы хотите не угадывать причину слабой конверсии, а видеть ее в реальном поведении администраторов. Именно анализ звонков дает материал для точной настройки сценариев и показывает, какие навыки действительно влияют на результат."
  ],
  [
    "Зачем нужна оценка компетенций?",
    "Чтобы руководитель видел не только факт прохождения тренировки, но и качество навыка: кто умеет работать с возражением, кто слабо фиксирует следующий шаг, а кто долго выходит на плановые показатели."
  ],
  [
    "Как вы делаете эту оценку?",
    "Мы оцениваем ответы сотрудника в сценариях по заранее заданным параметрам: логика диалога, работа с эмоциями пациента, аргументация, фиксация следующего шага, качество квалификации и другие критерии, важные именно для вашей клиники."
  ],
  [
    "Как отрабатываются сценарии?",
    "Сценарии строятся на базе реальных звонков и типовых ситуаций клиники. Сотрудник проходит диалог, получает ответ системы, пробует разные варианты и постепенно закрепляет нужное поведение на конкретных кейсах."
  ],
  [
    "Можно ли добавить в тренажер речевое общение как имитацию звонка?",
    "Да, такой формат можно добавить. Это позволяет приблизить тренировку к реальному звонку, чтобы сотрудники отрабатывали не только текст, но и темп, интонацию и удержание контакта в живом разговоре."
  ],
  [
    "Можно ли настроить дашборд с теми показателями, которые интересуют нас?",
    "Да. Дашборд можно собрать под ваш управленческий контур: конверсия, запись, доходимость, причины отказов, качество квалификации, эффективность онбординга и другие нужные показатели."
  ],
  [
    "Почему так дорого?",
    "Потому что это не платформа с бездушным ИИ, которая пытается решать вашу проблему по универсальным алгоритмам. За эти деньги вы покупаете экспертизу целой команды, которая точечно настраивает инструменты ИИ под ваши задачи, специфику клиники, реальные звонки, KPI и нужную управленческую логику."
  ]
];

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    rows.push(items.slice(index, index + size));
  }
  return rows;
}

function webBackground(gradient: string, fallback: string): ViewStyle {
  if (Platform.OS === "web") {
    return { backgroundColor: fallback, backgroundImage: gradient } as ViewStyle;
  }
  return { backgroundColor: fallback };
}

function font(size: number, extra?: TextStyle): TextStyle {
  return { fontSize: size, ...(FONT_FAMILY ? { fontFamily: FONT_FAMILY } : null), ...extra };
}

function heroTitleSize(width: number): number {
  if (width <= 760) return 42;
  if (width <= 960) return 52;
  if (width <= 1200) return 68;
  return Math.min(86, Math.round(width * 0.061));
}

function sectionTitleSize(width: number): number {
  if (width <= 760) return 42;
  if (width <= 1100) return 52;
  return Math.min(76, Math.round(width * 0.055));
}

function auditTitleSize(width: number): number {
  if (width <= 760) return 40;
  if (width <= 1100) return 48;
  return 58;
}

function gridColumns(width: number, desktop: number, tablet = 2, mobile = 1): number {
  if (width <= 760) return mobile;
  if (width <= 1100) return tablet;
  return desktop;
}

function setSeoMetadata() {
  if (Platform.OS !== "web" || typeof document === "undefined") {
    return;
  }

  document.documentElement.lang = "ru";
  document.title = "ИИ-тренажер для клиник — Цифровая методология";

  const description =
    "Решение для роста выручки премиальных клиник: аналитика звонков, ИИ-тренажер, оценка компетенций и дашборды.";
  const tags = [
    ["description", description],
    ["og:title", "ИИ-тренажер для клиник — Цифровая методология"],
    ["og:description", description],
    ["og:type", "website"]
  ];

  tags.forEach(([name, content]) => {
    const attr = name.startsWith("og:") ? "property" : "name";
    let node = document.querySelector(`meta[${attr}="${name}"]`);
    if (!node) {
      node = document.createElement("meta");
      node.setAttribute(attr, name);
      document.head.appendChild(node);
    }
    node.setAttribute("content", content);
  });

  if (!document.querySelector('link[href*="fonts.googleapis.com/css2?family=Inter"]')) {
    const preconnectGoogle = document.createElement("link");
    preconnectGoogle.rel = "preconnect";
    preconnectGoogle.href = "https://fonts.googleapis.com";
    document.head.appendChild(preconnectGoogle);

    const preconnectGstatic = document.createElement("link");
    preconnectGstatic.rel = "preconnect";
    preconnectGstatic.href = "https://fonts.gstatic.com";
    preconnectGstatic.crossOrigin = "anonymous";
    document.head.appendChild(preconnectGstatic);

    const font = document.createElement("link");
    font.rel = "stylesheet";
    font.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap";
    document.head.appendChild(font);
  }

  if (!document.getElementById("hero-title-wrap-fix")) {
    const style = document.createElement("style");
    style.id = "hero-title-wrap-fix";
    style.textContent =
      "#heroTitle,#heroTitle *{overflow-wrap:normal!important;word-break:keep-all!important;word-wrap:normal!important;hyphens:none!important}";
    document.head.appendChild(style);
  }
}

function AnchorButton({
  children,
  onPress,
  tone = "primary",
  fullWidth = false,
  disabled = false
}: {
  children: ReactNode;
  onPress: () => void;
  tone?: "primary" | "lime" | "ghost";
  fullWidth?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        tone === "primary" && styles.btnPrimary,
        tone === "lime" && styles.btnLime,
        tone === "ghost" && styles.btnGhost,
        fullWidth && styles.fullWidth,
        pressed && styles.pressed,
        disabled && styles.btnDisabled
      ]}
    >
      <Text style={[styles.btnText, tone === "primary" ? styles.btnTextLight : styles.btnTextNavy]}>{children}</Text>
    </Pressable>
  );
}

function LogoMark() {
  return (
    <View style={styles.mark}>
      <View style={[styles.markStripe, styles.markStripeTop]} />
      <View style={[styles.markStripe, styles.markStripeBottom]} />
    </View>
  );
}

function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <View style={styles.logo}>
      <LogoMark />
      <Text style={[styles.logoText, dark && styles.logoTextDark]}>цифровая{"\n"}методология</Text>
    </View>
  );
}

function FooterBrandLogo() {
  return (
    <View style={styles.footerLogo}>
      <LogoMark />
      <View>
        <Text style={styles.footerLogoSmall}>Цифровая</Text>
        <Text style={styles.footerLogoStrong}>Методология</Text>
      </View>
    </View>
  );
}

function Eyebrow({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <View style={[styles.eyebrow, dark && styles.eyebrowDark]}>
      <View style={styles.eyebrowDot} />
      <Text style={[styles.eyebrowText, dark && styles.eyebrowTextDark]}>{children}</Text>
    </View>
  );
}

function Reveal({
  children,
  delay = 0,
  distance = 24,
  style
}: {
  children: ReactNode;
  delay?: number;
  distance?: number;
  style?: object;
}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 760,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true
    }).start();
  }, [delay, progress]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [distance, 0]
              })
            }
          ]
        }
      ]}
    >
      {children}
    </Animated.View>
  );
}

export function LandingScreen({ onOpenAudit }: LandingScreenProps) {
  const layout = useResponsiveLayout();
  const scrollRef = useRef<ScrollView>(null);
  const heroFloat = useRef(new Animated.Value(0)).current;
  const sectionOffsets = useRef<Partial<Record<SectionId, number>>>({});
  const [activeProblem, setActiveProblem] = useState(0);
  const [openFaq, setOpenFaq] = useState<Record<number, boolean>>({ 0: true });
  const [signupSubmitted, setSignupSubmitted] = useState(false);
  const [auditForm, setAuditForm] = useState({ name: "", clinic: "", contact: "" });
  const [auditStatus, setAuditStatus] = useState<"idle" | "sending" | "error">("idle");
  const [auditError, setAuditError] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  async function handleAuditSubmit() {
    if (auditStatus === "sending") {
      return;
    }
    const name = auditForm.name.trim();
    const contact = auditForm.contact.trim();
    if (!name || !contact) {
      setAuditError("Укажите имя и контакт, чтобы мы могли связаться.");
      setAuditStatus("error");
      return;
    }

    setAuditStatus("sending");
    setAuditError(null);
    try {
      await leadService.submitAuditLead({
        name,
        clinic: auditForm.clinic.trim() || null,
        contact,
        source: "landing_audit_form"
      });
      // Заявка сохранена — ведём пользователя в сам аудит.
      setAuditStatus("idle");
      onOpenAudit();
    } catch (error) {
      setAuditStatus("error");
      setAuditError(
        error instanceof Error
          ? "Не удалось отправить заявку. Проверьте соединение и попробуйте ещё раз."
          : "Не удалось отправить заявку."
      );
    }
  }

  const isMobile = layout.width <= 760;
  const isTablet = layout.width <= 1100;
  const isNarrow = layout.width <= 600;
  const cloudColumns = 3;
  const compareColumns = gridColumns(layout.width, 4, 2, 1);
  const priceColumns = isNarrow ? 1 : isTablet ? 2 : 4;
  const dialogColumns = gridColumns(layout.width, 3, 2, 1);
  const blogColumns = gridColumns(layout.width, 3, 2, 1);
  const heroTitleFontSize = heroTitleSize(layout.width);
  const sectionTitleFontSize = sectionTitleSize(layout.width);
  const auditHeadingSize = auditTitleSize(layout.width);
  const cloudGap = isMobile ? 10 : 16;
  const cloudInnerPad = isMobile ? 16 : 24;
  const cloudAvail = layout.width - 2 * (isMobile ? 18 : 24) - 2 * cloudInnerPad;
  const cloudDiamondSize = Math.max(92, Math.min(170, Math.floor((cloudAvail - 2 * cloudGap) / 3)));
  const cloudFontSize = cloudDiamondSize >= 150 ? 16 : cloudDiamondSize >= 120 ? 13 : 11;
  const sectionPadding = isMobile ? 66 : 86;

  const containerStyle = useMemo(
    () => [styles.container, { paddingHorizontal: isMobile ? 18 : 24 }],
    [isMobile]
  );

  const cloudRows = useMemo(() => chunk(CLOUD_PROBLEMS, cloudColumns), [cloudColumns]);

  useEffect(setSeoMetadata, []);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(heroFloat, {
          toValue: 1,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        }),
        Animated.timing(heroFloat, {
          toValue: 0,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        })
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [heroFloat]);

  function register(id: SectionId) {
    return (event: LayoutChangeEvent) => {
      sectionOffsets.current[id] = event.nativeEvent.layout.y;
    };
  }

  function scrollTo(id: SectionId) {
    const y = sectionOffsets.current[id] ?? 0;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - 72), animated: true });
  }

  function openExternal(url: string) {
    void Linking.openURL(url);
  }

  function openCase(file: string) {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.open(`${window.location.origin}/${file}`, "_blank", "noopener");
      return;
    }
    void Linking.openURL(file);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView ref={scrollRef} stickyHeaderIndices={[0]} showsVerticalScrollIndicator={false}>
        <View style={styles.nav}>
          <View style={[containerStyle, styles.navIn, isMobile && styles.navInMobile]}>
            <Logo />
            {!isMobile ? (
              <View style={styles.links}>
                {NAV_LINKS.map((link) => (
                  <Pressable key={link.id} onPress={() => scrollTo(link.id)}>
                    <Text style={styles.navLink}>{link.label}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            <AnchorButton onPress={() => scrollTo("contact")}>Обсудить внедрение</AnchorButton>
          </View>
        </View>

        <View style={[styles.hero, webBackground("linear-gradient(180deg, #ffffff 0%, #f8fbef 100%)", "#f8fbef"), isMobile && styles.heroMobile]}>
          <View style={containerStyle}>
            <View style={[styles.heroGrid, isTablet && styles.oneColumn]}>
              <Reveal style={isTablet ? styles.heroCopyStacked : styles.heroCopy}>
                <View>
                  <Text
                    nativeID="heroTitle"
                    style={[
                      styles.heroTitle,
                      font(heroTitleFontSize, {
                        lineHeight: Math.round(heroTitleFontSize * 0.92),
                        letterSpacing: heroTitleFontSize * -0.025
                      })
                    ]}
                  >
                    {"Решение для роста выручки\n"}
                    <Text style={styles.heroAccent}>{"премиальных клиник"}</Text>
                  </Text>
                  <Text style={[styles.heroText, isMobile && styles.heroTextMobile]}>
                    Повышаем конверсию и качество клиентского потока за счет внедрения аналитики и изменения действий
                    администраторов.
                  </Text>
                  <View style={styles.heroActions}>
                    <AnchorButton onPress={() => scrollTo("contact")}>Обсудить внедрение</AnchorButton>
                  </View>
                </View>
              </Reveal>
              <Reveal delay={120} distance={18} style={isTablet ? styles.heroPanelWrapStacked : styles.heroPanelWrap}>
                <Animated.View
                  style={[
                    styles.heroPanel,
                    isMobile && styles.heroPanelMobile,
                    !isMobile && {
                      transform: [
                        {
                          translateY: heroFloat.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, -8]
                          })
                        }
                      ]
                    }
                  ]}
                >
                  <View style={[styles.decorSquare, styles.decorSquareTop]} />
                  <View style={[styles.decorSquare, styles.decorSquareBottom]} />
                  <Text style={styles.heroBadge}>Как работает контур развития</Text>
                  <View style={styles.heroFlow}>
                    {HERO_FLOW.map(([title, text], index) => (
                      <Reveal key={title} delay={220 + index * 90} distance={12}>
                        <View style={styles.flowStep}>
                        <Text style={styles.flowTitle}>{title}</Text>
                        <Text style={styles.flowText}>{text}</Text>
                        </View>
                      </Reveal>
                    ))}
                  </View>
                </Animated.View>
              </Reveal>
            </View>
            <View style={[styles.stats, isTablet && styles.statsTablet, isMobile && styles.oneColumn]}>
              {STATS.map(([value, label], index) => (
                <Reveal key={value} delay={360 + index * 80} distance={16} style={[styles.stat, isMobile && styles.statMobile]}>
                  <Text style={[styles.statTop, isMobile && styles.statTopMobile]}>{value}</Text>
                  <Text style={[styles.statBottom, isMobile && styles.statBottomMobile]}>{label}</Text>
                </Reveal>
              ))}
            </View>
          </View>
        </View>

        <Section id="about" register={register} containerStyle={containerStyle} sectionPadding={sectionPadding}>
          <Eyebrow>Диагностика ситуации</Eyebrow>
          <Text
            style={[
              styles.title,
              font(sectionTitleFontSize, {
                lineHeight: Math.round(sectionTitleFontSize * 0.93),
                letterSpacing: sectionTitleFontSize * -0.025
              })
            ]}
          >
            Облако проблем из ромбов
          </Text>
          <Text style={styles.sub}>
            Каждый ромб — типовая зона потерь, которая мешает клинике конвертировать входящий поток в запись,
            консультацию и операцию. Нажмите на любой ромб — справа откроется пояснение, как именно эта проблема влияет
            на выручку, конверсию и скорость выхода администратора на план.
          </Text>
          <View style={[styles.problemCloud, layout.width <= 900 && styles.oneColumn]}>
            <View style={[styles.cloudGrid, { padding: cloudInnerPad, gap: cloudGap }, layout.width <= 900 && styles.stackChild, webBackground("linear-gradient(180deg, #f7f8ff 0%, #f0f2ff 100%)", "#f0f2ff")]}>
              {cloudRows.map((row, rowIndex) => (
                <View key={`cloud-row-${rowIndex}`} style={[styles.cloudRow, { gap: cloudGap }]}>
                  {row.map((item) => {
                    const index = CLOUD_PROBLEMS.indexOf(item);
                    return (
                      <Pressable
                        key={item.title}
                        onPress={() => setActiveProblem(index)}
                        style={({ pressed }) => [
                          styles.cloudDiamond,
                          { width: cloudDiamondSize, height: cloudDiamondSize, borderRadius: isNarrow ? 24 : 28 },
                          activeProblem === index && styles.cloudDiamondActive,
                          pressed && styles.cloudDiamondPressed
                        ]}
                      >
                        <Text
                          style={[
                            styles.cloudDiamondText,
                            { maxWidth: cloudDiamondSize * 0.92, fontSize: cloudFontSize, lineHeight: cloudFontSize + 2 },
                            activeProblem === index && styles.cloudDiamondTextActive
                          ]}
                        >
                          {item.title}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
            <View style={[styles.cloudPanel, layout.width <= 900 && styles.cloudPanelMobile]}>
              <Text style={styles.cloudTitle}>{CLOUD_PROBLEMS[activeProblem].title}</Text>
              <Text style={styles.cloudText}>{CLOUD_PROBLEMS[activeProblem].text}</Text>
              <View style={styles.cloudPoints}>
                {CLOUD_PROBLEMS[activeProblem].points.map((point) => (
                  <Text key={point} style={[styles.cloudPoint, layout.width <= 900 && styles.cloudPointMobile]}>{point}</Text>
                ))}
              </View>
            </View>
          </View>
        </Section>

        <Section
          id="compare"
          register={register}
          containerStyle={containerStyle}
          sectionPadding={sectionPadding}
          style={[styles.compareSection, webBackground("linear-gradient(180deg, #ffffff 0%, #f8fbef 100%)", "#f8fbef")]}
        >
          <Eyebrow>Сравнение решений</Eyebrow>
          <Text
            style={[
              styles.title,
              font(sectionTitleFontSize, {
                lineHeight: Math.round(sectionTitleFontSize * 0.93),
                letterSpacing: sectionTitleFontSize * -0.025
              })
            ]}
          >
            Почему ИИ-тренажер выгоднее альтернатив
          </Text>
          <Text style={styles.sub}>
            Сравниваем решения по одинаковым параметрам. Здесь важно не только сколько стоит вход, но и что именно
            получает клиника в результате.
          </Text>
          <View
            style={[
              styles.compareGrid,
              compareColumns === 1 && styles.oneColumn,
              compareColumns === 2 && styles.compareGridTwo,
              compareColumns === 4 && styles.compareGridFour
            ]}
          >
            {COMPARE_CARDS.map((card, index) => (
              <Reveal
                key={card.name}
                delay={index * 90}
                distance={20}
                style={[
                  styles.compareCard,
                  card.featured && styles.compareCardMain,
                  compareColumns === 1 && styles.stackChild,
                  compareColumns === 2 && styles.compareCardHalf,
                  compareColumns === 4 && (card.featured ? styles.compareCardFeaturedCol : styles.compareCardCol)
                ]}
              >
                <View style={[styles.compareHeader, compareColumns === 1 && styles.mhAuto]}>
                  {card.featured ? <Text style={styles.recommend}>Рекомендуем</Text> : null}
                  <Text style={[styles.compareName, compareColumns === 1 && styles.mhAuto, card.featured && styles.lightText, card.featured && styles.compareNameFeatured]}>
                    {card.name}
                  </Text>
                  <View style={[styles.comparePriceSlot, compareColumns === 1 && styles.mhAuto]}>
                    <View>
                      <Text style={[styles.comparePrice, card.featured && styles.lightText]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{card.price}</Text>
                      <Text style={[styles.comparePriceNote, compareColumns === 1 && styles.mhAuto, card.featured && styles.lightText]} numberOfLines={2}>{card.priceNote}</Text>
                    </View>
                    {card.extraPrice ? (
                      <View style={{ marginTop: 8 }}>
                        <Text style={[styles.comparePrice, styles.comparePriceSmall, styles.lightText]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{card.extraPrice}</Text>
                        <Text style={[styles.comparePriceNote, styles.lightText]} numberOfLines={2}>{card.extraNote}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={[styles.compareSub, compareColumns === 1 && styles.mhAuto, card.featured && styles.compareSubMain, card.featured && styles.compareSubGreen]}>
                    {card.sub}
                  </Text>
                </View>
                <View style={styles.paramList}>
                  {card.params.map((param) => (
                    <View key={param.label} style={[styles.param, compareColumns === 1 && styles.mhAuto, card.featured && styles.paramMain]}>
                      <Text style={[styles.paramLabel, card.featured && styles.paramLabelMain]}>{param.label}</Text>
                      <Text
                        style={[
                          styles.paramValue,
                          card.featured && styles.lightText,
                          param.tone === "green" && styles.green,
                          param.tone === "red" && styles.red
                        ]}
                      >
                        {param.value}
                      </Text>
                    </View>
                  ))}
                </View>
              </Reveal>
            ))}
          </View>
        </Section>

        <Section id="trainer" register={register} containerStyle={containerStyle} sectionPadding={sectionPadding}>
          <Eyebrow>Точечная прокачка навыков</Eyebrow>
          <Text
            style={[
              styles.title,
              font(sectionTitleFontSize, {
                lineHeight: Math.round(sectionTitleFontSize * 0.93),
                letterSpacing: sectionTitleFontSize * -0.025
              })
            ]}
          >
            Как выглядит отработка сценариев
          </Text>
          <Text style={styles.sub}>
            Тренажер учит не «правильным фразам из скрипта», а живому разговору администратора с пациентом. Ниже —
            примеры более человечной логики ответов.
          </Text>
          <View
            style={[
              styles.compactGrid,
              dialogColumns === 1 && styles.oneColumn,
              dialogColumns === 2 && styles.threeColWrap,
              dialogColumns === 3 && styles.compactGridThree
            ]}
          >
            {COMPACT_CARDS.map(([title, text], index) => (
              <Reveal
                key={title}
                delay={index * 80}
                distance={16}
                style={[styles.compactCard, dialogColumns === 1 && styles.stackChild, dialogColumns === 1 && styles.mhAuto, dialogColumns === 3 && styles.compactCardThird, dialogColumns === 2 && styles.compactCardHalf]}
              >
                <Text style={styles.compactTitle}>{title}</Text>
                <Text style={styles.cardText}>{text}</Text>
              </Reveal>
            ))}
          </View>
          <View
            style={[
              styles.dialogs,
              dialogColumns === 1 && styles.oneColumn,
              dialogColumns === 2 && styles.threeColWrap,
              dialogColumns === 3 && styles.dialogsThree
            ]}
          >
            {DIALOGS.map((dialog, index) => (
              <Reveal
                key={dialog.title}
                delay={index * 90}
                distance={18}
                style={[styles.dialogCard, dialogColumns === 1 && styles.stackChild, dialogColumns === 3 && styles.dialogCardThird, dialogColumns === 2 && styles.dialogCardHalf]}
              >
                <Text style={[styles.dialogTitle, dialogColumns === 1 && styles.mhAuto]}>{dialog.title}</Text>
                <View style={styles.phone}>
                  {dialog.messages.map(([role, text], index) => (
                    <Text key={`${role}-${index}`} style={[styles.bubble, role === "user" ? styles.userBubble : styles.aiBubble]}>
                      {text}
                    </Text>
                  ))}
                  <Text style={styles.score}>{dialog.score}</Text>
                </View>
              </Reveal>
            ))}
          </View>
        </Section>

        <Section id="case" register={register} containerStyle={containerStyle} sectionPadding={sectionPadding}>
          <Eyebrow>Кейсы клиник</Eyebrow>
          <Text
            style={[
              styles.title,
              font(sectionTitleFontSize, {
                lineHeight: Math.round(sectionTitleFontSize * 0.93),
                letterSpacing: sectionTitleFontSize * -0.025
              })
            ]}
          >
            Результаты, которыми мы гордимся
          </Text>
          <Text style={styles.sub}>
            Реальные внедрения в клиниках разного профиля. Нажмите на кейс, чтобы открыть подробный разбор с задачами,
            логикой проекта и цифрами результата.
          </Text>
          <View style={[styles.caseList, isTablet && styles.oneColumn]}>
            {CASES.map((item, index) => (
              <Reveal key={item.id} delay={index * 80} distance={20} style={[styles.caseCardWrap, isTablet && styles.stackChild]}>
                <Pressable
                  onPress={() => openCase(item.file)}
                  style={(state) => [styles.caseCard2, (state as { hovered?: boolean }).hovered && styles.caseCard2Hover]}
                >
                  <View style={styles.caseDecor2} />
                  <View style={styles.caseTopRow}>
                    <Text style={styles.caseTag}>{item.eyebrow}</Text>
                    <Text style={styles.caseRegion}>{item.region}</Text>
                  </View>
                  <Text style={[styles.caseSphere, isTablet && styles.mhAuto]} numberOfLines={2}>{item.sphere}</Text>
                  <Text style={[styles.caseCardTitle, isTablet && styles.mhAuto]} numberOfLines={3}>{item.title}</Text>
                  <Text style={[styles.caseCardSub, isTablet && styles.mhAuto]} numberOfLines={4}>{item.summary}</Text>
                  <View style={styles.caseMetrics}>
                    {item.metrics.map((m) => (
                      <View key={m[1]} style={styles.caseMetric}>
                        <Text style={styles.caseMetricValue} numberOfLines={1}>{m[0]}</Text>
                        <Text style={styles.caseMetricLabel} numberOfLines={2}>{m[1]}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={styles.caseLink}>Открыть кейс →</Text>
                </Pressable>
              </Reveal>
            ))}
          </View>
        </Section>

        <Section
          id="pricing"
          register={register}
          containerStyle={containerStyle}
          sectionPadding={sectionPadding}
          style={[styles.pricingSection, webBackground("linear-gradient(180deg, #ffffff 0%, #f6f9ff 100%)", "#f6f9ff")]}
        >
          <Eyebrow>Цены</Eyebrow>
          <Text
            style={[
              styles.title,
              font(sectionTitleFontSize, {
                lineHeight: Math.round(sectionTitleFontSize * 0.93),
                letterSpacing: sectionTitleFontSize * -0.025
              })
            ]}
          >
            Сценарии внедрения и стоимость
          </Text>
          <Text style={styles.sub}>
            Можно запускать отдельные модули или собирать полный контур. Ниже — обновленная структура стоимости по
            каждому варианту.
          </Text>
          <View
            style={[
              styles.priceGrid,
              priceColumns === 1 && styles.oneColumn,
              priceColumns === 2 && styles.priceGridTwo,
              priceColumns === 4 && styles.priceGridFour
            ]}
          >
            {PRICES.map(([label, title, price, sub, text], index) => (
              <View
                key={title}
                style={[
                  styles.priceCard,
                  index === 3 && styles.priceCardFeatured,
                  priceColumns === 1 && styles.stackChild,
                  priceColumns === 2 && styles.priceCardHalf,
                  priceColumns === 4 && styles.priceCardQuarter
                ]}
              >
                {index === 3 ? <Text style={styles.priceBadge}>Лучший сценарий</Text> : null}
                <Text style={[styles.priceLabel, index === 3 && styles.priceLabelFeatured]}>{label}</Text>
                <Text style={[styles.priceTitle, priceColumns === 1 && styles.mhAuto, index === 3 && styles.priceTitleFeatured, index === 3 && styles.lightText]}>{title}</Text>
                <Text style={[styles.priceMain, index === 3 && styles.lightText]}>{price}</Text>
                <Text style={[styles.priceSub, index === 3 && styles.lightText]}>{sub}</Text>
                <Text style={[styles.priceText, index === 3 && styles.lightText]}>{text}</Text>
              </View>
            ))}
          </View>
        </Section>

        <Section id="contact" register={register} containerStyle={containerStyle} sectionPadding={sectionPadding}>
          <View style={[styles.audit, webBackground(`linear-gradient(135deg, ${NAVY} 0%, #202c95 100%)`, NAVY)]}>
            <View style={[styles.auditGrid, isTablet && styles.oneColumn]}>
              <View style={[styles.auditCopy, isTablet && styles.stackChild]}>
                <Eyebrow dark>Аудит потерь клиники</Eyebrow>
                <Text
                  style={[
                    styles.auditTitle,
                    font(auditHeadingSize, {
                      lineHeight: Math.round(auditHeadingSize * 0.92),
                      letterSpacing: auditHeadingSize * -0.025
                    })
                  ]}
                >
                  Оцените потери клиники — пройдите бесплатный аудит
                </Text>
                <Text style={styles.auditText}>
                  Это быстрый способ для собственника или главного врача увидеть, где команда уже сегодня теряет деньги
                  на уровне звонков, записи, квалификации пациента и фиксации следующего шага.
                </Text>
                <Text style={styles.auditText}>
                  По итогам аудита вы поймете, на каком участке воронки теряется выручка, какие навыки администраторов
                  влияют на это сильнее всего и какие управленческие действия дадут самый быстрый эффект.
                </Text>
              </View>
              <View style={[styles.auditFormCol, !isTablet && styles.auditFormColDesktop, isTablet && styles.stackChild]}>
                <View style={styles.form}>
                  <TextInput value={auditForm.name} onChangeText={(name) => setAuditForm((v) => ({ ...v, name }))} placeholder="Имя" placeholderTextColor="#60688d" style={styles.input} />
                  <TextInput value={auditForm.clinic} onChangeText={(clinic) => setAuditForm((v) => ({ ...v, clinic }))} placeholder="Клиника / должность" placeholderTextColor="#60688d" style={styles.input} />
                  <TextInput value={auditForm.contact} onChangeText={(contact) => setAuditForm((v) => ({ ...v, contact }))} placeholder="Телефон или Telegram" placeholderTextColor="#60688d" style={styles.input} />
                  <AnchorButton tone="lime" fullWidth disabled={auditStatus === "sending"} onPress={handleAuditSubmit}>
                    {auditStatus === "sending" ? "Отправляем…" : "Пройти аудит"}
                  </AnchorButton>
                  {auditStatus === "error" && auditError ? (
                    <Text style={styles.auditFormError}>{auditError}</Text>
                  ) : null}
                </View>
                <View style={styles.auditList}>
                  {[
                    "Покажем, где именно падает конверсия и почему.",
                    "Подсветим, какие ошибки чаще всего совершают администраторы.",
                    "Оценим, во что эти ошибки могут обходиться клинике в выручке.",
                    "Дадим понятный следующий шаг: что внедрять в первую очередь."
                  ].map((item) => (
                    <Text key={item} style={styles.auditBullet}>• {item}</Text>
                  ))}
                </View>
              </View>
            </View>
          </View>
        </Section>

        <Section
          id="blog"
          register={register}
          containerStyle={containerStyle}
          sectionPadding={sectionPadding}
          style={[styles.blogSection, webBackground("linear-gradient(180deg, #ffffff 0%, #f8fbef 100%)", "#f8fbef")]}
        >
          <Eyebrow>Блог</Eyebrow>
          <Text
            style={[
              styles.title,
              font(sectionTitleFontSize, {
                lineHeight: Math.round(sectionTitleFontSize * 0.93),
                letterSpacing: sectionTitleFontSize * -0.025
              })
            ]}
          >
            Разборы, идеи и кейсы по росту выручки клиники
          </Text>
          <Text style={styles.sub}>
            Показываем, как связать качество коммуникации, обучение администраторов и управленческую аналитику с
            реальными деньгами клиники.
          </Text>
          <View
            style={[
              styles.blogGrid,
              blogColumns === 1 && styles.oneColumn,
              blogColumns === 2 && styles.threeColWrap,
              blogColumns === 3 && styles.blogGridThree
            ]}
          >
            {BLOG.map(([meta, title, text, link, target], index) => (
              <Reveal
                key={title}
                delay={index * 90}
                distance={18}
                style={[styles.blogCard, blogColumns === 1 && styles.stackChild, blogColumns === 3 && styles.blogCardThird, blogColumns === 2 && styles.blogCardHalf]}
              >
                <Text style={styles.blogMeta}>{meta}</Text>
                <Text style={[styles.blogTitle, blogColumns === 1 && styles.mhAuto]}>{title}</Text>
                <Text style={[styles.blogText, blogColumns === 1 && styles.mhAuto]}>{text}</Text>
                <Pressable onPress={() => scrollTo(target as SectionId)}>
                  <Text style={styles.blogLink}>{link}</Text>
                </Pressable>
              </Reveal>
            ))}
          </View>
        </Section>

        <Section id="faq" register={register} containerStyle={containerStyle} sectionPadding={30} style={styles.faqSection}>
          <Eyebrow>FAQ</Eyebrow>
          <Text
            style={[
              styles.title,
              font(sectionTitleFontSize, {
                lineHeight: Math.round(sectionTitleFontSize * 0.93),
                letterSpacing: sectionTitleFontSize * -0.025
              })
            ]}
          >
            Частые вопросы
          </Text>
          <View style={styles.faq}>
            {FAQ.map(([question, answer], index) => {
              const opened = Boolean(openFaq[index]);
              return (
                <View key={question} style={styles.faqItem}>
                  <Pressable onPress={() => setOpenFaq((v) => ({ ...v, [index]: !opened }))} style={styles.faqQuestion}>
                    <Text style={styles.faqQuestionText}>{question}</Text>
                    <Text style={styles.faqPlus}>+</Text>
                  </Pressable>
                  {opened ? <Text style={styles.faqAnswer}>{answer}</Text> : null}
                </View>
              );
            })}
          </View>
        </Section>

        <View style={styles.footer}>
          <View style={[containerStyle, styles.footerSignup, layout.width <= 900 && styles.oneColumn]}>
            <View style={[styles.footerSignupCopy, layout.width <= 900 && styles.stackChild]}>
              <Text
                style={[
                  styles.footerSignupTitle,
                  font(layout.width <= 900 ? 32 : 44, { lineHeight: layout.width <= 900 ? 31 : 42, letterSpacing: -1.5 })
                ]}
              >
                Подпишитесь на нашу рассылку
              </Text>
              <Text style={styles.footerSignupText}>Получайте специальные предложения и новости от нас первыми</Text>
            </View>
            <View style={[styles.footerSignupForm, layout.width <= 900 && styles.stackChild]}>
              <View style={[styles.footerForm, isMobile && styles.oneColumn]}>
                <TextInput value={email} onChangeText={setEmail} placeholder="Ваш e-mail" placeholderTextColor="rgba(255,255,255,.45)" style={[styles.footerInput, isMobile && styles.stackChild]} />
                <Pressable onPress={() => setSignupSubmitted(true)} style={[styles.footerButton, isMobile && styles.stackChild]}>
                  <Text style={styles.footerButtonText}>Подписаться</Text>
                </Pressable>
              </View>
              <Text style={styles.footerNote}>
                {signupSubmitted
                  ? "Спасибо, вы подписаны!"
                  : "Нажимая на кнопку, вы даёте согласие на обработку персональных данных и соглашаетесь с политикой конфиденциальности."}
              </Text>
            </View>
          </View>
          <View style={styles.footerDivider} />
          <View style={[containerStyle, styles.footerMain, layout.width <= 900 && styles.oneColumn]}>
            <View style={styles.footerBrand}>
              <FooterBrandLogo />
              <Text style={styles.footerText}>
                Помогаем премиальным клиникам расти через системную аналитику коммуникаций, ИИ‑тренажер для
                администраторов и управленческие решения, связанные с выручкой.
              </Text>
              <Text style={styles.footerLegal}>
                ООО «Цифровая методология». Разработка и внедрение ИИ‑инструментов для медицинских организаций.
              </Text>
            </View>
            <FooterCol title="Разделы" items={[["Облако проблем", "about"], ["Сравнение", "compare"], ["Тренажер", "trainer"], ["Стоимость", "pricing"], ["Блог", "blog"], ["Контакты", "contact"]]} onPress={scrollTo} />
            <View>
              <Text style={styles.footerColTitle}>Контакты</Text>
              <Pressable onPress={() => openExternal("https://t.me/it_selma")}><Text style={styles.footerAccent}>Telegram: @it_selma</Text></Pressable>
              <Pressable onPress={() => openExternal("mailto:info@tsm.ai")}><Text style={styles.footerAccent}>info@tsm.ai</Text></Pressable>
              <Text style={styles.footerColText}>Москва · работаем с клиниками по всей России</Text>
              <Text style={styles.footerColText}>Ежедневно с 10:00 до 19:00</Text>
              <Pressable onPress={onOpenAudit}><Text style={styles.hiddenWorkspace}>Пройти бесплатный аудит</Text></Pressable>
            </View>
          </View>
          <View style={styles.footerDivider} />
          <View style={[containerStyle, styles.footerBottom, isMobile && styles.footerBottomMobile]}>
            <Text style={styles.footerBottomText}>© 2026 Цифровая методология. Все права защищены.</Text>
            <Pressable onPress={() => {}}><Text style={styles.footerBottomLink}>Политика конфиденциальности</Text></Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({
  id,
  register,
  containerStyle,
  style,
  sectionPadding = 86,
  children
}: {
  id: SectionId;
  register: (id: SectionId) => (event: LayoutChangeEvent) => void;
  containerStyle: object;
  style?: object;
  sectionPadding?: number;
  children: ReactNode;
}) {
  return (
    <View onLayout={register(id)} style={[styles.section, { paddingVertical: sectionPadding }, style]}>
      <View style={containerStyle}>{children}</View>
    </View>
  );
}

function FooterCol({
  title,
  items,
  onPress
}: {
  title: string;
  items: Array<[string, string]>;
  onPress: (id: SectionId) => void;
}) {
  return (
    <View>
      <Text style={styles.footerColTitle}>{title}</Text>
      {items.map(([label, id]) => (
        <Pressable key={label} onPress={() => onPress(id as SectionId)}>
          <Text style={styles.footerColLink}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const shadow = {
  shadowColor: NAVY,
  shadowOpacity: 0.12,
  shadowRadius: 40,
  shadowOffset: { width: 0, height: 18 },
  elevation: 8
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: { width: "100%", maxWidth: 1260, alignSelf: "center" },
  nav: {
    zIndex: 50,
    backgroundColor: "rgba(255,255,255,.94)",
    borderBottomWidth: 1,
    borderBottomColor: LINE,
    ...(Platform.OS === "web"
      ? ({ position: "sticky", top: 0, backdropFilter: "blur(14px)" } as object)
      : { position: "relative" })
  },
  navIn: { minHeight: 70, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 20 },
  navInMobile: { minHeight: 62, paddingVertical: 10, gap: 8 },
  logo: { flexDirection: "row", alignItems: "center", gap: 14 },
  mark: { width: 38, height: 38, borderRadius: 12, backgroundColor: NAVY, position: "relative", overflow: "hidden" },
  markStripe: { position: "absolute", height: 9, borderRadius: 20, backgroundColor: LIME, transform: [{ rotate: "-35deg" }] },
  markStripeTop: { width: 28, left: 6, top: 9 },
  markStripeBottom: { width: 22, left: 10, top: 21 },
  logoText: { color: NAVY, fontSize: 14, lineHeight: 14, fontWeight: "900", textTransform: "uppercase", letterSpacing: -0.4 },
  footerLogo: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 16 },
  footerLogoSmall: { color: "rgba(255,255,255,.55)", fontSize: 13, textTransform: "uppercase", letterSpacing: 1.2, fontWeight: "600" },
  footerLogoStrong: { color: "#fff", fontSize: 22, lineHeight: 22, fontWeight: "900" },
  logoTextDark: { color: "#fff" },
  links: { flexDirection: "row", gap: 22 },
  navLink: { color: MUTED, fontSize: 14, fontWeight: "600" },
  btn: { minHeight: 46, paddingVertical: 12, paddingHorizontal: 18, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  btnPrimary: { backgroundColor: NAVY, ...shadow },
  btnLime: { backgroundColor: LIME },
  btnGhost: { backgroundColor: "#fff", borderWidth: 1, borderColor: LINE },
  btnText: { fontWeight: "800", fontSize: 15 },
  btnTextLight: { color: "#fff" },
  btnTextNavy: { color: NAVY },
  fullWidth: { width: "100%" },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
  btnDisabled: { opacity: 0.6 },
  hero: { paddingTop: 82, paddingBottom: 56 },
  heroMobile: { paddingTop: 56, paddingBottom: 44 },
  heroGrid: { display: "flex", flexDirection: "row", gap: 34, alignItems: "center" },
  heroCopy: { flex: 1.24, minWidth: 0 },
  heroPanelWrap: { flex: 0.76, minWidth: 300 },
  heroCopyStacked: { width: "100%" },
  heroPanelWrapStacked: { width: "100%", minWidth: 0 },
  oneColumn: { flexDirection: "column" },
  twoColumns: { flexDirection: "row", flexWrap: "wrap" },
  threeColWrap: { flexDirection: "row", flexWrap: "wrap" },
  heroTitle: { color: NAVY, fontWeight: "900", textTransform: "uppercase", marginBottom: 20 },
  heroAccent: { color: "#86cf00" },
  heroText: { color: MUTED, fontSize: 21, lineHeight: 31, maxWidth: 700, marginBottom: 26 },
  heroTextMobile: { fontSize: 18, lineHeight: 27, marginBottom: 24 },
  heroActions: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  heroPanel: { backgroundColor: NAVY, borderRadius: 30, padding: 22, overflow: "hidden", ...shadow },
  heroPanelMobile: { borderRadius: 28, padding: 20 },
  decorSquare: { position: "absolute", backgroundColor: LIME, transform: [{ rotate: "45deg" }] },
  decorSquareTop: { width: 220, height: 220, right: -100, top: -90 },
  decorSquareBottom: { width: 150, height: 150, left: -70, bottom: -70 },
  heroBadge: { alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,.12)", color: "#fff", paddingVertical: 10, paddingHorizontal: 14, borderRadius: 999, fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1, marginBottom: 20 },
  heroFlow: { gap: 14 },
  flowStep: { backgroundColor: "rgba(255,255,255,.1)", borderWidth: 1, borderColor: "rgba(255,255,255,.12)", borderRadius: 20, paddingVertical: 16, paddingHorizontal: 16 },
  flowTitle: { color: "#fff", fontSize: 22, lineHeight: 23, fontWeight: "900", marginBottom: 8 },
  flowText: { color: "rgba(255,255,255,.8)", fontSize: 14, lineHeight: 20 },
  stats: { flexDirection: "row", gap: 16, marginTop: 28 },
  statsTablet: { flexWrap: "wrap" },
  stat: { flex: 1, minWidth: 220, borderRadius: 22, overflow: "hidden", ...shadow },
  statMobile: { minWidth: 0, width: "100%" },
  statTop: { backgroundColor: NAVY, color: "#fff", paddingVertical: 26, paddingHorizontal: 18, fontSize: 48, lineHeight: 50, fontWeight: "900", textAlign: "center", letterSpacing: -2 },
  statTopMobile: { paddingVertical: 18, fontSize: 42, lineHeight: 44 },
  statBottom: { minHeight: 140, backgroundColor: LIME, color: NAVY, paddingVertical: 22, paddingHorizontal: 18, fontWeight: "700", textAlign: "center", textAlignVertical: "center" },
  statBottomMobile: { minHeight: 84, paddingVertical: 16 },
  section: { overflow: "hidden" },
  compareSection: {},
  pricingSection: {},
  blogSection: {},
  faqSection: {},
  eyebrow: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: "#edf8ce", marginBottom: 18 },
  eyebrowDark: { backgroundColor: "rgba(255,255,255,.12)" },
  eyebrowDot: { width: 8, height: 8, borderRadius: 999, backgroundColor: LIME },
  eyebrowText: { color: NAVY, fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1 },
  eyebrowTextDark: { color: "#fff" },
  title: { color: NAVY, fontWeight: "900", textTransform: "uppercase", marginBottom: 16 },
  sub: { maxWidth: 840, color: MUTED, fontSize: 18, lineHeight: 27, marginBottom: 32 },
  problemCloud: { flexDirection: "row", gap: 28, alignItems: "stretch" },
  cloudGrid: { flex: 1.15, borderWidth: 1, borderColor: LINE, borderRadius: 36, padding: 24, gap: 16 },
  cloudRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 16 },
  cloudDiamond: {
    borderWidth: 1,
    borderColor: "#dfe2f7",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "45deg" }],
    ...(Platform.OS === "web" ? ({ cursor: "pointer", transitionDuration: "180ms", transitionProperty: "transform, box-shadow, background-color" } as object) : null),
    ...shadow
  },
  cloudDiamondPressed: { transform: [{ rotate: "45deg" }, { translateY: -4 }, { scale: 0.98 }] },
  stackChild: { flexGrow: 0, flexShrink: 0, flexBasis: "auto", width: "100%", minWidth: 0 },
  mhAuto: { minHeight: 0 },
  cloudDiamondActive: { backgroundColor: NAVY, borderColor: NAVY },
  cloudDiamondText: { transform: [{ rotate: "-45deg" }], maxWidth: 112, textAlign: "center", color: NAVY, fontSize: 14, lineHeight: 16, fontWeight: "900" },
  cloudDiamondTextMobile: { maxWidth: 98, fontSize: 12, lineHeight: 14 },
  cloudDiamondTextActive: { color: "#fff" },
  cloudPanel: { flex: 0.85, minWidth: 280, backgroundColor: "#fff", borderWidth: 1, borderColor: LINE, borderRadius: 36, padding: 32, ...shadow },
  cloudPanelMobile: { flexGrow: 0, flexShrink: 0, flexBasis: "auto", width: "100%", minWidth: 0, padding: 22, backgroundColor: "#e8edfb", borderColor: "#c9d3f0" },
  cloudPointMobile: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e2e7f7" },
  cloudTitle: { color: NAVY, fontSize: 30, lineHeight: 30, fontWeight: "900", textTransform: "uppercase", marginBottom: 14 },
  cloudText: { color: MUTED, fontSize: 17, lineHeight: 26, marginBottom: 22 },
  cloudPoints: { gap: 14 },
  cloudPoint: { backgroundColor: SOFT_2, borderRadius: 18, paddingVertical: 16, paddingHorizontal: 18, color: NAVY, fontSize: 16, lineHeight: 22, fontWeight: "800" },
  compareGrid: { flexDirection: "row", gap: 16, alignItems: "stretch" },
  compareGridTwo: { flexWrap: "wrap" },
  compareGridFour: { flexWrap: "nowrap" },
  compareCard: { flex: 1, minWidth: 250, backgroundColor: "#fff", borderWidth: 1, borderColor: LINE, borderRadius: 28, padding: 22, ...shadow },
  compareCardHalf: { flexBasis: "48.5%", flexGrow: 1 },
  compareCardCol: { flexBasis: 0, minWidth: 0 },
  compareCardFeaturedCol: { flexBasis: 0, minWidth: 0 },
  compareCardMain: { flex: 1.2, backgroundColor: NAVY },
  compareHeader: { minHeight: 310 },
  recommend: { position: "absolute", right: 18, top: 18, backgroundColor: LIME, color: NAVY, borderRadius: 999, paddingVertical: 9, paddingHorizontal: 12, fontSize: 12, fontWeight: "900", textTransform: "uppercase", zIndex: 2 },
  compareName: { color: TEXT, fontSize: 17, lineHeight: 18, fontWeight: "900", textTransform: "uppercase", marginBottom: 12, minHeight: 56 },
  compareNameFeatured: { paddingRight: 118 },
  lightText: { color: "#fff" },
  comparePriceSlot: { minHeight: 116 },
  comparePrice: { color: TEXT, fontSize: 35, lineHeight: 38, fontWeight: "900", letterSpacing: -0.5, marginBottom: 4 },
  comparePriceSmall: { fontSize: 26, lineHeight: 28, marginTop: 6 },
  comparePriceNote: { fontSize: 16, lineHeight: 20, fontWeight: "800", letterSpacing: 0, minHeight: 40 },
  compareSub: { color: MUTED, fontSize: 14, lineHeight: 20, marginTop: 8, marginBottom: 14, minHeight: 60 },
  compareSubMain: { color: LIME_2, fontWeight: "900" },
  compareSubGreen: { color: LIME_2 },
  paramList: { gap: 10, flex: 1 },
  param: { backgroundColor: SOFT, borderRadius: 16, padding: 14, minHeight: 86, justifyContent: "center" },
  paramMain: { backgroundColor: "rgba(255,255,255,.09)" },
  paramLabel: { color: TEXT, fontSize: 11, textTransform: "uppercase", letterSpacing: 1, opacity: 0.7, fontWeight: "800", marginBottom: 5 },
  paramLabelMain: { color: "rgba(255,255,255,.72)", opacity: 1 },
  paramValue: { color: TEXT, fontSize: 14, lineHeight: 20, fontWeight: "700" },
  green: { color: LIME_2, fontWeight: "900" },
  red: { color: RED, fontWeight: "900" },
  compactGrid: { flexDirection: "row", gap: 20, marginBottom: 20 },
  compactGridThree: { flexWrap: "nowrap" },
  compactCard: { flex: 1, minWidth: 260, backgroundColor: "#fff", borderWidth: 1, borderColor: LINE, borderRadius: 24, padding: 24, minHeight: 158, ...shadow },
  compactCardThird: { flexBasis: 0, minWidth: 0 },
  compactCardHalf: { flexBasis: "48.5%", flexGrow: 1 },
  compactTitle: { color: NAVY, fontSize: 22, lineHeight: 22, fontWeight: "900", textTransform: "uppercase", marginBottom: 10 },
  cardText: { color: MUTED, fontSize: 16, lineHeight: 24 },
  dialogs: { flexDirection: "row", gap: 20 },
  dialogsThree: { flexWrap: "nowrap" },
  dialogCard: { flex: 1, minWidth: 280, backgroundColor: "#fff", borderWidth: 1, borderColor: LINE, borderRadius: 24, padding: 20, alignItems: "stretch", ...shadow },
  dialogCardThird: { flexBasis: 0, minWidth: 0 },
  dialogCardHalf: { flexBasis: "48.5%", flexGrow: 1 },
  dialogTitle: { color: NAVY, fontSize: 18, lineHeight: 22, fontWeight: "900", textTransform: "uppercase", marginBottom: 14, minHeight: 44 },
  phone: { backgroundColor: "#f7f9ff", borderWidth: 1, borderColor: "#e4e8fb", borderRadius: 28, padding: 16, minHeight: 410, flex: 1 },
  bubble: { maxWidth: "88%", paddingVertical: 12, paddingHorizontal: 14, borderRadius: 18, marginBottom: 10, fontSize: 14, lineHeight: 19, fontWeight: "500" },
  userBubble: { backgroundColor: "#fff", borderWidth: 1, borderColor: LINE, color: TEXT, alignSelf: "flex-end", borderTopRightRadius: 8 },
  aiBubble: { backgroundColor: NAVY, color: "#fff", alignSelf: "flex-start", borderTopLeftRadius: 8 },
  score: { alignSelf: "flex-start", marginTop: "auto", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, backgroundColor: "#ecf9cb", color: NAVY, fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  caseCard: { backgroundColor: NAVY, borderRadius: 30, padding: 34, overflow: "hidden", ...shadow },
  caseDecor: { position: "absolute", width: 220, height: 220, backgroundColor: LIME, right: -70, bottom: -80, transform: [{ rotate: "45deg" }] },
  caseGrid: { flexDirection: "row", gap: 26, alignItems: "center" },
  caseCopy: { flex: 1, minWidth: 0 },
  caseTitle: { color: "#fff", fontSize: 46, lineHeight: 43, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0, marginBottom: 14, maxWidth: 720 },
  caseTitleMobile: { fontSize: 36, lineHeight: 35 },
  caseSub: { color: "rgba(255,255,255,.82)", fontSize: 20, lineHeight: 30, marginBottom: 22, maxWidth: 680 },
  casePlaceholder: { flex: 0.9, minHeight: 280, backgroundColor: "rgba(255,255,255,.08)", borderWidth: 1, borderStyle: "dashed", borderColor: "rgba(255,255,255,.28)", borderRadius: 24, padding: 28, alignItems: "center", justifyContent: "center", zIndex: 1 },
  casePlaceholderText: { color: "rgba(255,255,255,.82)", textAlign: "center", fontSize: 20, lineHeight: 28, fontWeight: "700" },
  caseSmall: { opacity: 0.7, fontSize: 14, fontWeight: "600" },
  caseList: { flexDirection: "row", gap: 22, alignItems: "stretch", marginTop: 8 },
  caseCardWrap: { flex: 1, minWidth: 280 },
  caseCard2: {
    flex: 1,
    height: "100%",
    backgroundColor: NAVY,
    borderRadius: 28,
    padding: 28,
    overflow: "hidden",
    ...(Platform.OS === "web" ? ({ cursor: "pointer", transitionDuration: "180ms", transitionProperty: "transform, box-shadow" } as object) : null),
    ...shadow
  },
  caseCard2Hover: { transform: [{ translateY: -6 }] },
  caseDecor2: { position: "absolute", width: 160, height: 160, backgroundColor: LIME, right: -60, top: -70, opacity: 0.9, transform: [{ rotate: "45deg" }] },
  caseTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14, zIndex: 1 },
  caseTag: { color: NAVY, backgroundColor: LIME, fontSize: 11, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1, paddingVertical: 6, paddingHorizontal: 11, borderRadius: 999 },
  caseRegion: { color: "rgba(255,255,255,.7)", fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, zIndex: 1 },
  caseSphere: { color: LIME_2, fontSize: 13, lineHeight: 17, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10, minHeight: 34, zIndex: 1 },
  caseCardTitle: { color: "#fff", fontSize: 22, lineHeight: 27, fontWeight: "900", marginBottom: 12, minHeight: 81, zIndex: 1 },
  caseCardSub: { color: "rgba(255,255,255,.78)", fontSize: 15, lineHeight: 23, marginBottom: 20, minHeight: 92, zIndex: 1 },
  caseMetrics: { flexDirection: "row", gap: 10, marginTop: 4, marginBottom: 20, zIndex: 1 },
  caseMetric: { flex: 1, minHeight: 84, justifyContent: "center", backgroundColor: "rgba(255,255,255,.08)", borderWidth: 1, borderColor: "rgba(255,255,255,.16)", borderRadius: 16, paddingVertical: 12, paddingHorizontal: 10 },
  caseMetricValue: { color: LIME, fontSize: 22, lineHeight: 24, fontWeight: "900", letterSpacing: -0.5 },
  caseMetricLabel: { color: "rgba(255,255,255,.65)", fontSize: 11, lineHeight: 14, fontWeight: "600", marginTop: 4, minHeight: 28 },
  caseLink: { color: "#fff", fontSize: 14, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.5, zIndex: 1 },
  priceGrid: { flexDirection: "row", gap: 20 },
  priceGridTwo: { flexWrap: "wrap" },
  priceGridFour: { flexWrap: "nowrap" },
  priceCard: { flex: 1, minWidth: 250, backgroundColor: "#fff", borderWidth: 1, borderColor: LINE, borderRadius: 26, padding: 24, ...shadow },
  priceCardHalf: { flexBasis: "48.5%", flexGrow: 1 },
  priceCardQuarter: { flexBasis: 0, minWidth: 0 },
  priceCardFeatured: { backgroundColor: NAVY, borderColor: NAVY },
  priceBadge: { position: "absolute", right: 18, top: 18, backgroundColor: LIME, color: NAVY, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  priceLabel: { alignSelf: "flex-start", paddingVertical: 7, paddingHorizontal: 12, borderRadius: 999, backgroundColor: "#edf8ce", color: NAVY, fontSize: 12, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 },
  priceLabelFeatured: { backgroundColor: "rgba(255,255,255,.18)", color: "#fff" },
  priceTitle: { color: NAVY, fontSize: 24, lineHeight: 25, fontWeight: "900", textTransform: "uppercase", marginBottom: 14, minHeight: 56 },
  priceTitleFeatured: { paddingRight: 90 },
  priceMain: { color: NAVY, fontSize: 42, lineHeight: 39, fontWeight: "900", letterSpacing: 0, marginBottom: 6 },
  priceSub: { color: MUTED, fontSize: 20, fontWeight: "800", marginBottom: 16 },
  priceText: { color: MUTED, fontSize: 15, lineHeight: 23 },
  audit: { backgroundColor: "#202c95", borderRadius: 34, padding: 34, ...shadow },
  auditGrid: { flexDirection: "row", gap: 28, alignItems: "flex-start" },
  auditCopy: { flex: 1.05, minWidth: 0 },
  auditTitle: { color: "#fff", fontSize: 52, lineHeight: 49, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0, marginBottom: 18 },
  auditTitleMobile: { fontSize: 40, lineHeight: 37, letterSpacing: 0 },
  auditText: { color: "rgba(255,255,255,.82)", fontSize: 18, lineHeight: 27, marginBottom: 14 },
  auditFormCol: { flex: 0.95, minWidth: 0, gap: 18 },
  auditFormColDesktop: { marginTop: 50 },
  auditList: { paddingLeft: 18 },
  auditBullet: { color: "rgba(255,255,255,.85)", fontSize: 17, lineHeight: 25, marginBottom: 10 },
  form: { backgroundColor: "rgba(255,255,255,.09)", borderWidth: 1, borderColor: "rgba(255,255,255,.14)", borderRadius: 28, padding: 22, gap: 12 },
  input: { width: "100%", minHeight: 56, borderRadius: 14, backgroundColor: "#fff", paddingHorizontal: 18, color: TEXT, fontSize: 16 },
  auditFormError: { color: "#ffb4b4", fontWeight: "700", fontSize: 14, lineHeight: 20 },
  formResult: { color: LIME_2, fontWeight: "800", fontSize: 14, lineHeight: 20 },
  blogGrid: { flexDirection: "row", gap: 20 },
  blogGridThree: { flexWrap: "nowrap" },
  blogCard: { flex: 1, minWidth: 260, backgroundColor: "#fff", borderWidth: 1, borderColor: LINE, borderRadius: 24, padding: 24, ...shadow },
  blogCardThird: { flexBasis: 0, minWidth: 0 },
  blogCardHalf: { flexBasis: "48.5%", flexGrow: 1 },
  blogMeta: { alignSelf: "flex-start", paddingVertical: 7, paddingHorizontal: 12, borderRadius: 999, backgroundColor: "#edf8ce", color: NAVY, fontSize: 12, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 },
  blogTitle: { color: NAVY, fontSize: 22, lineHeight: 23, fontWeight: "900", textTransform: "uppercase", marginBottom: 10, minHeight: 92 },
  blogText: { color: MUTED, fontSize: 15, lineHeight: 23, marginBottom: 16, minHeight: 92 },
  blogLink: { color: NAVY, fontSize: 15, fontWeight: "900" },
  faq: { gap: 16 },
  faqItem: { backgroundColor: "#fff", borderWidth: 1, borderColor: LINE, borderRadius: 20, overflow: "hidden", ...shadow },
  faqQuestion: { paddingVertical: 22, paddingHorizontal: 24, flexDirection: "row", justifyContent: "space-between", gap: 20, alignItems: "center" },
  faqQuestionText: { color: NAVY, fontSize: 20, lineHeight: 26, fontWeight: "800", flex: 1 },
  faqPlus: { color: NAVY, fontSize: 20, fontWeight: "800" },
  faqAnswer: { color: MUTED, fontSize: 17, lineHeight: 26, paddingHorizontal: 24, paddingBottom: 22 },
  footer: { backgroundColor: "#111650", paddingTop: 54 },
  footerSignup: { flexDirection: "row", gap: 40, alignItems: "flex-start", paddingBottom: 40 },
  footerSignupCopy: { flex: 1, minWidth: 0 },
  footerSignupForm: { flex: 1, minWidth: 0 },
  footerSignupTitle: { color: "#fff", fontSize: 44, lineHeight: 42, fontWeight: "900", letterSpacing: 0, marginBottom: 10 },
  footerSignupText: { color: "rgba(255,255,255,.78)", fontSize: 18, lineHeight: 27 },
  footerForm: { flexDirection: "row", gap: 12, marginBottom: 14 },
  footerInput: { flex: 1, minWidth: 0, height: 64, borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,.12)", backgroundColor: "rgba(255,255,255,.06)", paddingHorizontal: 20, color: "#fff", fontSize: 17 },
  footerButton: { height: 64, borderRadius: 16, paddingHorizontal: 28, backgroundColor: LIME, alignItems: "center", justifyContent: "center" },
  footerButtonText: { color: NAVY, fontSize: 16, fontWeight: "900" },
  footerNote: { color: "rgba(255,255,255,.55)", fontSize: 13, lineHeight: 20 },
  footerDivider: { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,.08)" },
  footerMain: { flexDirection: "row", gap: 32, paddingVertical: 36 },
  footerBrand: { flex: 1.5, gap: 14 },
  footerText: { color: "rgba(255,255,255,.78)", fontSize: 15, lineHeight: 24 },
  footerLegal: { color: "rgba(255,255,255,.45)", fontSize: 13, lineHeight: 20 },
  footerColTitle: { color: "#fff", fontSize: 15, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 },
  footerColLink: { color: "rgba(255,255,255,.78)", fontSize: 15, marginBottom: 9 },
  footerColText: { color: "rgba(255,255,255,.6)", fontSize: 15, lineHeight: 22, marginBottom: 9 },
  footerAccent: { color: LIME, fontSize: 15, fontWeight: "700", marginBottom: 9 },
  hiddenWorkspace: { color: "rgba(255,255,255,.35)", fontSize: 13, marginTop: 10 },
  footerBottom: { flexDirection: "row", justifyContent: "space-between", gap: 16, paddingVertical: 18 },
  footerBottomMobile: { flexDirection: "column" },
  footerBottomText: { color: "rgba(255,255,255,.55)", fontSize: 13 },
  footerBottomLink: { color: "rgba(255,255,255,.75)", fontSize: 13 }
});
