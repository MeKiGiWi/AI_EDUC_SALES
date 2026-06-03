import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type TextStyle
} from "react-native";

interface AuditScreenProps {
  onGoToSimulator: () => void;
}

type RoleKey = "ceo" | "doctor";

type Opt = { l: string; h: string; v: number; s: number };
type Question = { key: string; title: string; help: string; opts: Opt[] };

const FONT_FAMILY = Platform.OS === "web" ? "Inter, system-ui, sans-serif" : undefined;

const DATA: Record<RoleKey, Question[]> = {
  ceo: [
    {
      key: "lead",
      title: "Сколько первичных лидов / обращений в месяц получает клиника?",
      help: "Нужен ориентир по новым обращениям из всех каналов.",
      opts: [
        { l: "До 100", h: "Небольшой поток", v: 80, s: 1 },
        { l: "100–300", h: "Средний поток", v: 200, s: 2 },
        { l: "300–700", h: "Высокий поток", v: 500, s: 3 },
        { l: "700+", h: "Очень высокий поток", v: 900, s: 4 }
      ]
    },
    {
      key: "avgCheck",
      title: "Какой средний чек первичного пациента?",
      help: "Берите средний чек первой оплаченной услуги.",
      opts: [
        { l: "До 5 000 ₽", h: "", v: 4000, s: 1 },
        { l: "5 000–10 000 ₽", h: "", v: 7500, s: 2 },
        { l: "10 000–20 000 ₽", h: "", v: 15000, s: 3 },
        { l: "20 000+ ₽", h: "", v: 25000, s: 4 }
      ]
    },
    {
      key: "repeatCheck",
      title: "Какой средний чек повторного визита / следующего этапа лечения?",
      help: "Обычно выше первичного — следующий этап, продолжение лечения.",
      opts: [
        { l: "До 6 000 ₽", h: "", v: 5000, s: 1 },
        { l: "6 000–15 000 ₽", h: "", v: 10000, s: 2 },
        { l: "15 000–35 000 ₽", h: "", v: 22000, s: 3 },
        { l: "35 000+ ₽", h: "", v: 45000, s: 4 }
      ]
    },
    {
      key: "callConv",
      title: "Какая доля обращений доходит до записи?",
      help: "От заявки/звонка до зафиксированной записи.",
      opts: [
        { l: "80%+", h: "Высокая конверсия", v: 0.85, s: 0 },
        { l: "60–79%", h: "Приемлемо", v: 0.7, s: 1 },
        { l: "40–59%", h: "Есть потери на входе", v: 0.5, s: 2 },
        { l: "Ниже 40%", h: "Критично", v: 0.3, s: 3 }
      ]
    },
    {
      key: "showRate",
      title: "Какой процент записанных реально доходит?",
      help: "Показывает качество подтверждений и управления расписанием.",
      opts: [
        { l: "85%+", h: "Хорошая доходимость", v: 0.88, s: 0 },
        { l: "70–84%", h: "Средняя доходимость", v: 0.77, s: 1 },
        { l: "55–69%", h: "Есть no-show потери", v: 0.62, s: 2 },
        { l: "Ниже 55%", h: "Высокий no-show", v: 0.45, s: 3 }
      ]
    },
    {
      key: "planConv",
      title: "Какой процент первичных пациентов покупает план лечения?",
      help: "Насколько врач и администратор переводят первичный приём в лечение.",
      opts: [
        { l: "70%+", h: "Сильная конверсия", v: 0.75, s: 0 },
        { l: "55–69%", h: "Нормально", v: 0.62, s: 1 },
        { l: "40–54%", h: "Есть потери в принятии", v: 0.47, s: 2 },
        { l: "Ниже 40%", h: "Слабое принятие плана", v: 0.3, s: 3 }
      ]
    },
    {
      key: "repeatRate",
      title: "Какой процент пациентов возвращается в течение 6 месяцев?",
      help: "Индикатор удержания и качества маршрута пациента.",
      opts: [
        { l: "65%+", h: "Хорошее удержание", v: 0.68, s: 0 },
        { l: "50–64%", h: "Среднее удержание", v: 0.57, s: 1 },
        { l: "35–49%", h: "Ниже нормы", v: 0.42, s: 2 },
        { l: "Ниже 35%", h: "Высокий отток", v: 0.25, s: 3 }
      ]
    },
    {
      key: "speed",
      title: "Как быстро обрабатываются новые обращения?",
      help: "Среднее время до первого контакта с пациентом.",
      opts: [
        { l: "До 5 минут", h: "Быстрая реакция", v: 0.95, s: 0 },
        { l: "5–30 минут", h: "Приемлемо", v: 0.8, s: 1 },
        { l: "30–120 минут", h: "Пациенты остывают", v: 0.6, s: 2 },
        { l: "Дольше 2 часов", h: "Критические потери", v: 0.4, s: 3 }
      ]
    },
    {
      key: "analytics",
      title: "Есть ли сквозная аналитика по источникам и воронке?",
      help: "Нужна, чтобы видеть, где именно клиника теряет деньги.",
      opts: [
        { l: "Да, по всей воронке", h: "", v: 0.95, s: 0 },
        { l: "Частично", h: "", v: 0.75, s: 1 },
        { l: "Смотрим вручную", h: "", v: 0.55, s: 2 },
        { l: "Нет", h: "", v: 0.35, s: 3 }
      ]
    },
    {
      key: "teamControl",
      title: "Насколько стабильно команда выполняет стандарты записи и подтверждения?",
      help: "Оценка управляемости процессов на уровне администраторов.",
      opts: [
        { l: "Стабильно и по регламенту", h: "", v: 0.92, s: 0 },
        { l: "Есть редкие сбои", h: "", v: 0.78, s: 1 },
        { l: "Часто зависит от смены", h: "", v: 0.58, s: 2 },
        { l: "Система не выстроена", h: "", v: 0.35, s: 3 }
      ]
    }
  ],
  doctor: [
    {
      key: "lead",
      title: "Сколько первичных пациентов в месяц проходит через клинику?",
      help: "Нужен объем потока, с которым работает медчасть.",
      opts: [
        { l: "До 80", h: "Небольшой поток", v: 60, s: 1 },
        { l: "80–200", h: "Средний поток", v: 140, s: 2 },
        { l: "200–500", h: "Высокий поток", v: 320, s: 3 },
        { l: "500+", h: "Очень высокий поток", v: 650, s: 4 }
      ]
    },
    {
      key: "avgCheck",
      title: "Какой средний чек первичного приёма / первого этапа лечения?",
      help: "Используйте среднее значение по ключевым направлениям.",
      opts: [
        { l: "До 4 000 ₽", h: "", v: 3500, s: 1 },
        { l: "4 000–8 000 ₽", h: "", v: 6000, s: 2 },
        { l: "8 000–15 000 ₽", h: "", v: 11000, s: 3 },
        { l: "15 000+ ₽", h: "", v: 18000, s: 4 }
      ]
    },
    {
      key: "repeatCheck",
      title: "Какой средний чек повторного визита или следующего этапа?",
      help: "Обычно выше первичного — продолжение лечения, следующий этап плана.",
      opts: [
        { l: "До 5 000 ₽", h: "", v: 4000, s: 1 },
        { l: "5 000–12 000 ₽", h: "", v: 8000, s: 2 },
        { l: "12 000–25 000 ₽", h: "", v: 17000, s: 3 },
        { l: "25 000+ ₽", h: "", v: 32000, s: 4 }
      ]
    },
    {
      key: "showRate",
      title: "Какой процент записанных пациентов реально приходит?",
      help: "Показывает качество подтверждений и дисциплину маршрута.",
      opts: [
        { l: "85%+", h: "Хорошая доходимость", v: 0.88, s: 0 },
        { l: "70–84%", h: "Средняя доходимость", v: 0.77, s: 1 },
        { l: "55–69%", h: "Есть no-show", v: 0.62, s: 2 },
        { l: "Ниже 55%", h: "Высокий no-show", v: 0.45, s: 3 }
      ]
    },
    {
      key: "planConv",
      title: "Какой процент первичных пациентов соглашается на план лечения?",
      help: "Отражает качество консультации и доверие пациента.",
      opts: [
        { l: "70%+", h: "Сильное принятие", v: 0.75, s: 0 },
        { l: "55–69%", h: "Нормально", v: 0.62, s: 1 },
        { l: "40–54%", h: "Теряем на консультации", v: 0.47, s: 2 },
        { l: "Ниже 40%", h: "Слабое принятие плана", v: 0.3, s: 3 }
      ]
    },
    {
      key: "repeatRate",
      title: "Какой процент пациентов возвращается на следующий этап?",
      help: "Отражает качество маршрута и завершённость лечения.",
      opts: [
        { l: "70%+", h: "Высокий возврат", v: 0.73, s: 0 },
        { l: "55–69%", h: "Средний возврат", v: 0.62, s: 1 },
        { l: "40–54%", h: "Ниже нормы", v: 0.47, s: 2 },
        { l: "Ниже 40%", h: "Высокий отток", v: 0.25, s: 3 }
      ]
    },
    {
      key: "protocol",
      title: "Насколько единый протокол консультации соблюдается всеми врачами?",
      help: "Стандартизация влияет на конверсию в план и удержание.",
      opts: [
        { l: "Есть протокол, соблюдается стабильно", h: "", v: 0.92, s: 0 },
        { l: "Протокол есть, но плавает", h: "", v: 0.75, s: 1 },
        { l: "У каждого врача своя манера", h: "", v: 0.55, s: 2 },
        { l: "Протокола нет", h: "", v: 0.35, s: 3 }
      ]
    },
    {
      key: "followup",
      title: "Как работает система возврата незавершённого лечения?",
      help: "Пациенты с незакрытыми этапами — ваши самые дешёвые повторные продажи.",
      opts: [
        { l: "Системно, с автоматизацией", h: "", v: 0.92, s: 0 },
        { l: "Ручной обзвон есть, нестабильный", h: "", v: 0.72, s: 1 },
        { l: "Редко, по инициативе врача", h: "", v: 0.5, s: 2 },
        { l: "Не делаем", h: "", v: 0.3, s: 3 }
      ]
    },
    {
      key: "adminSync",
      title: "Насколько налажена связка врач–администратор при передаче пациента?",
      help: "Разрыв в передаче — главная причина потери записи после консультации.",
      opts: [
        { l: "Передача происходит прямо в кабинете", h: "", v: 0.93, s: 0 },
        { l: "Передаём, но бывают провалы", h: "", v: 0.75, s: 1 },
        { l: "Пациент сам записывается на выходе", h: "", v: 0.55, s: 2 },
        { l: "Систематической передачи нет", h: "", v: 0.35, s: 3 }
      ]
    },
    {
      key: "nps",
      title: "Как регулярно измеряется качество приёма и обратная связь пациентов?",
      help: "Контроль качества прямо влияет на retention и сарафанное радио.",
      opts: [
        { l: "После каждого визита, автоматически", h: "", v: 0.93, s: 0 },
        { l: "Периодически, вручную", h: "", v: 0.72, s: 1 },
        { l: "Редко, по запросу", h: "", v: 0.5, s: 2 },
        { l: "Не измеряем", h: "", v: 0.3, s: 3 }
      ]
    }
  ]
};

