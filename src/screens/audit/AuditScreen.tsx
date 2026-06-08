import React, { useEffect, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type TextStyle
} from "react-native";

import { leadService } from "../../services/leadService";
import type { AuditLeadHandoff } from "../landing/LandingScreen";

interface AuditScreenProps {
  onGoToSimulator: () => void;
  lead?: AuditLeadHandoff | null;
}

type RoleKey = "ceo" | "doctor";

type Opt = { l: string; h: string; v: number; s: number };
type Question = { key: string; title: string; help: string; opts: Opt[] };

const FONT_FAMILY = Platform.OS === "web" ? "Inter, system-ui, sans-serif" : undefined;

// Анкета и расчёт — строго по таблице «Расчет калькулятора.xlsx».
const QUESTIONS: Question[] = [
  {
    key: "lead",
    title: "Сколько первичных лидов / обращений в месяц получает клиника?",
    help: "Все новые обращения из всех каналов за месяц.",
    opts: [
      { l: "До 100", h: "", v: 80, s: 0 },
      { l: "100–300", h: "", v: 200, s: 0 },
      { l: "300–700", h: "", v: 500, s: 0 },
      { l: "700+", h: "", v: 800, s: 0 }
    ]
  },
  {
    key: "book",
    title: "Какая доля обратившихся записываются на первичный приём?",
    help: "Эталон — 90%.",
    opts: [
      { l: "80%+", h: "", v: 0.8, s: 0 },
      { l: "60–79%", h: "", v: 0.6, s: 1 },
      { l: "40–59%", h: "", v: 0.5, s: 2 },
      { l: "Ниже 40%", h: "", v: 0.3, s: 3 }
    ]
  },
  {
    key: "reach",
    title: "Какая доля первичных обращений реально доходит до записи?",
    help: "Эталон — 95%.",
    opts: [
      { l: "80%+", h: "", v: 0.8, s: 0 },
      { l: "60–79%", h: "", v: 0.6, s: 1 },
      { l: "40–59%", h: "", v: 0.5, s: 2 },
      { l: "Ниже 40%", h: "", v: 0.3, s: 3 }
    ]
  },
  {
    key: "mainBook",
    title: "Какой процент первичных пациентов записываются на следующий (основной) этап лечения?",
    help: "Эталон — 85%.",
    opts: [
      { l: "70%+", h: "", v: 0.75, s: 0 },
      { l: "55–69%", h: "", v: 0.6, s: 1 },
      { l: "40–54%", h: "", v: 0.5, s: 2 },
      { l: "Ниже 40%", h: "", v: 0.35, s: 3 }
    ]
  },
  {
    key: "mainReach",
    title: "Какой процент записанных доходит до следующего (основного) этапа?",
    help: "Эталон — 90%.",
    opts: [
      { l: "85%+", h: "", v: 0.85, s: 0 },
      { l: "70–84%", h: "", v: 0.75, s: 1 },
      { l: "55–69%", h: "", v: 0.6, s: 2 },
      { l: "Ниже 55%", h: "", v: 0.48, s: 3 }
    ]
  },
  {
    key: "check1",
    title: "Какой средний чек первичного приёма?",
    help: "Средний чек первой оплаченной услуги.",
    opts: [
      { l: "До 5 000 ₽", h: "", v: 3500, s: 0 },
      { l: "5 000–15 000 ₽", h: "", v: 11000, s: 0 },
      { l: "15 000–30 000 ₽", h: "", v: 22000, s: 0 },
      { l: "30 000+ ₽", h: "", v: 30000, s: 0 }
    ]
  },
  {
    key: "check2",
    title: "Какой средний чек повторного визита / следующего (основного) этапа лечения?",
    help: "Обычно выше первичного — основной этап лечения.",
    opts: [
      { l: "До 50 000 ₽", h: "", v: 35000, s: 0 },
      { l: "50 000–120 000 ₽", h: "", v: 90000, s: 0 },
      { l: "120 000–200 000 ₽", h: "", v: 180000, s: 0 },
      { l: "200 000+ ₽", h: "", v: 250000, s: 0 }
    ]
  },
  {
    key: "mkt",
    title: "Оцените общие затраты на маркетинг и рекламу, включая зарплату маркетолога (если есть)",
    help: "Полный бюджет привлечения за месяц.",
    opts: [
      { l: "До 100 000 ₽", h: "", v: 100000, s: 0 },
      { l: "100 000–200 000 ₽", h: "", v: 200000, s: 0 },
      { l: "200 000–300 000 ₽", h: "", v: 300000, s: 0 },
      { l: "300 000+ ₽", h: "", v: 400000, s: 0 }
    ]
  },
  {
    key: "ltv",
    title: "Какой процент клиентов, посетивших клинику, возвращаются в течение года?",
    help: "Эталон — 60%.",
    opts: [
      { l: "60%+", h: "", v: 0.6, s: 0 },
      { l: "50–60%", h: "", v: 0.5, s: 1 },
      { l: "40–50%", h: "", v: 0.4, s: 2 },
      { l: "Ниже 40%", h: "", v: 0.3, s: 3 }
    ]
  }
];

