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

export interface AuditLeadHandoff {
  name: string;
  clinic?: string | null;
  contact: string;
}

interface LandingScreenProps {
  roleOptions: RoleWorkspaceOption[];
  onOpenAudit: (lead?: AuditLeadHandoff) => void;
}

type SectionId = "about" | "compare" | "trainer" | "case" | "pricing" | "extra" | "contact" | "blog" | "faq" | "footer";

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
  { id: "trainer", label: "О нас" },
  { id: "about", label: "Точки потерь" },
  { id: "case", label: "Кейсы" },
  { id: "pricing", label: "Тарифы" },
  { id: "faq", label: "FAQ" },
  { id: "footer", label: "Контакты" }
];

const HERO_FLOW = [
  ["Анализ звонков", "Понимаем, где команда теряет пациента и на каких этапах срывается следующий шаг"],
  [
    "Сценарии диалогов на базе анализа звонков",
    "Создаем релевантные сценарии обучения не из теории, а из реальных ошибок и паттернов"
  ],
  [
    "Отработка точечных навыков",
    "Тренируем работу с ценой, страхом, сомнениями и фиксацией следующего шага"
  ],
  [
    "Оценка компетенций после обучения",
    "Система показывает, какие навыки усилились и где сотруднику нужна дополнительная практика"
  ],
  [
    "Аналитика",
    "Связываем качество навыков с бизнес-показателями клиники: конверсией, записью, доходимостью и выручкой"
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
    title: "Не видно реальной картины",
    text: "Руководитель видит только итоговые цифры, но не понимает, какое поведение команды привело к ним и где именно точка просадки.",
    points: [
      "Нельзя связать качество диалога с выручкой",
      "Непонятно, кто из команды тянет вниз результат",
      "Сложно прогнозировать рост и окупаемость обучения"
    ]
  },
  {
    title: "Пациенты не доходят до врача",
    text: "Запись есть, но пациент выпадает между касаниями: не подтверждает визит, не доходит до консультации или срывает следующий этап.",
    points: [
      "Нет системы подтверждения и дожима",
      "Не фиксируется следующий шаг после разговора",
      "Клиника теряет теплого пациента после первого контакта"
    ]
  },
  {
    title: "Новый сотрудник долго выходит на результат",
    text: "Онбординг затягивается, потому что он не привязан к реальным сценариям клиники: новый сотрудник долго выходит на стабильную конверсию.",
    points: [
      "План выполняется только через месяцы",
      "Руководитель тратит время на ручное сопровождение",
      "Ошибки повторяются до первой серьезной обратной связи"
    ]
  },
  {
    title: "Нет стандарта обработки клиентов",
    text: "Каждый администратор разговаривает по-своему, из-за чего качество клиентского опыта и конверсия зависят от конкретной смены.",
    points: [
      "Сильные сотрудники вытягивают результат вручную",
      "Слабые сотрудники теряют пациентов на базовых этапах",
      "Нельзя масштабировать лучший подход на всю команду"
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
  ["Методология экспертов продаж", "Внутри системы соединены разные тренерские подходы, чтобы не сводить обучение к одной узкой модели поведения."],
  [
    "Сценарии под клинику",
    "Отдельно настраиваем генерацию сценариев под вашу специализацию, этапы воронки, боли пациентов и типовые возражения."
  ],
  [
    "Связка с KPI",
    "Тренировки и оценка навыков связаны с тем, что реально важно бизнесу: запись, доходимость, следующий шаг и выручка."
  ]
];

const CHAT_DEMO: Array<{ role: "client" | "admin"; text: string; time: string }> = [
  { role: "client", text: "Здравствуйте. Я впервые к вам обращаюсь. Уже несколько дней странное состояние: кружится голова, слабость, иногда сердце как будто сильнее бьётся.", time: "19:56" },
  { role: "admin", text: "Здравствуйте. Понимаю, в такой ситуации легко растеряться. Давайте спокойно разберёмся: я задам несколько вопросов и помогу выбрать разумный первый шаг по записи.", time: "19:56" },
  { role: "client", text: "Я не понимаю, к какому врачу мне нужно. Боюсь записаться не туда и потом ходить по кругу.", time: "19:57" },
  { role: "admin", text: "Понимаю. Когда симптомы разные, особенно важно не выбирать врача наугад, а идти по понятному маршруту.", time: "19:57" },
  { role: "admin", text: "Подскажите, пожалуйста: температура, сильная боль, обмороки или резкое ухудшение у вас были?", time: "19:57" },
  { role: "client", text: "Нет, такого не было. Просто не хочется потерять время и деньги.", time: "19:58" },
  { role: "admin", text: "Это понятное желание. В такой ситуации терапевт — не «лишний врач», а первая точка маршрута. Он соберёт общую картину и при необходимости направит к нужному специалисту.", time: "19:58" },
  { role: "client", text: "Когда вы так объясняете, становится спокойнее.", time: "19:59" }
];

const BLOG = [
  [
    "Материал 01",
    "Почему клиника теряет выручку, даже когда лиды уже пришли",
    "Разбираем, как пациент теряется между первым звонком, записью, консультацией и следующим шагом — и что с этим делать.",
    "Обсудить похожую ситуацию",
    "contact"
  ],
  [
    "Материал 02",
    "Почему обучение администраторов не влияет на деньги",
    "Как связать тренировки команды с конверсией, доходимостью и показателями выручки — а не только с прохождением курса.",
    "Посмотреть механику тренажера",
    "trainer"
  ],
  [
    "Материал 03",
    "Как собственнику увидеть реальную причину просадки воронки",
    "Какие данные нужны руководителю, чтобы принимать решения не по ощущениям, а по фактам из звонков и переписок команды.",
    "Сравнить подходы",
    "pricing"
  ]
];

const EXTRA_SERVICES = [
  [
    "Услуга 01",
    "Аналитика звонков и точек потерь",
    "Разбираем реальные звонки команды, находим, где теряется пациент, и собираем карту проблем под вашу клинику.",
    "Обсудить аудит",
    "contact"
  ],
  [
    "Услуга 02",
    "Внедрение ИИ-тренажёра под клинику",
    "Настраиваем сценарии тренировок на базе ваших звонков, запускаем регулярную практику и оценку компетенций.",
    "Посмотреть механику",
    "trainer"
  ],
  [
    "Услуга 03",
    "Управленческие дашборды и сопровождение",
    "Собираем панель по конверсии, доходимости и выручке и сопровождаем команду до устойчивого результата.",
    "Обсудить внедрение",
    "contact"
  ]
];

interface CaseBlock {
  title: string;
  text: string;
}

interface CaseItem {
  id: string;
  eyebrow: string;
  sphere: string;
  region: string;
  title: string;
  summary: string;
  metrics: string[][];
  cost: string;
  payback: string;
  context: string;
  request: string;
  pointA: CaseBlock[];
  done: CaseBlock[];
  pointB: string;
  results: string[][];
  profits: CaseBlock[];
}

const CASES: CaseItem[] = [
  {
    id: "neuro",
    eyebrow: "Кейс 01",
    sphere: "Нейрохирургия и неврология",
    region: "Казахстан",
    title: "Клиника таламотомии — устранение тремора при болезни Паркинсона",
    summary:
      "Системная диагностика продаж, ИИ-анализ звонков и управленческая аналитика вывели работу команды из «черного ящика» и увеличили выручку клиники на 50%.",
    metrics: [
      ["+50%", "Рост выручки"],
      ["×2", "Конверсия"],
      ["3 мес", "Окупаемость"]
    ],
    cost: "300 – 800 тыс. ₽",
    payback: "3 месяца",
    context:
      "Медицинская экспертиза клиники на очень высоком уровне, пациенты приезжали из Казахстана, России и стран Средней Азии. Несмотря на сильный продукт и устойчивый спрос, выручка росла значительно медленнее потенциала. Проблема была не в маркетинге и не в качестве услуг: CRM велась, звонки принимались, консультации проводились, но вся система работала как «черный ящик».",
    request: "Увеличить выручку",
    pointA: [
      {
        title: "Отдел продаж работал без системы",
        text: "Менеджеры вели пациентов так, как считали нужным: не было единых стандартов общения, правил квалификации лидов, объективной оценки качества звонков и прозрачной аналитики воронки."
      },
      {
        title: "Клиника не понимала, где теряет деньги",
        text: "Непонятно, какой менеджер лучше конвертирует, где пациенты отказываются, какие возражения звучат чаще и какие услуги формируют основной финансовый результат."
      },
      {
        title: "Особенность аудитории осложняла продажи",
        text: "Пациенты с болезнью Паркинсона принимают решение долго. Частые страхи: «А вдруг станет хуже?», «А вдруг не поможет?». Команда не имела инструментов для системной работы с такими опасениями."
      },
      {
        title: "Врачи выполняли функции продавцов",
        text: "Высокочековые операции продавались за счёт личного авторитета хирурга. Это создавало зависимость бизнеса от конкретного врача и ограничивало масштабирование."
      }
    ],
    done: [
      {
        title: "Диагностика и анализ звонков",
        text: "Детальный анализ CRM, входящих звонков и поведения пациентов на всех этапах воронки. Руководство впервые получило оценку работы каждого сотрудника."
      },
      {
        title: "Переупаковка коммуникации",
        text: "Медицинский язык перевели в понятный пациенту формат: вместо описания технологии сотрудники начали говорить о результате лечения и качестве жизни."
      },
      {
        title: "Стандарты и ИИ-инструменты",
        text: "Разработаны стандарты квалификации лидов, работы с возражениями, сопровождения пациента и взаимодействия с родственниками. Введён регулярный анализ звонков."
      },
      {
        title: "Управление",
        text: "Настроена единая аналитическая система. Управление перестало строиться на интуиции и стало основываться на данных."
      }
    ],
    pointB:
      "Клиника получила системно управляемую модель продаж и впервые — прозрачную картину всей воронки. Врачи стали меньше времени тратить на базовые объяснения и больше — на медицину. Продажи перестали зависеть от личных качеств отдельных менеджеров: появилась система, которую можно масштабировать.",
    results: [
      ["×2", "Конверсия из звонка в консультацию"],
      ["+50%", "Рост выручки за 5 месяцев"],
      ["+15%", "К показателю LTV"],
      ["1", "Единый управленческий дашборд"]
    ],
    profits: [
      {
        title: "Данные стали инструментом развития команды",
        text: "ИИ-анализ показал конкретные навыки, требующие развития у каждого сотрудника. Обучение стало точечным и эффективным."
      },
      {
        title: "Проект стал основой для ИИ-тренажёра",
        text: "Анализ показал, что теоретических знаний недостаточно — нужна безопасная среда регулярной практики. Этот вывод стал одним из ключевых факторов разработки тренажёра."
      },
      {
        title: "Хирург перестал быть единственным источником доверия",
        text: "Дорогие операции больше не зависят от того, кому и когда лично перезвонит врач. Механизм доверия воспроизводится системно — через экспресс-консультацию, грамотного администратора и сопровождение пациента на каждом этапе."
      }
    ]
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
      ["×2", "Конверсия"],
      ["+30%", "Рост выручки"],
      ["2 мес", "Окупаемость"]
    ],
    cost: "80 – 1 000 тыс. ₽",
    payback: "2 месяца",
    context:
      "Клиника работает в премиальном сегменте с высоким чеком и длинным циклом принятия решения. Продажи держались не на системе, а на личных контактах хирурга и случайных действиях администраторов. Главное ограничение находилось внутри: команда не умела квалифицировать лидов, не сопровождала пациента по воронке и не была ориентирована на рост выручки.",
    request: "Увеличить выручку",
    pointA: [
      {
        title: "Администраторов подбирали по лояльности, а не по компетенции",
        text: "Системная проблема была встроена в саму структуру найма: не коммерческая компетенция, а личная лояльность."
      },
      {
        title: "Конверсия из звонка в консультацию держалась около 30%",
        text: "Задача администратора сводилась к двум действиям: записать в CRM и отправить список анализов. Никаких стандартов и обучения — только интуиция."
      },
      {
        title: "Пациенты не получали внятного ответа",
        text: "По стоимости, реабилитации и логике следующего шага не было ясности. Высокий чек в эстетике держится на доверии, а значит — на обученной команде, а не на импровизации."
      },
      {
        title: "Повторные визиты и допродажи не были встроены в систему",
        text: "Новый клиент стоит дорого, а повторные визиты и сарафанное радио в премиальной хирургии стоят дороже любой рекламы."
      }
    ],
    done: [
      {
        title: "Диагностика и анализ звонков",
        text: "Разобрали звонки и CRM, чтобы увидеть реальные точки потери пациента и слабые места в команде."
      },
      {
        title: "Замены в команде",
        text: "Оценка компетенций расставила точки над «i»: часть команды оказалась структурно не мотивирована на рост продаж — это вопрос конфликта интересов, а не навыков."
      },
      {
        title: "Обучение",
        text: "Ввели ИИ-тренажёр, медицинский и этический контекст, стандарты деликатной продажи. Администраторы получили не скрипты, а понимание процесса и уверенность."
      },
      {
        title: "Управление",
        text: "Настроили единый управленческий дашборд: финансовый результат каждого администратора, рост среднего чека, конверсии и общий бизнес-результат."
      }
    ],
    pointB:
      "После пересборки команды клиника начала управлять спросом системно. Конверсия выросла, нагрузка на врачей снизилась, а работа с повторными визитами и реабилитацией стала частью стандартного процесса. Доверие пациентов перестало зависеть только от личности хирурга.",
    results: [
      ["×2", "Конверсия из звонка в консультацию"],
      ["+30%", "Рост выручки за 4 месяца"],
      ["+18%", "К показателю LTV"],
      ["1", "Единый управленческий дашборд"]
    ],
    profits: [
      {
        title: "Реабилитация стала продуктом, а не формальностью",
        text: "Администратор, понимающий логику восстановления, продаёт её с аргументом — это открыло денежный поток, которого раньше не существовало."
      },
      {
        title: "Появилось системное сопровождение пациента",
        text: "Стали формировать базу лояльных пациентов с высоким LTV. В премиальной хирургии это важнее стоимости привлечения нового клиента."
      },
      {
        title: "Этика продаж стала конкурентным преимуществом",
        text: "Пациент, которому не давят на болевые точки и не торопят с решением, доверяет. А доверие в эстетической медицине конвертируется в рекомендации, которые невозможно купить за рекламный бюджет."
      },
      {
        title: "Хирург перестал быть единственным источником доверия",
        text: "Дорогие операции больше не зависят от того, кому и когда лично перезвонит врач. Механизм доверия воспроизводится системно — через экспресс-консультацию, грамотного администратора и сопровождение пациента на каждом этапе."
      },
      {
        title: "Кадровая политика пересмотрена на уровне принципа",
        text: "Проект наглядно показал цену решения «нанимаем своих»: потерянная выручка, месяцы дублирования, саботаж внедрений. Лояльность и профессионализм — не синонимы, особенно в медицинских продажах, где у каждого члена команды может быть собственный интерес в результате."
      }
    ]
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
    cost: "100 – 500 тыс. ₽",
    payback: "3 месяца",
    context:
      "До проекта администраторы не участвовали в формировании спроса и старались как можно быстрее перевести разговор на врача. Часть сотрудников сопротивлялась обучению, боялась медицинской тематики. В результате пациенты не понимали ценность услуги, откладывали запись, уходили сравнивать цены и не доходили до приёма. Руководство не понимало, где теряются пациенты.",
    request: "Обеспечить окупаемость оборудования",
    pointA: [
      {
        title: "Сильный продукт не продавал себя сам",
        text: "Современная процедура и качественная экспертиза были, но первичный спрос не превращался в стабильную запись — пациенты не понимали ценность метода сразу."
      },
      {
        title: "Администраторы не были встроены в продажи",
        text: "На звонке сотрудники быстро переводили пациента на врача вместо того, чтобы объяснить процедуру простым языком. Тёплые обращения терялись."
      },
      {
        title: "Пациенту не хватало ясности и уверенности",
        text: "Люди не понимали, чем метод отличается от привычного лечения и почему он безопаснее. Воронка обрывалась ещё до визита."
      },
      {
        title: "Управление спросом шло вслепую",
        text: "Руководство видело факт обращений, но не видело, где они теряются. Без этой картины нельзя было управлять загрузкой оборудования системно."
      }
    ],
    done: [
      {
        title: "Диагностика и анализ звонков",
        text: "Детальный анализ CRM, входящих звонков и поведения пациентов на всех этапах воронки. Выявили реальные причины потери обращений и точки роста."
      },
      {
        title: "Переупаковка коммуникации",
        text: "Медицинский язык перевели в понятный формат: вместо описания технологии сотрудники начали говорить о результате лечения и качестве жизни."
      },
      {
        title: "Стандарты и ИИ-инструменты",
        text: "Разработаны стандарты работы с пациентами, внедрён ИИ-тренажёр для отработки диалогов, добавлен курс по медицинскому контексту."
      },
      {
        title: "Управление",
        text: "Настроена единая аналитическая система: дашборды по конверсии звонков, загрузке оборудования, эффективности администраторов и прогнозу спроса."
      }
    ],
    pointB:
      "Клиника получила управляемую воронку вместо «черного ящика»: стало понятно, где теряются пациенты и что усиливать для роста загрузки оборудования. Загрузка врачей выровнялась, простои сократились, а администраторы начали приводить пациентов и на сопутствующие услуги.",
    results: [
      ["+20%", "Из записи в процедуру"],
      ["+32%", "Рост выручки за 4 месяца"],
      ["+12%", "К показателю LTV"],
      ["1", "Единый управленческий дашборд"]
    ],
    profits: [
      {
        title: "Партнёрства",
        text: "Клиника начала выстраивать партнёрства с внешними врачами и центрами. Оборудование стало точкой притяжения партнёрского потока."
      },
      {
        title: "Планирование и управление",
        text: "Аналитика дала возможность прогнозировать спрос, загрузку оборудования и эффективность отдельных направлений."
      },
      {
        title: "Администраторы стали частью лечебного процесса",
        text: "Сотрудники научились объяснять сложные процедуры простым языком, работать с медицинской терминологией и отвечать на вопросы пациентов ещё до консультации врача."
      },
      {
        title: "Коммуникация стала конкурентным преимуществом",
        text: "Клиника перестала зависеть только от врача как единственного источника информации о лечении. Ценность технологий доносится пациенту на каждом этапе, что сделало спрос более устойчивым и управляемым."
      }
    ]
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
      "#heroTitle,#heroTitle *,#extraTitle,#extraTitle *{overflow-wrap:normal!important;word-break:keep-all!important;word-wrap:normal!important;hyphens:none!important}";
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
  const [activeCase, setActiveCase] = useState<CaseItem | null>(null);
  const [discussOpen, setDiscussOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<Record<number, boolean>>({ 0: true });
  const [auditForm, setAuditForm] = useState({ name: "", clinic: "", contact: "" });
  const [auditStatus, setAuditStatus] = useState<"idle" | "sending" | "error">("idle");
  const [auditError, setAuditError] = useState<string | null>(null);
  function handleAuditSubmit() {
    const name = auditForm.name.trim();
    const contact = auditForm.contact.trim();
    if (!name || !contact) {
      setAuditError("Укажите имя и контакт, чтобы мы могли связаться.");
      setAuditStatus("error");
      return;
    }
    // Заявку НЕ отправляем сразу: данные уходят в сам аудит и записываются в БД
    // только после прохождения (или если человек его бросил / не допрошёл).
    setAuditStatus("idle");
    setAuditError(null);
    onOpenAudit({ name, clinic: auditForm.clinic.trim() || null, contact });
  }

  const isMobile = layout.width <= 760;
  const isTablet = layout.width <= 1100;
  const isNarrow = layout.width <= 600;
  const cloudColumns = 3;
  const compareColumns = gridColumns(layout.width, 4, 2, 1);
  const dialogColumns = gridColumns(layout.width, 3, 2, 1);
  const blogColumns = gridColumns(layout.width, 3, 2, 1);
  const heroTitleFontSize = heroTitleSize(layout.width);
  const sectionTitleFontSize = sectionTitleSize(layout.width);
  const auditHeadingSize = auditTitleSize(layout.width);
  const isCloudStacked = layout.width <= 900;
  const cloudInnerPad = isMobile ? 16 : 24;
  // Реальная ширина грида ромбов: контент ограничен maxWidth контейнера,
  // а на десктопе грид — это доля строки (flex 1.15 из 2, минус gap 28 до панели).
  const cloudContentWidth = Math.min(layout.width, 1260) - 2 * (isMobile ? 18 : 24);
  const cloudGridOuter = isCloudStacked ? cloudContentWidth : (cloudContentWidth - 28) * (1.15 / 2);
  const cloudGridInner = cloudGridOuter - 2 * cloudInnerPad;
  // 3 ромба в ряд. Размер берём из реальной ширины грида с учётом зазоров, смещения рядов
  // и «вылета» углов повёрнутого на 45° квадрата (≈0.414·size), чтобы ничего не выходило за
  // блок ни на десктопе, ни на мобилке. Симметричное смещение рядов в разные стороны даёт
  // «мозаику» без «пляски»; на узких экранах смещение выключаем.
  // gap = 0.414·(1−2r/S) даёт касание углов; при r≈0.26·S это ≈0.20·S.
  const cloudGapFactor = 0.2;
  const cloudOffsetFactor = 0;
  const cloudDenomInner = 3 + 2 * cloudGapFactor + 2 * cloudOffsetFactor;
  const cloudDenomOuter = cloudDenomInner + 0.42;
  const cloudDiamondSize = Math.max(
    84,
    Math.min(230, Math.floor(Math.min(cloudGridInner / cloudDenomInner, cloudGridOuter / cloudDenomOuter)))
  );
  const cloudGap = Math.round(cloudDiamondSize * cloudGapFactor);
  const cloudRadius = Math.round(cloudDiamondSize * 0.26);
  const cloudRowOffset = Math.round(cloudDiamondSize * cloudOffsetFactor);
  const cloudFontSize = cloudDiamondSize >= 175 ? 15 : cloudDiamondSize >= 140 ? 13 : cloudDiamondSize >= 110 ? 12 : 11;
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

  function openCase(item: CaseItem) {
    setActiveCase(item);
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
            <AnchorButton onPress={() => setDiscussOpen(true)}>Обсудить внедрение</AnchorButton>
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
                    <AnchorButton onPress={() => setDiscussOpen(true)}>Обсудить внедрение</AnchorButton>
                    <AnchorButton tone="lime" onPress={() => scrollTo("contact")}>
                      Пройти бесплатный аудит
                    </AnchorButton>
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
                  <Text style={styles.heroBadge}>Как работает наш продукт</Text>
                  <View style={styles.heroFlow}>
                    {HERO_FLOW.map(([title, text], index) => (
                      <Reveal key={title} delay={220 + index * 90} distance={12}>
                        <View style={styles.flowStep}>
                          <View style={styles.flowStepHead}>
                            <Text style={styles.flowNum}>{index + 1}</Text>
                            <Text style={styles.flowTitle}>{title}</Text>
                          </View>
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
          <Eyebrow>Точки потерь</Eyebrow>
          <Text
            style={[
              styles.title,
              font(sectionTitleFontSize, {
                lineHeight: Math.round(sectionTitleFontSize * 0.93),
                letterSpacing: sectionTitleFontSize * -0.025
              })
            ]}
          >
            Почему вы теряете деньги?
          </Text>
          <Text style={styles.sub}>
            Типовые зоны потерь, которые мешают клинике конвертировать входящий поток в запись, консультацию и
            операцию. Нажмите на любой ромб — справа откроется пояснение, как именно эта проблема влияет на выручку,
            конверсию и скорость выхода администратора на план.
          </Text>
          <View style={[styles.problemCloud, layout.width <= 900 && styles.oneColumn]}>
            <View style={[styles.cloudGrid, { padding: cloudInnerPad, gap: cloudGap }, layout.width <= 900 && styles.stackChild, webBackground("linear-gradient(180deg, #f7f8ff 0%, #f0f2ff 100%)", "#f0f2ff")]}>
              {cloudRows.map((row, rowIndex) => (
                <View
                  key={`cloud-row-${rowIndex}`}
                  style={[styles.cloudRow, { gap: cloudGap, transform: [{ translateX: (rowIndex % 2 === 0 ? 1 : -1) * cloudRowOffset }] }]}
                >
                  {row.map((item) => {
                    const index = CLOUD_PROBLEMS.indexOf(item);
                    return (
                      <Pressable
                        key={item.title}
                        onPress={() => setActiveProblem(index)}
                        style={({ pressed }) => [
                          styles.cloudDiamond,
                          { width: cloudDiamondSize, height: cloudDiamondSize, borderRadius: cloudRadius },
                          activeProblem === index && styles.cloudDiamondActive,
                          pressed && styles.cloudDiamondPressed
                        ]}
                      >
                        <Text
                          style={[
                            styles.cloudDiamondText,
                            { maxWidth: cloudDiamondSize * 0.66, fontSize: cloudFontSize, lineHeight: cloudFontSize + 1 },
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
            Как работает AI-тренажер
          </Text>
          <Text style={styles.sub}>
            Тренажер учит не «правильным фразам из скрипта», а живому разговору администратора с пациентом.
          </Text>
          <View style={[styles.trainerRow, isTablet && styles.trainerRowStacked]}>
            <View style={[styles.trainerChatCol, isTablet && styles.stackChild]}>
              <ChatDemo isMobile={isMobile} />
            </View>
            <View style={[styles.trainerCardsCol, !isTablet && styles.trainerCardsColDesktop, isTablet && styles.stackChild]}>
              {COMPACT_CARDS.map(([title, text], index) => (
                <Reveal key={title} delay={index * 80} distance={16} style={[styles.trainerCard, !isTablet && styles.trainerCardDesktop]}>
                  <Text style={styles.compactTitle}>{title}</Text>
                  <Text style={styles.cardText}>{text}</Text>
                </Reveal>
              ))}
            </View>
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
                  onPress={() => openCase(item)}
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
                  <Text style={styles.caseLink}>Открыть кейс</Text>
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
          <Eyebrow>Тарифы</Eyebrow>
          <Text
            style={[
              styles.title,
              font(sectionTitleFontSize, {
                lineHeight: Math.round(sectionTitleFontSize * 0.93),
                letterSpacing: sectionTitleFontSize * -0.025
              })
            ]}
          >
            Стоимость внедрения
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

        <Section
          id="extra"
          register={register}
          containerStyle={containerStyle}
          sectionPadding={sectionPadding}
        >
          <Eyebrow>Доп. услуги</Eyebrow>
          <Text
            nativeID="extraTitle"
            style={[
              styles.title,
              font(sectionTitleFontSize, {
                lineHeight: Math.round(sectionTitleFontSize * 0.93),
                letterSpacing: sectionTitleFontSize * -0.025
              })
            ]}
          >
            Дополнительные услуги
          </Text>
          <Text style={styles.sub}>
            Отдельные направления, которые можно подключить к внедрению под задачи вашей клиники.
          </Text>
          <View
            style={[
              styles.blogGrid,
              blogColumns === 1 && styles.oneColumn,
              blogColumns === 2 && styles.threeColWrap,
              blogColumns === 3 && styles.blogGridThree
            ]}
          >
            {EXTRA_SERVICES.map(([meta, title, text, link, target], index) => (
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

        <Section id="contact" register={register} containerStyle={containerStyle} sectionPadding={sectionPadding}>
          <View style={[styles.audit, isMobile && styles.auditMobile, webBackground(`linear-gradient(135deg, ${NAVY} 0%, #202c95 100%)`, NAVY)]}>
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
                <View style={[styles.form, isMobile && styles.formMobile]}>
                  <TextInput value={auditForm.name} onChangeText={(name) => setAuditForm((v) => ({ ...v, name }))} placeholder="Имя" placeholderTextColor="#60688d" style={styles.input} />
                  <TextInput value={auditForm.clinic} onChangeText={(clinic) => setAuditForm((v) => ({ ...v, clinic }))} placeholder="Клиника / должность" placeholderTextColor="#60688d" style={styles.input} />
                  <TextInput value={auditForm.contact} onChangeText={(contact) => setAuditForm((v) => ({ ...v, contact }))} placeholder="Телефон или Telegram" placeholderTextColor="#60688d" style={styles.input} />
                  <AnchorButton tone="lime" fullWidth onPress={handleAuditSubmit}>
                    Пройти аудит
                  </AnchorButton>
                  {auditStatus === "error" && auditError ? (
                    <Text style={styles.auditFormError}>{auditError}</Text>
                  ) : null}
                </View>
                {!isMobile ? (
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
                ) : null}
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

        <View style={styles.footer} onLayout={register("footer")}>
          <View style={[containerStyle, styles.footerMain, styles.footerMainTop, layout.width <= 900 && styles.oneColumn]}>
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
            <View>
              <Text style={styles.footerColTitle}>Разделы</Text>
              {([["О нас", "trainer"], ["Точки потерь", "about"], ["Кейсы", "case"], ["Тарифы", "pricing"], ["FAQ", "faq"], ["Контакты", "footer"]] as Array<[string, SectionId]>).map(([label, id]) => (
                <Pressable key={label} onPress={() => scrollTo(id)}>
                  <Text style={styles.footerColLink}>{label}</Text>
                </Pressable>
              ))}
              <Pressable onPress={() => {}}>
                <Text style={styles.footerColLink}>Политика конфиденциальности</Text>
              </Pressable>
            </View>
            <View>
              <Text style={styles.footerColTitle}>Контакты</Text>
              <Pressable onPress={() => openExternal("https://t.me/it_selma")}><Text style={styles.footerAccent}>Telegram: @it_selma</Text></Pressable>
              <Pressable onPress={() => openExternal("mailto:info@tsm.ai")}><Text style={styles.footerAccent}>info@tsm.ai</Text></Pressable>
              <Pressable onPress={() => onOpenAudit()}><Text style={styles.hiddenWorkspace}>Пройти бесплатный аудит</Text></Pressable>
            </View>
          </View>
          <View style={styles.footerDivider} />
          <View style={[containerStyle, styles.footerBottom, isMobile && styles.footerBottomMobile]}>
            <Text style={styles.footerBottomText}>© 2026 Цифровая методология. Все права защищены.</Text>
            <Pressable onPress={() => {}}><Text style={styles.footerBottomLink}>Политика конфиденциальности</Text></Pressable>
          </View>
        </View>
      </ScrollView>
      {activeCase ? <CaseModal item={activeCase} onClose={() => setActiveCase(null)} isMobile={isMobile} /> : null}
      {discussOpen ? <DiscussModal onClose={() => setDiscussOpen(false)} isMobile={isMobile} /> : null}
    </SafeAreaView>
  );
}

function DiscussModal({ onClose, isMobile }: { onClose: () => void; isMobile: boolean }) {
  const [form, setForm] = useState({ name: "", clinic: "", contact: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") {
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  async function submit() {
    if (status === "sending") {
      return;
    }
    const name = form.name.trim();
    const contact = form.contact.trim();
    if (!name || !contact) {
      setError("Укажите имя и контакт, чтобы мы могли связаться.");
      setStatus("error");
      return;
    }
    setStatus("sending");
    setError(null);
    try {
      await leadService.submitAuditLead({
        name,
        clinic: form.clinic.trim() || null,
        contact,
        source: "discuss_implementation"
      });
      setStatus("success");
    } catch {
      setStatus("error");
      setError("Не удалось отправить. Проверьте соединение и попробуйте ещё раз.");
    }
  }

  return (
    <View style={styles.modalOverlay}>
      <Pressable style={styles.modalBackdrop} onPress={onClose} />
      <View style={[styles.discussCard, isMobile && styles.discussCardMobile]}>
        <View style={styles.modalHeader}>
          <Text style={styles.discussHeading}>Обсудить внедрение</Text>
          <Pressable onPress={onClose} style={styles.modalClose} accessibilityRole="button">
            <Text style={styles.modalCloseText}>×</Text>
          </Pressable>
        </View>
        <View style={styles.discussBody}>
          {status === "success" ? (
            <View style={styles.discussSuccess}>
              <Text style={styles.discussSuccessTitle}>Заявка принята</Text>
              <Text style={styles.discussSuccessText}>
                Мы свяжемся с вами в ближайшее время, чтобы обсудить внедрение под вашу клинику.
              </Text>
              <AnchorButton fullWidth onPress={onClose}>
                Готово
              </AnchorButton>
            </View>
          ) : (
            <>
              <Text style={styles.discussText}>
                Оставьте контакт — расскажем про сценарий и стоимость внедрения.
              </Text>
              <View style={styles.discussForm}>
                <TextInput value={form.name} onChangeText={(name) => setForm((v) => ({ ...v, name }))} placeholder="Имя" placeholderTextColor="#60688d" style={styles.discussInput} />
                <TextInput value={form.clinic} onChangeText={(clinic) => setForm((v) => ({ ...v, clinic }))} placeholder="Клиника / должность" placeholderTextColor="#60688d" style={styles.discussInput} />
                <TextInput value={form.contact} onChangeText={(contact) => setForm((v) => ({ ...v, contact }))} placeholder="Телефон или Telegram" placeholderTextColor="#60688d" style={styles.discussInput} />
                <AnchorButton tone="lime" fullWidth disabled={status === "sending"} onPress={submit}>
                  {status === "sending" ? "Отправляем…" : "Отправить заявку"}
                </AnchorButton>
                {status === "error" && error ? <Text style={styles.discussError}>{error}</Text> : null}
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

function CaseModal({ item, onClose, isMobile }: { item: CaseItem; onClose: () => void; isMobile: boolean }) {
  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") {
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  return (
    <View style={styles.modalOverlay}>
      <Pressable style={styles.modalBackdrop} onPress={onClose} />
      <View style={[styles.modalCard, isMobile && styles.modalCardMobile]}>
        <View style={[styles.modalHeader, isMobile && styles.modalHeaderMobile]}>
          <View style={styles.modalHeaderText}>
            <Text style={styles.modalTag}>{item.eyebrow}</Text>
            <Text style={styles.modalRegion}>{item.region}</Text>
          </View>
          <Pressable onPress={onClose} style={styles.modalClose} accessibilityRole="button">
            <Text style={styles.modalCloseText}>×</Text>
          </Pressable>
        </View>
        <ScrollView style={styles.modalScroll} contentContainerStyle={[styles.modalScrollContent, isMobile && styles.modalScrollContentMobile]} showsVerticalScrollIndicator={false}>
          <Text style={styles.modalSphere}>{item.sphere}</Text>
          <Text style={[styles.modalTitle, isMobile && styles.modalTitleMobile]}>{item.title}</Text>
          <Text style={styles.modalSummary}>{item.summary}</Text>

          <View style={[styles.modalFacts, isMobile && styles.oneColumn]}>
            <View style={[styles.modalFact, isMobile && styles.stackChild]}>
              <Text style={styles.modalFactLabel}>Стоимость операций</Text>
              <Text style={styles.modalFactValue}>{item.cost}</Text>
            </View>
            <View style={[styles.modalFact, isMobile && styles.stackChild]}>
              <Text style={styles.modalFactLabel}>Срок окупаемости</Text>
              <Text style={styles.modalFactValue}>{item.payback}</Text>
            </View>
            <View style={[styles.modalFact, isMobile && styles.stackChild]}>
              <Text style={styles.modalFactLabel}>Запрос</Text>
              <Text style={styles.modalFactValue}>{item.request}</Text>
            </View>
          </View>

          <Text style={styles.modalSectionTitle}>Контекст</Text>
          <Text style={styles.modalText}>{item.context}</Text>

          <Text style={styles.modalSectionTitle}>Точка А — что мешало</Text>
          {item.pointA.map((block) => (
            <View key={block.title} style={styles.modalBlock}>
              <Text style={styles.modalBlockTitle}>{block.title}</Text>
              <Text style={styles.modalText}>{block.text}</Text>
            </View>
          ))}

          <Text style={styles.modalSectionTitle}>Что было сделано</Text>
          {item.done.map((block) => (
            <View key={block.title} style={styles.modalBlock}>
              <Text style={styles.modalBlockTitle}>{block.title}</Text>
              <Text style={styles.modalText}>{block.text}</Text>
            </View>
          ))}

          <Text style={styles.modalSectionTitle}>Точка Б — что получилось</Text>
          <Text style={styles.modalText}>{item.pointB}</Text>

          <View style={[styles.modalMetrics, isMobile && styles.modalMetricsMobile]}>
            {item.results.map((m) => (
              <View key={m[1]} style={[styles.modalMetric, isMobile && styles.modalMetricMobile]}>
                <Text style={styles.modalMetricValue}>{m[0]}</Text>
                <Text style={styles.modalMetricLabel}>{m[1]}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.modalSectionTitle}>Неочевидные профиты</Text>
          {item.profits.map((block) => (
            <View key={block.title} style={styles.modalBlock}>
              <Text style={styles.modalBlockTitle}>{block.title}</Text>
              <Text style={styles.modalText}>{block.text}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

function ChatDemo({ isMobile }: { isMobile: boolean }) {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const id = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 80);
    return () => clearTimeout(id);
  }, []);

  return (
    <View style={[styles.chatPhone, isMobile && styles.chatPhoneMobile]}>
      <View style={styles.chatHeader}>
        <View style={styles.chatAvatar}>
          <Text style={styles.chatAvatarText}>П</Text>
        </View>
        <View style={styles.chatHeaderText}>
          <Text style={styles.chatName}>Пациент клиники</Text>
          <Text style={styles.chatStatus}>Первичное обращение · запись к врачу</Text>
        </View>
      </View>
      <ScrollView
        ref={scrollRef}
        style={styles.chatScroll}
        contentContainerStyle={styles.chatScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {CHAT_DEMO.map((message, index) => (
          <View
            key={index}
            style={[styles.chatBubble, message.role === "admin" ? styles.chatBubbleAdmin : styles.chatBubbleClient]}
          >
            <Text style={[styles.chatBubbleText, message.role === "admin" && styles.chatBubbleTextAdmin]}>{message.text}</Text>
            <Text style={styles.chatBubbleTime}>{message.time}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.chatComposer}>
        <Text style={styles.chatComposerText}>Напишите сообщение…</Text>
        <View style={styles.chatComposerSend}>
          <Text style={styles.chatComposerSendIcon}>›</Text>
        </View>
      </View>
    </View>
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
  flowStepHead: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  flowNum: { width: 30, height: 30, borderRadius: 999, backgroundColor: LIME, color: NAVY, textAlign: "center", lineHeight: 30, fontSize: 16, fontWeight: "900", overflow: "hidden" },
  flowTitle: { flex: 1, color: "#fff", fontSize: 22, lineHeight: 23, fontWeight: "900" },
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
  cloudGrid: { flex: 1.15, borderWidth: 1, borderColor: LINE, borderRadius: 36, padding: 24, gap: 16, justifyContent: "center" },
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
  caseLinkRow: { flexDirection: "row", alignItems: "center", gap: 10, zIndex: 1 },
  caseLink: { color: "#fff", fontSize: 14, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.5 },
  caseLinkArrow: { width: 30, height: 30, borderRadius: 999, backgroundColor: LIME, alignItems: "center", justifyContent: "center" },
  caseLinkArrowText: { color: NAVY, fontSize: 16, lineHeight: 18, fontWeight: "900" },
  extraLinkRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  extraLinkArrow: { width: 26, height: 26, borderRadius: 999, backgroundColor: "#edf8ce", alignItems: "center", justifyContent: "center" },
  extraLinkArrowText: { color: NAVY, fontSize: 14, lineHeight: 16, fontWeight: "900" },
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
  auditMobile: { padding: 18, borderRadius: 26 },
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
  formMobile: { padding: 14, borderRadius: 22 },
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
  footerBottomLink: { color: "rgba(255,255,255,.75)", fontSize: 13 },
  footerMainTop: { paddingTop: 8 },
  modalOverlay: {
    ...(Platform.OS === "web"
      ? ({ position: "fixed" } as object)
      : { position: "absolute" }),
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    alignItems: "center",
    justifyContent: "center",
    padding: 12
  },
  modalBackdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(10,14,46,.6)" },
  modalCard: {
    width: "100%",
    maxWidth: 760,
    maxHeight: "90%",
    backgroundColor: "#fff",
    borderRadius: 28,
    overflow: "hidden",
    ...shadow
  },
  modalCardMobile: { maxHeight: "94%", borderRadius: 22 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
    backgroundColor: SOFT
  },
  modalHeaderText: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  modalTag: { color: NAVY, backgroundColor: LIME, fontSize: 11, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1, paddingVertical: 6, paddingHorizontal: 11, borderRadius: 999, overflow: "hidden" },
  modalRegion: { color: MUTED, fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 },
  modalClose: { width: 40, height: 40, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: "#fff", borderWidth: 1, borderColor: LINE },
  modalCloseText: { color: NAVY, fontSize: 26, lineHeight: 28, fontWeight: "700" },
  modalScroll: { flexGrow: 0 },
  modalScrollContent: { padding: 28 },
  modalScrollContentMobile: { padding: 16 },
  modalHeaderMobile: { paddingHorizontal: 16 },
  modalSphere: { color: "#86cf00", fontSize: 13, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },
  modalTitle: { color: NAVY, fontSize: 28, lineHeight: 32, fontWeight: "900", marginBottom: 14 },
  modalTitleMobile: { fontSize: 23, lineHeight: 27 },
  modalSummary: { color: MUTED, fontSize: 17, lineHeight: 26, marginBottom: 22 },
  modalFacts: { flexDirection: "row", gap: 12, marginBottom: 26 },
  modalFact: { flex: 1, backgroundColor: SOFT_2, borderRadius: 18, paddingVertical: 16, paddingHorizontal: 16 },
  modalFactLabel: { color: MUTED, fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 },
  modalFactValue: { color: NAVY, fontSize: 18, lineHeight: 22, fontWeight: "900" },
  modalSectionTitle: { color: NAVY, fontSize: 20, lineHeight: 24, fontWeight: "900", textTransform: "uppercase", marginTop: 12, marginBottom: 14 },
  modalText: { color: MUTED, fontSize: 16, lineHeight: 24 },
  modalBlock: { backgroundColor: SOFT, borderWidth: 1, borderColor: LINE, borderRadius: 18, padding: 18, marginBottom: 12 },
  modalBlockTitle: { color: NAVY, fontSize: 16, lineHeight: 21, fontWeight: "900", marginBottom: 8 },
  modalMetrics: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 18, marginBottom: 12 },
  modalMetricsMobile: {},
  modalMetric: { flexGrow: 1, flexBasis: "47%", minWidth: 0, backgroundColor: NAVY, borderRadius: 18, paddingVertical: 18, paddingHorizontal: 18 },
  modalMetricMobile: { flexBasis: "47%" },
  modalMetricValue: { color: LIME, fontSize: 28, lineHeight: 30, fontWeight: "900", letterSpacing: -0.5 },
  modalMetricLabel: { color: "rgba(255,255,255,.72)", fontSize: 13, lineHeight: 18, fontWeight: "600", marginTop: 6 },
  modalQuote: { marginTop: 18, backgroundColor: "#edf8ce", borderRadius: 20, padding: 22 },
  modalQuoteText: { color: NAVY, fontSize: 18, lineHeight: 26, fontWeight: "900", textTransform: "uppercase" },
  discussCard: { width: "100%", maxWidth: 460, backgroundColor: "#fff", borderRadius: 26, overflow: "hidden", ...shadow },
  discussCardMobile: { borderRadius: 22 },
  discussHeading: { color: NAVY, fontSize: 19, lineHeight: 23, fontWeight: "900", textTransform: "uppercase", flex: 1 },
  discussBody: { padding: 24 },
  discussText: { color: MUTED, fontSize: 16, lineHeight: 24, marginBottom: 18 },
  discussForm: { gap: 12 },
  discussInput: { width: "100%", minHeight: 54, borderRadius: 14, backgroundColor: SOFT, borderWidth: 1, borderColor: LINE, paddingHorizontal: 16, color: TEXT, fontSize: 16 },
  discussError: { color: RED, fontWeight: "700", fontSize: 14, lineHeight: 20 },
  discussSuccess: { gap: 14, alignItems: "flex-start" },
  discussSuccessTitle: { color: NAVY, fontSize: 24, lineHeight: 28, fontWeight: "900", textTransform: "uppercase" },
  discussSuccessText: { color: MUTED, fontSize: 16, lineHeight: 24, marginBottom: 4 },
  fab: {
    ...(Platform.OS === "web" ? ({ position: "fixed" } as object) : { position: "absolute" }),
    right: 16,
    bottom: 18,
    zIndex: 90,
    maxWidth: 240,
    backgroundColor: NAVY,
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 18,
    ...shadow
  },
  fabPressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },
  fabTail: { position: "absolute", left: -6, bottom: 9, width: 18, height: 18, backgroundColor: NAVY, transform: [{ rotate: "45deg" }], borderBottomLeftRadius: 5 },
  fabText: { color: "#fff", fontSize: 15, lineHeight: 19, fontWeight: "800" },
  trainerRow: { flexDirection: "row", gap: 24, alignItems: "stretch" },
  trainerRowStacked: { flexDirection: "column-reverse", gap: 18 },
  trainerChatCol: { flex: 1.05, minWidth: 0 },
  trainerCardsCol: { flex: 0.95, minWidth: 0, gap: 16 },
  trainerCardsColDesktop: { height: 560 },
  trainerCard: { backgroundColor: "#fff", borderWidth: 1, borderColor: LINE, borderRadius: 24, padding: 22, ...shadow },
  trainerCardDesktop: { flex: 1, justifyContent: "center" },
  chatPhone: { height: 560, backgroundColor: "#fff", borderWidth: 1, borderColor: LINE, borderRadius: 28, overflow: "hidden", ...shadow },
  chatPhoneMobile: { height: 520 },
  chatHeader: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: "#eef1f8", backgroundColor: "#fff" },
  chatAvatar: { width: 46, height: 46, borderRadius: 999, backgroundColor: NAVY, alignItems: "center", justifyContent: "center" },
  chatAvatarText: { color: "#fff", fontSize: 18, fontWeight: "800" },
  chatHeaderText: { flex: 1, minWidth: 0 },
  chatName: { color: NAVY, fontSize: 17, lineHeight: 21, fontWeight: "900" },
  chatStatus: { color: MUTED, fontSize: 13, lineHeight: 17, marginTop: 2 },
  chatScroll: { flex: 1, backgroundColor: "#fbfcff" },
  chatScrollContent: { padding: 18, gap: 14 },
  chatBubble: { maxWidth: "82%", paddingVertical: 12, paddingHorizontal: 16, borderRadius: 22, borderWidth: 1, borderColor: LINE },
  chatBubbleClient: { alignSelf: "flex-start", backgroundColor: "#fff", borderTopLeftRadius: 8 },
  chatBubbleAdmin: { alignSelf: "flex-end", backgroundColor: SOFT_2, borderTopRightRadius: 8 },
  chatBubbleText: { color: "#10185f", fontSize: 15, lineHeight: 21, fontWeight: "500" },
  chatBubbleTextAdmin: { color: NAVY },
  chatBubbleTime: { alignSelf: "flex-end", color: "#969dbc", fontSize: 11, lineHeight: 13, marginTop: 6 },
  chatComposer: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: "#eef1f8", backgroundColor: "#fff" },
  chatComposerText: { flex: 1, color: "#9aa2c3", fontSize: 15 },
  chatComposerSend: { width: 38, height: 38, borderRadius: 14, borderWidth: 1, borderColor: "#edf0f7", alignItems: "center", justifyContent: "center" },
  chatComposerSendIcon: { color: "#b5bbcf", fontSize: 26, lineHeight: 28, fontWeight: "300" }
});