const BM = {
  low: { callConv: 0.78, showRate: 0.82, planConv: 0.65, retCeo: 0.6, retDoc: 0.65 },
  mid: { callConv: 0.82, showRate: 0.85, planConv: 0.72, retCeo: 0.68, retDoc: 0.72 },
  high: { callConv: 0.85, showRate: 0.88, planConv: 0.78, retCeo: 0.75, retDoc: 0.78 },
  prem: { callConv: 0.88, showRate: 0.92, planConv: 0.82, retCeo: 0.82, retDoc: 0.85 }
};
const FLOOR = { callConv: 0.42, showRate: 0.52, planConv: 0.28, repeatRate: 0.22 };
const COEF = 0.4;
const MONTHS_BASE = 6;

type TagClass = "tag-g" | "tag-y" | "tag-r";
type Prob = { icon: string; bold: string; rest: string };
type Rec = { h: string; p: string };
type Result = {
  rsub: string;
  lossM: string;
  lossY: string;
  bNew: string;
  bShow: string;
  bRep: string;
  riskText: string;
  tagClass: TagClass;
  riskDesc: string;
  fmlLeads: number;
  fmlAvg: string;
  fmlRepeat: string;
  fmlBand: string;
  fmlTotal: string;
  probs: Prob[];
  recs: Rec[];
};