const DATA: Record<RoleKey, Question[]> = {
  ceo: QUESTIONS,
  doctor: QUESTIONS
};

// Эталоны (макс. возможный процент) из таблицы.
// Отраслевые бенчмарки для премиальных клиник (топ-квартиль). Чуть выше лучшего
// выбираемого варианта — поэтому даже у сильной клиники есть умеренный, правдоподобный
// разрыв «до лучших в классе», а не ноль и не абсурдные цифры.
const BENCH = { book: 0.85, reach: 0.88, mainBook: 0.8, mainReach: 0.92, ltv: 0.65 };
// Доля теоретического разрыва, реально достижимая за 6–12 месяцев работы (консервативно).
const RECOVERY = 0.45;

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

function fmt(n: number) {
  // Неразрывные пробелы между разрядами и перед ₽ — чтобы сумма не переносилась.
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " ₽";
}

// Модель потерь премиальной клиники: трёхуровневая воронка, ценность пациента и
// консервативный коэффициент реализуемости (как в реальном revenue-аудите).
function computeResult(role: RoleKey, answers: number[]): Result {
  const qs = DATA[role];
  const map: Record<string, number> = {};
  for (let i = 0; i < qs.length; i++) map[qs[i].key] = qs[i].opts[answers[i]].v;
  let sev = 0;
  for (let i = 0; i < qs.length; i++) sev += qs[i].opts[answers[i]].s || 0;

  const leads = map.lead || 0;
  const check1 = map.check1 || 0;
  const check2 = map.check2 || 0;
  const book = map.book || 0;
  const reach = map.reach || 0;
  const mainBook = map.mainBook || 0;
  const mainReach = map.mainReach || 0;
  const ret = map.ltv || 0;

  // Воронка по пациентам в месяц: дошли до приёма и завершили основной (платный) этап.
  const attendedCur = leads * book * reach;
  const attendedBench = leads * BENCH.book * BENCH.reach;
  const mainRateCur = mainBook * mainReach;
  const mainRateBench = BENCH.mainBook * BENCH.mainReach;
  const completedCur = attendedCur * mainRateCur;

  // Ценность дошедшего пациента за первый цикл: первичный чек + ожидаемая основная выручка.
  const attendeeValue = check1 + mainRateCur * check2;

  // БЛОК 1 — верх воронки: недополученные дошедшие пациенты × их ценность.
  const lossLead = Math.max(0, attendedBench - attendedCur) * attendeeValue * RECOVERY;
  // БЛОК 2 — конверсия дошедших в основной этап: разрыв конверсии × чек основного этапа.
  const lossMain = attendedCur * Math.max(0, mainRateBench - mainRateCur) * check2 * RECOVERY;
  // БЛОК 3 — удержание/LTV: недополученная повторная выручка в месяц.
  const lossLtv = completedCur * Math.max(0, BENCH.ltv - ret) * check2 * RECOVERY;

  const total = lossLead + lossMain + lossLtv; // ежемесячные потери = сумма трёх блоков

  let risk: "green" | "yellow" | "red";
  let riskText: string;
  let riskDesc: string;
  let tagClass: TagClass;
  if (sev <= 4) {
    risk = "green";
    riskText = "Низкий риск";
    tagClass = "tag-g";
    riskDesc = "Воронка близка к лучшим в классе. Задача — закрепить стандарты и масштабировать.";
  } else if (sev >= 9) {
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

  // Проблемы — по фактическим разрывам до бенчмарка.
  const probs: Prob[] = [];
  if (book < BENCH.book - 0.02)
    probs.push({ icon: "📞", bold: "Запись на приём:", rest: " часть обращений не доходит до записи — теряются на первом контакте." });
  if (reach < BENCH.reach - 0.02)
    probs.push({ icon: "📅", bold: "Доходимость до приёма:", rest: " записанные пациенты не доходят — нет системы подтверждений и напоминаний." });
  if (mainBook < BENCH.mainBook - 0.02)
    probs.push({ icon: "💬", bold: "Переход на основной этап:", rest: " первичные пациенты не записываются на основное лечение — слабая аргументация ценности." });
  if (mainReach < BENCH.mainReach - 0.02)
    probs.push({ icon: "🔄", bold: "Доходимость до основного этапа:", rest: " записанные на основной этап не доходят — теряется самый дорогой чек." });
  if (ret < BENCH.ltv - 0.02)
    probs.push({ icon: "⭐", bold: "Возврат в течение года:", rest: " пациенты не возвращаются — недозагружен потенциал LTV." });
  if (probs.length === 0)
    probs.push({ icon: "✅", bold: "Критических точек не выявлено", rest: " — показатели на уровне лучших в классе. Фокус на масштабировании." });

  // Рекомендации — по самому дорогому блоку.
  const recs: Rec[] = [];
  if (risk === "red")
    recs.push({ h: "Антикризисный приоритет — немедленно", p: "Раз в неделю смотреть воронку: обращение → запись → доходимость → основной этап → возврат. Назначить ответственного на каждый этап." });
  else if (risk === "yellow")
    recs.push({ h: "Сфокусироваться на 1–2 узких местах", p: "Не чинить всё сразу — сначала убрать самый дорогой провал." });
  else
    recs.push({ h: "Масштабировать сильные практики", p: "Показатели сильные. Зафиксируйте стандарты и не теряйте качество при росте потока." });

  const ml = Math.max(lossLead, lossMain, lossLtv);
  if (ml === lossLtv && lossLtv > 5000)
    recs.push({ h: "Главная зона — удержание и повторные визиты", p: "Возврат пациентов ниже бенчмарка. Цикл касаний 7–21–45 дней и работа с незавершённым лечением дают до " + fmt(lossLtv * 12) + " в год." });
  else if (ml === lossMain && lossMain > 5000)
    recs.push({ h: "Главная зона — конверсия в основной этап", p: "Самый дорогой блок: чек " + fmt(check2) + ". Усильте аргументацию ценности и доведение до основного этапа лечения." });
  else if (ml === lossLead && lossLead > 5000)
    recs.push({ h: "Главная зона — привлечение и запись", p: "Скрипты администраторов, скорость ответа и подтверждения визита. Здесь самые быстрые деньги." });

  return {
    rsub: "Потери по воронке: привлечение и запись, конверсия в лечение, удержание пациентов.",
    lossM: fmt(total) + " / мес",
    lossY: "или " + fmt(total * 12) + " / год",
    bNew: fmt(lossLead),
    bShow: fmt(lossMain),
    bRep: fmt(lossLtv),
    riskText,
    tagClass,
    riskDesc,
    fmlLeads: leads,
    fmlAvg: fmt(check1),
    fmlRepeat: fmt(check2),
    fmlBand: `~${Math.round(attendedCur)} дошли до приёма · ~${Math.round(completedCur)} завершили основной этап`,
    fmlTotal: fmt(total),
    probs,
    recs
  };
}

export function AuditScreen({ onGoToSimulator, lead }: AuditScreenProps) {
  const { width } = useWindowDimensions();
  const isMobile = width <= 760;
  const isStacked = width <= 980;

  const [step, setStep] = useState<"welcome" | "questions" | "result">("welcome");
  const [role, setRole] = useState<RoleKey | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [idx, setIdx] = useState(0);
  const [needSelect, setNeedSelect] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [leadModal, setLeadModal] = useState<null | "discuss" | "demo">(null);

  // Заявку с лендинга записываем в БД не сразу, а когда аудит завершён (или брошен /
  // не допройдён). Это держит «заявку на обсуждение» привязанной к итогу аудита.
  const leadRef = useRef(lead);
  leadRef.current = lead;
  const submittedRef = useRef(false);
  const progressRef = useRef<{ step: string; role: RoleKey | null; idx: number; answers: (number | null)[] }>({
    step,
    role,
    idx,
    answers
  });
  progressRef.current = { step, role, idx, answers };

  function submitLead(auditStatus: string, payload: Record<string, unknown>) {
    const ld = leadRef.current;
    if (submittedRef.current || !ld) {
      return;
    }
    submittedRef.current = true;
    void leadService
      .submitAuditLead({
        name: ld.name,
        clinic: ld.clinic ?? null,
        contact: ld.contact,
        source: "landing_audit",
        payload: { audit_status: auditStatus, ...payload }
      })
      .catch(() => {
        // Best-effort: не мешаем прохождению аудита, если сеть недоступна.
      });
  }

  useEffect(() => {
    if (step === "result" && result) {
      submitLead("completed", {
        role,
        answers,
        result: { loss_month: result.lossM, loss_year: result.lossY, risk: result.riskText, tag: result.tagClass }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, result]);

  useEffect(() => {
    return () => {
      const p = progressRef.current;
      if (p.step !== "result") {
        submitLead("abandoned", { step: p.step, role: p.role, answered: p.idx, answers: p.answers });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
                    <Text style={styles.panelNote}>9 вопросов · около 10 минут · без регистрации</Text>
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

            <Text style={styles.secT}>Разбивка потерь по этапам (в месяц)</Text>
            <View style={styles.blkGrid}>
              <View style={[styles.blk, isMobile && styles.blkFullMobile]}>
                <Text style={styles.blkN}>Привлечение и запись</Text>
                <Text style={styles.blkV} numberOfLines={1} adjustsFontSizeToFit>{result.bNew}</Text>
              </View>
              <View style={[styles.blk, isMobile && styles.blkFullMobile]}>
                <Text style={styles.blkN}>Конверсия в лечение</Text>
                <Text style={styles.blkV} numberOfLines={1} adjustsFontSizeToFit>{result.bShow}</Text>
              </View>
              <View style={[styles.blk, styles.blkWide]}>
                <Text style={styles.blkN}>Удержание и повторные визиты (LTV)</Text>
                <Text style={styles.blkV} numberOfLines={1} adjustsFontSizeToFit>{result.bRep}</Text>
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
              <Text style={styles.fmlLine}>
                Привлечение и запись: недополученные пациенты до приёма (vs топ-квартиль) × ценность пациента (первичный +
                ожидаемый основной чек).
              </Text>
              <Text style={styles.fmlLine}>Конверсия в лечение: дошедшие пациенты × разрыв конверсии в основной этап × чек основного этапа.</Text>
              <Text style={styles.fmlLine}>Удержание/LTV: завершившие лечение × разрыв возврата за год × чек.</Text>
              <Text style={styles.fmlLine}>
                Каждый блок берётся с коэффициентом реализуемости 45% — это доля разрыва, реально достижимая за 6–12 месяцев.
                Итог — сумма трёх блоков.
              </Text>
              <Text style={[styles.fmlLine, styles.fmlGap]}>
                <Text style={styles.fmlStrong}>В вашей воронке: </Text>
                поток {result.fmlLeads}/мес, {result.fmlBand}. Чеки: первичный {result.fmlAvg}, основной {result.fmlRepeat}.
                Итог потерь — {result.fmlTotal}/мес.
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
                  Внедрение Aithera окупается за 2–4 недели за счёт роста конверсии. Покажем, как это сработает у вас.
                </Text>
                <View style={styles.ctaBtnRow}>
                  <Pressable onPress={() => setLeadModal("discuss")} style={({ pressed }) => [styles.btn, styles.btnLime, styles.ctaBtn, pressed && styles.pressed]}>
                    <Text style={[styles.btnText, styles.btnTextNavy]}>Обсудить внедрение</Text>
                  </Pressable>
                  <Pressable onPress={() => setLeadModal("demo")} style={({ pressed }) => [styles.btn, styles.ctaBtnGhost, pressed && styles.pressed]}>
                    <Text style={[styles.btnText, styles.btnTextLight]}>Записаться на демо</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
        {leadModal ? (
          <AuditLeadModal
            isMobile={isMobile}
            variant={leadModal}
            onClose={() => setLeadModal(null)}
          />
        ) : null}
      </View>
    );
  }

  return null;
}

function AuditLeadModal({
  variant,
  onClose
}: {
  variant: "discuss" | "demo";
  isMobile: boolean;
  onClose: () => void;
}) {
  const isDemo = variant === "demo";
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
        source: isDemo ? "demo_request" : "discuss_implementation"
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
      <View style={styles.modalCard}>
        <View style={styles.modalHeaderRow}>
          <Text style={styles.modalHeading}>{isDemo ? "Записаться на демо" : "Обсудить внедрение"}</Text>
          <Pressable onPress={onClose} style={styles.modalClose} accessibilityRole="button">
            <Text style={styles.modalCloseTxt}>×</Text>
          </Pressable>
        </View>
        <View style={styles.modalBody}>
          {status === "success" ? (
            <>
              <Text style={styles.modalOkTitle}>Заявка принята</Text>
              <Text style={styles.modalOkText}>
                {isDemo
                  ? "Мы свяжемся с вами, чтобы согласовать удобное время демо."
                  : "Мы свяжемся с вами, чтобы обсудить внедрение под вашу клинику."}
              </Text>
              <Pressable onPress={onClose} style={({ pressed }) => [styles.btn, styles.btnLime, pressed && styles.pressed]}>
                <Text style={[styles.btnText, styles.btnTextNavy]}>Готово</Text>
              </Pressable>
            </>
          ) : (
            <>
              <TextInput value={form.name} onChangeText={(name) => setForm((v) => ({ ...v, name }))} placeholder="Имя" placeholderTextColor="#60688d" style={styles.modalInput} />
              <TextInput value={form.clinic} onChangeText={(clinic) => setForm((v) => ({ ...v, clinic }))} placeholder="Клиника / должность" placeholderTextColor="#60688d" style={styles.modalInput} />
              <TextInput value={form.contact} onChangeText={(contact) => setForm((v) => ({ ...v, contact }))} placeholder="Телефон или Telegram" placeholderTextColor="#60688d" style={styles.modalInput} />
              <Pressable onPress={submit} disabled={status === "sending"} style={({ pressed }) => [styles.btn, styles.btnLime, pressed && styles.pressed]}>
                <Text style={[styles.btnText, styles.btnTextNavy]}>{status === "sending" ? "Отправляем…" : "Отправить заявку"}</Text>
              </Pressable>
              {status === "error" && error ? <Text style={styles.modalErr}>{error}</Text> : null}
            </>
          )}
        </View>
      </View>
    </View>
  );
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
  btnTextLight: { color: "#fff" },
  ctaBtnRow: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  ctaBtnGhost: { backgroundColor: "rgba(255,255,255,.1)", borderWidth: 1, borderColor: "rgba(255,255,255,.3)", paddingHorizontal: 28 },
  modalOverlay: {
    ...(Platform.OS === "web" ? ({ position: "fixed" } as object) : { position: "absolute" }),
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    alignItems: "center",
    justifyContent: "center",
    padding: 16
  },
  modalBackdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(10,14,46,.6)" },
  modalCard: { width: "100%", maxWidth: 460, backgroundColor: "#fff", borderRadius: 24, overflow: "hidden", ...shadow },
  modalHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 16, paddingHorizontal: 22, borderBottomWidth: 1, borderBottomColor: LINE, backgroundColor: SOFT },
  modalHeading: { ...F, color: NAVY, fontSize: 18, fontWeight: "900", textTransform: "uppercase", flex: 1 },
  modalClose: { width: 38, height: 38, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: "#fff", borderWidth: 1, borderColor: LINE },
  modalCloseTxt: { ...F, color: NAVY, fontSize: 24, lineHeight: 26, fontWeight: "700" },
  modalBody: { padding: 22, gap: 12 },
  modalText: { ...F, color: MUTED, fontSize: 15, lineHeight: 22, marginBottom: 4 },
  modalInput: { width: "100%", minHeight: 52, borderRadius: 14, backgroundColor: SOFT, borderWidth: 1, borderColor: LINE, paddingHorizontal: 16, color: TEXT, fontSize: 16, ...F },
  modalErr: { ...F, color: "#c84242", fontWeight: "700", fontSize: 14 },
  modalOkTitle: { ...F, color: NAVY, fontSize: 22, fontWeight: "900", textTransform: "uppercase" },
  modalOkText: { ...F, color: MUTED, fontSize: 15, lineHeight: 22, marginBottom: 4 },

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
  blkFullMobile: { flexBasis: "100%" },
  blkLtv: { backgroundColor: LIME_PILL, borderColor: "#d3e6a3" },
  blkVLtv: { color: "#3f6300" },
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