function getBM(avg: number) {
  if (avg <= 5000) return BM.low;
  if (avg <= 12000) return BM.mid;
  if (avg <= 30000) return BM.high;
  return BM.prem;
}
function getBandName(avg: number) {
  if (avg <= 5000) return "до 5 000 ₽";
  if (avg <= 12000) return "5 000–12 000 ₽";
  if (avg <= 30000) return "12 000–30 000 ₽";
  return "30 000+ ₽";
}
function fmt(n: number) {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " ₽";
}

function computeResult(role: RoleKey, answers: number[]): Result {
  const qs = DATA[role];
  const map: Record<string, number> = {};
  for (let i = 0; i < qs.length; i++) map[qs[i].key] = qs[i].opts[answers[i]].v;
  let sev = 0;
  for (let i = 0; i < qs.length; i++) sev += qs[i].opts[answers[i]].s || 0;

  const leads = map.lead || 0;
  const avg = map.avgCheck || 0;
  const repeatCheckVal = map.repeatCheck || avg * 1.8;
  const bm = getBM(avg);

  const safeCall = Math.max(map.callConv || 0.6, FLOOR.callConv);
  const safeShow = Math.max(map.showRate || 0.65, FLOOR.showRate);
  const safePlan = Math.max(map.planConv || 0.45, FLOOR.planConv);
  const safeRepeat = Math.max(map.repeatRate || 0.4, FLOOR.repeatRate);

  const idealCall = role === "ceo" ? bm.callConv : bm.showRate;
  const idealShow = bm.showRate;
  const idealPlan = bm.planConv;
  const idealRepeat = role === "ceo" ? bm.retCeo : bm.retDoc;

  const actualBooked = role === "ceo" ? leads * safeCall : leads;
  const actualShown = actualBooked * safeShow;
  const actualPlan = actualShown * safePlan;

  const lossCall = role === "ceo" ? Math.max(0, leads * (idealCall - safeCall)) : 0;
  const lossPlan = Math.max(0, actualShown * (idealPlan - safePlan));
  const newLoss = (lossCall + lossPlan) * avg * COEF;

  const lossShow = Math.max(0, actualBooked * (idealShow - safeShow));
  const showLoss = lossShow * avg * COEF;

  const accumulatedBase = actualPlan * MONTHS_BASE;
  const lossRepeatBase = Math.max(0, accumulatedBase * (idealRepeat - safeRepeat));
  const repeatLoss = (lossRepeatBase * repeatCheckVal * COEF) / MONTHS_BASE;

  const total = newLoss + showLoss + repeatLoss;

  let risk: "green" | "yellow" | "red";
  let riskText: string;
  let riskDesc: string;
  let tagClass: TagClass;
  if (total < 50000 || sev <= 6) {
    risk = "green";
    riskText = "Низкий риск";
    tagClass = "tag-g";
    riskDesc =
      "Система работает, потери в допустимой норме. Задача — закрепить стандарты и масштабировать.";
  } else if (sev >= 18) {
    risk = "red";
    riskText = "Высокий риск";
    tagClass = "tag-r";
    riskDesc =
      "Несколько узких мест работают одновременно. Нужен антикризисный приоритет — каждый месяц промедления стоит " +
      fmt(total) +
      ".";
  } else {
    risk = "yellow";
    riskText = "Средний риск";
    tagClass = "tag-y";
    riskDesc = "1–2 узких места дают основную часть потерь. Устранение даст быстрый результат.";
  }

  const probs: Prob[] = [];
  if (role === "ceo") {
    if ((map.callConv || 1) < 0.65)
      probs.push({
        icon: "📞",
        bold: "Пропущенные звонки:",
        rest: " администраторы не конвертируют звонки в записи. Исправление этой точки даёт возврат без увеличения рекламного бюджета."
      });
    if ((map.callConv || 1) < 0.55)
      probs.push({
        icon: "💬",
        bold: "Возражения:",
        rest: " администраторы не удерживают пациентов, которые «думают»"
      });
    if ((map.showRate || 1) < 0.75)
      probs.push({
        icon: "📅",
        bold: "Запись:",
        rest: " пациентов не записывают сразу — многие не перезванивают сами"
      });
    if ((map.teamControl || 1) < 0.7)
      probs.push({
        icon: "🎧",
        bold: "Контроль:",
        rest: " без прослушивания звонков ошибки накапливаются незаметно"
      });
    if ((map.teamControl || 1) < 0.65)
      probs.push({
        icon: "🎓",
        bold: "Обучение:",
        rest: " без регулярных тренировок навыки продаж деградируют"
      });
    if ((map.analytics || 1) < 0.7)
      probs.push({
        icon: "📊",
        bold: "KPI:",
        rest: " без метрик конверсии невозможно управлять результатом"
      });
  } else {
    if ((map.showRate || 1) < 0.75)
      probs.push({
        icon: "📅",
        bold: "Доходимость:",
        rest: " пациенты записываются, но не приходят — нет системы подтверждений"
      });
    if ((map.planConv || 1) < 0.55)
      probs.push({
        icon: "💬",
        bold: "План лечения:",
        rest: " врачи не закрывают план на первом приёме — пациент «подумает» и уходит"
      });
    if ((map.followup || 1) < 0.65)
      probs.push({
        icon: "🔄",
        bold: "Незавершённое лечение:",
        rest: " пациенты с открытыми этапами не возвращаются — нет системы возврата"
      });
    if ((map.adminSync || 1) < 0.7)
      probs.push({
        icon: "🤝",
        bold: "Передача врач–администратор:",
        rest: " пациент уходит без следующей записи после приёма"
      });
    if ((map.protocol || 1) < 0.7)
      probs.push({
        icon: "📋",
        bold: "Протокол:",
        rest: " каждый врач работает по-своему — нет стандарта консультации"
      });
    if ((map.nps || 1) < 0.65)
      probs.push({
        icon: "⭐",
        bold: "Обратная связь:",
        rest: " без замера качества приёма ошибки накапливаются незаметно"
      });
  }
  if (probs.length === 0)
    probs.push({
      icon: "✅",
      bold: "Критических точек не выявлено",
      rest: " — система работает стабильно. Фокус на масштабировании."
    });

  const recs: Rec[] = [];
  if (risk === "red")
    recs.push({
      h: "Антикризисный штаб — немедленно",
      p: "Раз в неделю смотреть воронку: обращения → запись → доходимость → план → повтор. Назначить ответственного на каждый этап."
    });
  else if (risk === "yellow")
    recs.push({
      h: "Сфокусироваться на 1–2 узких местах",
      p: "Не чинить всё сразу. Сначала убрать самый дорогой провал: запись, доходимость или повторные визиты."
    });
  else
    recs.push({
      h: "Масштабировать сильные практики",
      p: "У вас уже хорошая база. Зафиксируйте стандарты и не потеряйте качество при росте потока."
    });

  const ml = Math.max(newLoss, showLoss, repeatLoss);
  if (ml === repeatLoss && repeatLoss > 5000)
    recs.push({
      h: "Приоритет — возврат повторных пациентов",
      p:
        "Это самый дорогой блок потерь. База за 6 месяцев × чек повторного визита " +
        fmt(repeatCheckVal) +
        " даёт огромный потенциал. Внедрите цикл возврата 7–21–45 дней и систему незавершённого лечения."
    });
  if (ml === newLoss && newLoss > 5000)
    recs.push({
      h: role === "ceo" ? "Главная зона — запись и план лечения" : "Главная зона — принятие плана лечения",
      p:
        role === "ceo"
          ? "Скрипты администраторов, скорость ответа и дисциплина записи. Здесь лежат самые быстрые деньги."
          : "Структура консультации, визуализация проблемы и отработка возражений пациента."
    });
  if (ml === showLoss && showLoss > 5000)
    recs.push({
      h: "Главная зона — доходимость",
      p: "Подтверждение за 24 часа и в день визита, контроль переносов и возврат пациентов с неявкой."
    });

  if (role === "ceo") {
    if ((map.analytics || 1) < 0.75)
      recs.push({
        h: "Аналитика слепая — деньги текут мимо",
        p: "Один дашборд: CAC, CPL, стоимость записи, show-rate, ROMI. Без этого бюджет распределяется по ощущению."
      });
  } else {
    if ((map.adminSync || 1) < 0.65)
      recs.push({
        h: "Разрыв врач–администратор",
        p: "Передача пациента прямо из кабинета: врач называет следующий шаг, администратор записывает на месте."
      });
  }

  return {
    rsub:
      role === "ceo"
        ? "Потери по воронке: запись, доходимость, план лечения, повторные визиты."
        : "Потери по клиническому маршруту: доходимость, план лечения, возврат.",
    lossM: fmt(total) + " / мес",
    lossY: "или " + fmt(total * 12) + " / год",
    bNew: fmt(newLoss),
    bShow: fmt(showLoss),
    bRep: fmt(repeatLoss),
    riskText,
    tagClass,
    riskDesc,
    fmlLeads: leads,
    fmlAvg: fmt(avg),
    fmlRepeat: fmt(repeatCheckVal),
    fmlBand: getBandName(avg),
    fmlTotal: fmt(total),
    probs,
    recs
  };
}

export function AuditScreen({ onGoToSimulator }: AuditScreenProps) {
  const { width } = useWindowDimensions();
  const isMobile = width <= 760;
  const isStacked = width <= 980;

  const [step, setStep] = useState<"welcome" | "questions" | "result">("welcome");
  const [role, setRole] = useState<RoleKey | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [idx, setIdx] = useState(0);
  const [needSelect, setNeedSelect] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  function startAudit(r: RoleKey) {
    setRole(r);
    setAnswers(DATA[r].map(() => null));
    setIdx(0);
    setNeedSelect(false);
    setStep("questions");
  }

  function selectOption(i: number) {
    setAnswers((prev) => {
      const next = [...prev];
      next[idx] = i;
      return next;
    });
    setNeedSelect(false);
  }

  function goNext() {
    if (!role) return;
    if (answers[idx] === null || answers[idx] === undefined) {
      setNeedSelect(true);
      return;
    }
    if (idx < DATA[role].length - 1) {
      setIdx(idx + 1);
      setNeedSelect(false);
    } else {
      setResult(computeResult(role, answers as number[]));
      setStep("result");
    }
  }

  function goBack() {
    if (idx > 0) {
      setIdx(idx - 1);
      setNeedSelect(false);
    } else {
      setStep("welcome");
    }
  }

  function restart() {
    setRole(null);
    setAnswers([]);
    setIdx(0);
    setResult(null);
    setStep("welcome");
  }

  const navPad = { paddingHorizontal: isMobile ? 18 : 24 };

  if (step === "welcome") {
    return (
      <View style={styles.root}>
        <AuditNav pad={navPad} />
        <ScrollView contentContainerStyle={styles.heroScroll}>
          <View style={[styles.container, navPad]}>
            <View style={[styles.heroGrid, isStacked && styles.stack]}>
              <View style={[styles.heroCopy, isStacked && styles.fullWidth]}>
                <Eyebrow>Аудит потерь клиники</Eyebrow>
                <Text style={[styles.heroTitle, isMobile && styles.heroTitleMobile]}>
                  Бесплатный аудит{"\n"}
                  <Text style={styles.heroAccent}>потерь клиники</Text>
                </Text>
                <Text style={styles.heroText}>
                  Для собственников клиник и главных врачей. За 10 минут — реальная картина потерь по воронке, без
                  обязательств и продаж.
                </Text>
                <View style={styles.featList}>
                  {[
                    "Оцениваем масштаб потерь по вашей ситуации",
                    "Топ-3 причины потери пациентов в вашей нише",
                    "Конкретные шаги — что делать в первую очередь",
                    "Без обязательств — только честная аналитика"
                  ].map((t) => (
                    <View key={t} style={styles.featRow}>
                      <Text style={styles.featBullet}>•</Text>
                      <Text style={styles.featText}>{t}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={[styles.heroPanelWrap, isStacked && styles.fullWidth]}>
                <View style={styles.heroPanel}>
                  <View style={[styles.decorSquare, styles.decorTop]} />
                  <View style={[styles.decorSquare, styles.decorBottom]} />
                  <View style={styles.panelInner}>
                    <View style={styles.eyebrowDark}>
                      <View style={styles.eyebrowDot} />
                      <Text style={styles.eyebrowDarkText}>Кто проходит аудит?</Text>
                    </View>
                    <RoleOption
                      title="CEO / Собственник"
                      desc="Управляю бизнесом и маркетингом"
                      onPress={() => startAudit("ceo")}
                    />
                    <RoleOption
                      title="Главный врач"
                      desc="Руковожу клиническими процессами"
                      onPress={() => startAudit("doctor")}
                    />
                    <Text style={styles.panelNote}>10 вопросов · около 10 минут · без регистрации</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (step === "questions" && role) {
    const qs = DATA[role];
    const q = qs[idx];
    const pct = ((idx + 1) / qs.length) * 100;
    return (
      <View style={styles.root}>
        <AuditNav pad={navPad} />
        <View style={styles.qhdr}>
          <View style={[styles.narrow, navPad]}>
            <View style={styles.qhdrRow}>
              <Text style={styles.qstep}>Вопрос {idx + 1} из {qs.length}</Text>
              <View style={styles.qbadge}>
                <View style={styles.eyebrowDot} />
                <Text style={styles.qbadgeText}>{role === "ceo" ? "CEO / собственник" : "Главный врач"}</Text>
              </View>
            </View>
            <View style={styles.pbar}>
              <View style={[styles.pfill, { width: `${pct}%` }]} />
            </View>
          </View>
        </View>
        <ScrollView style={styles.qScroll} contentContainerStyle={styles.qBody}>
          <View style={[styles.narrow, navPad]}>
            <Text style={styles.qtitle}>{q.title}</Text>
            <Text style={styles.qhelp}>{q.help}</Text>
            <View style={styles.opts}>
              {q.opts.map((opt, i) => {
                const sel = answers[idx] === i;
                return (
                  <Pressable
                    key={opt.l}
                    nativeID={`audit-opt-${i}`}
                    onPress={() => selectOption(i)}
                    style={(state) => [
                      styles.opt,
                      sel && styles.optSel,
                      (state as { hovered?: boolean }).hovered && !sel && styles.optHover
                    ]}
                  >
                    <View style={styles.optRow}>
                      <View style={[styles.radio, sel && styles.radioSel]}>
                        {sel ? <View style={styles.radioDot} /> : null}
                      </View>
                      <View style={styles.optTextWrap}>
                        <Text style={[styles.optL, sel && styles.optLSel]}>{opt.l}</Text>
                        {opt.h ? <Text style={styles.optH}>{opt.h}</Text> : null}
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
            {needSelect ? <Text style={styles.needSelect}>Выберите вариант ответа.</Text> : null}
          </View>
        </ScrollView>
        <View style={styles.qfoot}>
          <View style={[styles.narrow, navPad, styles.qfootRow]}>
            {idx === 0 ? null : (
              <Pressable onPress={goBack} style={({ pressed }) => [styles.btn, styles.btnGhost, pressed && styles.pressed]}>
                <Text style={[styles.btnText, styles.btnTextNavy]}>Назад</Text>
              </Pressable>
            )}
            <Pressable onPress={goNext} style={({ pressed }) => [styles.btn, styles.btnLime, styles.btnFlex, pressed && styles.pressed]}>
              <Text style={[styles.btnText, styles.btnTextNavy]}>{idx === qs.length - 1 ? "Получить результат →" : "Далее →"}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  if (step === "result" && result) {
    const tagStyle =
      result.tagClass === "tag-g" ? styles.tagG : result.tagClass === "tag-y" ? styles.tagY : styles.tagR;
    const tagTextStyle =
      result.tagClass === "tag-g" ? styles.tagGText : result.tagClass === "tag-y" ? styles.tagYText : styles.tagRText;
    return (
      <View style={styles.root}>
        <AuditNav pad={navPad} />
        <ScrollView contentContainerStyle={styles.resultScroll}>
          <View style={[styles.narrowWide, navPad]}>
            <Eyebrow>Результат аудита</Eyebrow>
            <Text style={[styles.rTitle, isMobile && styles.rTitleMobile]}>Оценка потерь по воронке</Text>
            <Text style={styles.rSub}>{result.rsub}</Text>

            <View style={styles.lossMain}>
              <View style={[styles.decorSquare, styles.decorLoss]} />
              <View style={styles.panelInner}>
                <Text style={styles.lossLbl}>Оценка ежемесячных потерь</Text>
                <Text style={[styles.lossAmt, isMobile && styles.lossAmtMobile]}>{result.lossM}</Text>
                <Text style={styles.lossYr}>{result.lossY}</Text>
              </View>
            </View>

            <Text style={styles.secT}>Разбивка по блокам</Text>
            <View style={styles.blkGrid}>
              <View style={styles.blk}>
                <Text style={styles.blkN}>Потери на записи и плане лечения</Text>
                <Text style={styles.blkV}>{result.bNew}</Text>
              </View>
              <View style={styles.blk}>
                <Text style={styles.blkN}>Потери на доходимости</Text>
                <Text style={styles.blkV}>{result.bShow}</Text>
              </View>
              <View style={[styles.blk, styles.blkWide]}>
                <Text style={styles.blkN}>Потери на повторных визитах (база 6 мес × чек повтора)</Text>
                <Text style={styles.blkV}>{result.bRep}</Text>
              </View>
            </View>

            <View style={styles.riskBox}>
              <View style={[styles.tag, tagStyle]}>
                <Text style={[styles.tagText, tagTextStyle]}>{result.riskText}</Text>
              </View>
              <Text style={styles.rdesc}>{result.riskDesc}</Text>
            </View>

            <View style={styles.fml}>
              <Text style={styles.fmlLine}>
                <Text style={styles.fmlStrong}>Как считается:</Text>
              </Text>
              <Text style={styles.fmlLine}>Запись и план: поток × разрыв до эталона × первичный чек × 40%.</Text>
              <Text style={styles.fmlLine}>Доходимость: поток × разрыв по show-rate × первичный чек × 40%.</Text>
              <Text style={styles.fmlLine}>
                Повторные визиты: накопленная база 6 мес × разрыв по retention × чек повтора × 40%.
              </Text>
              <Text style={[styles.fmlLine, styles.fmlGap]}>
                <Text style={styles.fmlStrong}>В вашем расчёте: </Text>
                Поток = {result.fmlLeads}/мес, первичный чек = {result.fmlAvg}, чек повтора = {result.fmlRepeat}, диапазон = {result.fmlBand}, итог = {result.fmlTotal}/мес.
              </Text>
            </View>

            <Text style={styles.secT}>Конкретные проблемы</Text>
            <View style={styles.problemsBox}>
              <Text style={styles.problemsTitle}>Где именно теряются пациенты</Text>
              {result.probs.map((prob, i) => (
                <View key={i} style={[styles.probItem, i === result.probs.length - 1 && styles.probItemLast]}>
                  <Text style={styles.probBullet}>•</Text>
                  <Text style={styles.probText}>
                    <Text style={styles.probStrong}>{prob.bold}</Text>
                    {prob.rest}
                  </Text>
                </View>
              ))}
            </View>

            <Text style={styles.secT}>Рекомендации</Text>
            <View style={styles.recs}>
              {result.recs.map((rec, i) => (
                <View key={i} style={styles.rec}>
                  <Text style={styles.recH}>{rec.h}</Text>
                  <Text style={styles.recP}>{rec.p}</Text>
                </View>
              ))}
            </View>

            <View style={styles.ctaBlock}>
              <View style={[styles.decorSquare, styles.decorCta]} />
              <View style={styles.panelInner}>
                <Text style={styles.ctaTitle}>Хотите вернуть этих пациентов?</Text>
                <Text style={styles.ctaSub}>
                  ИИ-тренажёр обучает администраторов без отрыва от работы. Окупается за 2–4 недели за счёт роста конверсии.
                </Text>
                <Pressable onPress={onGoToSimulator} style={({ pressed }) => [styles.btn, styles.btnLime, styles.ctaBtn, pressed && styles.pressed]}>
                  <Text style={[styles.btnText, styles.btnTextNavy]}>Перейти в тренажёр →</Text>
                </Pressable>
              </View>
            </View>

            <Pressable onPress={restart} style={({ pressed }) => [styles.btn, styles.btnGhost, styles.restart, pressed && styles.pressed]}>
              <Text style={[styles.btnText, styles.btnTextNavy]}>Пройти аудит заново</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  return null;
}

function AuditNav({ pad }: { pad: { paddingHorizontal: number } }) {
  return (
    <View style={styles.nav}>
      <View style={[styles.container, styles.navIn, pad]}>
        <View style={styles.logo}>
          <LogoMark />
          <Text style={styles.logoText}>цифровая{"\n"}методология</Text>
        </View>
        <View style={styles.navTag}>
          <Text style={styles.navTagText}>Аудит</Text>
        </View>
      </View>
    </View>
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

function Eyebrow({ children }: { children: string }) {
  return (
    <View style={styles.eyebrow}>
      <View style={styles.eyebrowDot} />
      <Text style={styles.eyebrowText}>{children}</Text>
    </View>
  );
}

function RoleOption({ title, desc, onPress }: { title: string; desc: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={(state) => [
        styles.roleOption,
        (state as { hovered?: boolean }).hovered && styles.roleOptionHover,
        (state as { pressed?: boolean }).pressed && styles.pressed
      ]}
    >
      <View style={styles.roleOptionText}>
        <Text style={styles.roTitle}>{title}</Text>
        <Text style={styles.roDesc}>{desc}</Text>
      </View>
      <Text style={styles.roArrow}>→</Text>
    </Pressable>
  );
}

const NAVY = "#121a68";
const LIME = "#9cf000";
const LIME_2 = "#b8ff43";
const RED = "#c84242";
const TEXT = "#1f2559";
const MUTED = "#60688d";
const LINE = "#dfe3f2";
const SOFT = "#f6f8ff";
const SOFT_2 = "#eef2ff";
const LIME_PILL = "#edf8ce";

const F: TextStyle = { fontFamily: FONT_FAMILY };

const shadow = {
  shadowColor: NAVY,
  shadowOpacity: 0.12,
  shadowRadius: 40,
  shadowOffset: { width: 0, height: 18 },
  elevation: 8
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: SOFT },
  container: { width: "100%", maxWidth: 1260, alignSelf: "center" },
  narrow: { width: "100%", maxWidth: 760, alignSelf: "center" },
  narrowWide: { width: "100%", maxWidth: 820, alignSelf: "center" },
  fullWidth: { flexGrow: 0, flexShrink: 0, flexBasis: "auto", width: "100%", minWidth: 0 },

  // NAV
  nav: {
    zIndex: 50,
    backgroundColor: "rgba(255,255,255,.94)",
    borderBottomWidth: 1,
    borderBottomColor: LINE,
    ...(Platform.OS === "web" ? ({ position: "sticky", top: 0, backdropFilter: "blur(14px)" } as object) : null)
  },
  navIn: { minHeight: 70, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 20 },
  logo: { flexDirection: "row", alignItems: "center", gap: 14 },
  mark: { width: 38, height: 38, borderRadius: 12, backgroundColor: NAVY, position: "relative", overflow: "hidden" },
  markStripe: { position: "absolute", height: 9, borderRadius: 20, backgroundColor: LIME, transform: [{ rotate: "-35deg" }] },
  markStripeTop: { width: 28, left: 6, top: 9 },
  markStripeBottom: { width: 22, left: 10, top: 21 },
  logoText: { ...F, color: NAVY, fontSize: 14, lineHeight: 14, fontWeight: "900", textTransform: "uppercase", letterSpacing: -0.4 },
  navTag: { backgroundColor: LIME_PILL, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999 },
  navTagText: { ...F, color: NAVY, fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1 },

  // EYEBROW
  eyebrow: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: LIME_PILL, marginBottom: 18 },
  eyebrowDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: LIME },
  eyebrowText: { ...F, color: NAVY, fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1 },
  eyebrowDark: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: "rgba(255,255,255,.12)", marginBottom: 20 },
  eyebrowDarkText: { ...F, color: "#fff", fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1 },

  // BUTTONS
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
  btn: { minHeight: 52, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 999, alignItems: "center", justifyContent: "center", ...(Platform.OS === "web" ? ({ cursor: "pointer" } as object) : null) },
  btnLime: { backgroundColor: LIME },
  btnGhost: { backgroundColor: "#fff", borderWidth: 1, borderColor: LINE },
  btnFlex: { flex: 1 },
  btnText: { ...F, fontWeight: "800", fontSize: 15 },
  btnTextNavy: { color: NAVY },

  // HERO / WELCOME
  heroScroll: { flexGrow: 1, paddingTop: 48, paddingBottom: 64, backgroundColor: SOFT },
  heroGrid: { flexDirection: "row", gap: 40, alignItems: "center" },
  stack: { flexDirection: "column", alignItems: "stretch", gap: 32 },
  heroCopy: { flex: 1.15, minWidth: 0 },
  heroTitle: { ...F, color: NAVY, fontSize: 56, lineHeight: 54, fontWeight: "900", textTransform: "uppercase", letterSpacing: -1.5, marginBottom: 22 },
  heroTitleMobile: { fontSize: 40, lineHeight: 40 },
  heroAccent: { color: "#86cf00" },
  heroText: { ...F, color: MUTED, fontSize: 20, lineHeight: 30, maxWidth: 560, marginBottom: 26 },
  featList: { gap: 14 },
  featRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  featBullet: { ...F, color: "#86cf00", fontSize: 20, lineHeight: 26, fontWeight: "900" },
  featText: { ...F, color: TEXT, fontSize: 17, lineHeight: 26, fontWeight: "600", flex: 1 },
  heroPanelWrap: { flex: 0.85, minWidth: 320 },
  heroPanel: { backgroundColor: NAVY, borderRadius: 30, padding: 26, overflow: "hidden", ...shadow },
  panelInner: { position: "relative", zIndex: 1 },
  decorSquare: { position: "absolute", backgroundColor: LIME, transform: [{ rotate: "45deg" }], zIndex: 0 },
  decorTop: { width: 180, height: 180, right: -80, top: -80, opacity: 0.9 },
  decorBottom: { width: 120, height: 120, left: -55, bottom: -55, opacity: 0.18 },
  panelNote: { ...F, color: "rgba(255,255,255,.6)", fontSize: 13, lineHeight: 18, marginTop: 16, textAlign: "center", fontWeight: "600" },
  roleOption: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "rgba(255,255,255,.1)", borderWidth: 1, borderColor: "rgba(255,255,255,.14)", borderRadius: 20, paddingVertical: 18, paddingHorizontal: 18, marginBottom: 12, ...(Platform.OS === "web" ? ({ cursor: "pointer", transitionDuration: "160ms" } as object) : null) },
  roleOptionHover: { backgroundColor: "rgba(156,240,0,.16)", borderColor: LIME },
  roleOptionText: { flex: 1 },
  roTitle: { ...F, color: "#fff", fontSize: 18, lineHeight: 22, fontWeight: "900", marginBottom: 4 },
  roDesc: { ...F, color: "rgba(255,255,255,.7)", fontSize: 13, lineHeight: 18 },
  roArrow: { ...F, color: LIME, fontSize: 22, fontWeight: "900" },

  // QUESTIONS
  qhdr: { paddingTop: 18, paddingBottom: 16, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: LINE },
  qhdrRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  qstep: { ...F, color: NAVY, fontSize: 14, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.5 },
  qbadge: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: LIME_PILL, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999 },
  qbadgeText: { ...F, color: NAVY, fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },
  pbar: { width: "100%", height: 6, backgroundColor: "#e3e7f4", borderRadius: 3, overflow: "hidden" },
  pfill: { height: 6, backgroundColor: LIME, borderRadius: 3 },
  qScroll: { flex: 1 },
  qBody: { flexGrow: 1, paddingVertical: 36 },
  qtitle: { ...F, color: NAVY, fontSize: 26, fontWeight: "900", lineHeight: 32, marginBottom: 8, letterSpacing: -0.5 },
  qhelp: { ...F, color: MUTED, fontSize: 15, lineHeight: 22, marginBottom: 26 },
  opts: { gap: 12 },
  opt: { backgroundColor: "#fff", borderWidth: 1.5, borderColor: LINE, borderRadius: 18, paddingVertical: 16, paddingHorizontal: 18, ...shadow, shadowOpacity: 0.05, ...(Platform.OS === "web" ? ({ cursor: "pointer", transitionDuration: "160ms" } as object) : null) },
  optHover: { borderColor: "#bcc6e8" },
  optSel: { borderColor: NAVY, backgroundColor: "#f4fbe0" },
  optRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: "#cdd5ee", alignItems: "center", justifyContent: "center" },
  radioSel: { borderColor: NAVY, backgroundColor: NAVY },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: LIME },
  optTextWrap: { flex: 1 },
  optL: { ...F, color: TEXT, fontWeight: "800", fontSize: 16, marginBottom: 1 },
  optLSel: { color: NAVY },
  optH: { ...F, color: MUTED, fontSize: 13, lineHeight: 18 },
  needSelect: { ...F, color: RED, fontSize: 14, fontWeight: "700", marginTop: 16 },
  qfoot: { paddingVertical: 18, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: LINE },
  qfootRow: { flexDirection: "row", gap: 12 },

  // RESULT
  resultScroll: { flexGrow: 1, paddingVertical: 48, backgroundColor: SOFT },
  rTitle: { ...F, color: NAVY, fontSize: 40, lineHeight: 42, fontWeight: "900", textTransform: "uppercase", letterSpacing: -1, marginBottom: 12 },
  rTitleMobile: { fontSize: 30, lineHeight: 32 },
  rSub: { ...F, color: MUTED, fontSize: 18, lineHeight: 27, marginBottom: 30 },
  lossMain: { backgroundColor: NAVY, borderRadius: 28, paddingVertical: 30, paddingHorizontal: 28, marginBottom: 28, overflow: "hidden", ...shadow },
  decorLoss: { width: 180, height: 180, right: -70, top: -80, opacity: 0.9 },
  decorCta: { width: 170, height: 170, right: -65, bottom: -75, opacity: 0.85 },
  lossLbl: { ...F, color: "rgba(255,255,255,.7)", fontSize: 12, textTransform: "uppercase", letterSpacing: 1, fontWeight: "800", marginBottom: 12 },
  lossAmt: { ...F, color: LIME_2, fontSize: 52, fontWeight: "900", lineHeight: 52, letterSpacing: -1.5, marginBottom: 8 },
  lossAmtMobile: { fontSize: 38, lineHeight: 40 },
  lossYr: { ...F, color: "rgba(255,255,255,.72)", fontSize: 15, fontWeight: "600" },
  secT: { ...F, color: "#9aa3c9", fontSize: 12, fontWeight: "800", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 14, marginTop: 8 },
  blkGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 26 },
  blk: { backgroundColor: "#fff", borderRadius: 20, padding: 20, borderWidth: 1, borderColor: LINE, flexGrow: 1, flexBasis: "46%", ...shadow },
  blkWide: { flexBasis: "100%" },
  blkN: { ...F, color: MUTED, fontSize: 13, lineHeight: 18, marginBottom: 8 },
  blkV: { ...F, color: NAVY, fontSize: 24, fontWeight: "900", letterSpacing: -0.5 },
  riskBox: { backgroundColor: "#fff", borderRadius: 20, paddingVertical: 20, paddingHorizontal: 22, borderWidth: 1, borderColor: LINE, marginBottom: 26, ...shadow },
  tag: { alignSelf: "flex-start", paddingVertical: 6, paddingHorizontal: 13, borderRadius: 999, marginBottom: 12, borderWidth: 1 },
  tagText: { ...F, fontSize: 12, fontWeight: "900", letterSpacing: 0.8, textTransform: "uppercase" },
  tagG: { backgroundColor: LIME_PILL, borderColor: "#d3ec9a" },
  tagGText: { color: NAVY },
  tagY: { backgroundColor: "#fdf0d3", borderColor: "#f0d79b" },
  tagYText: { color: "#9a6a12" },
  tagR: { backgroundColor: "#fbe3e3", borderColor: "#f0c2c2" },
  tagRText: { color: RED },
  rdesc: { ...F, color: TEXT, fontSize: 15, lineHeight: 23 },
  fml: { backgroundColor: SOFT_2, borderRadius: 20, padding: 22, borderWidth: 1, borderColor: LINE, marginBottom: 26 },
  fmlLine: { ...F, color: MUTED, fontSize: 14, lineHeight: 23 },
  fmlGap: { marginTop: 14 },
  fmlStrong: { ...F, color: NAVY, fontWeight: "800" },
  problemsBox: { backgroundColor: "#fff", borderRadius: 24, padding: 24, borderWidth: 1, borderColor: LINE, marginBottom: 26, ...shadow },
  problemsTitle: { ...F, color: NAVY, fontSize: 15, fontWeight: "900", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 16 },
  probItem: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: "#eef1fa" },
  probItemLast: { borderBottomWidth: 0, paddingBottom: 0 },
  probBullet: { ...F, color: "#86cf00", fontSize: 18, lineHeight: 23, fontWeight: "900" },
  probText: { ...F, color: TEXT, fontSize: 15, lineHeight: 23, flex: 1 },
  probStrong: { ...F, color: NAVY, fontWeight: "800" },
  recs: { gap: 12, marginBottom: 28 },
  rec: { backgroundColor: "#fff", borderRadius: 20, padding: 20, borderLeftWidth: 4, borderLeftColor: LIME, borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderTopColor: LINE, borderRightColor: LINE, borderBottomColor: LINE, ...shadow },
  recH: { ...F, color: NAVY, fontSize: 17, fontWeight: "900", marginBottom: 6 },
  recP: { ...F, color: MUTED, fontSize: 14, lineHeight: 22 },
  ctaBlock: { backgroundColor: NAVY, borderRadius: 28, paddingVertical: 32, paddingHorizontal: 28, marginBottom: 16, overflow: "hidden", ...shadow },
  ctaTitle: { ...F, color: "#fff", fontSize: 26, fontWeight: "900", textTransform: "uppercase", letterSpacing: -0.5, marginBottom: 10, lineHeight: 30 },
  ctaSub: { ...F, color: "rgba(255,255,255,.8)", fontSize: 15, lineHeight: 23, marginBottom: 24, maxWidth: 460 },
  ctaBtn: { alignSelf: "flex-start", paddingHorizontal: 28 },
  restart: { alignSelf: "flex-start", paddingHorizontal: 28 }
});
