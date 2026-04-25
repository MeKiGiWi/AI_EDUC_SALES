import { AiTrainerSection } from "@/components/landing/AiTrainerSection";
import { AudienceSection } from "@/components/landing/AudienceSection";
import { FaqSection } from "@/components/landing/FaqSection";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { FinalCta } from "@/components/landing/FinalCta";
import { Footer } from "@/components/landing/Footer";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Navbar } from "@/components/landing/Navbar";
import { PricingSection } from "@/components/landing/PricingSection";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { SecuritySection } from "@/components/landing/SecuritySection";

const navLinks = [
  { label: "Платформа", href: "#platform" },
  { label: "ИИ-тренажёр", href: "#ai-trainer" },
  { label: "Для кого", href: "#audience" },
  { label: "Тарифы", href: "#pricing" },
  { label: "FAQ", href: "#faq" }
];

const problemItems = [
  "Продавцы знают продукт, но не умеют продавать в реальном диалоге.",
  "Нет регулярной практики, которая закрепляет поведение до автоматизма.",
  "Руководители дают обратную связь субъективно и не всегда по единому стандарту.",
  "Сложно масштабировать единые стандарты продаж на всю команду.",
  "Новички долго выходят на результат и перегружают руководителя.",
  "Нет прозрачной связи обучения с KPI, конверсией и выручкой."
];

const howItWorksSteps = [
  { title: "База знаний", description: "Собираем материалы, скрипты, кейсы и стандарты продаж в одном месте, чтобы команда работала по единой логике." },
  { title: "ИИ-чат", description: "Менеджер быстро находит ответы по продукту, возражениям и лучшим практикам прямо в процессе обучения." },
  { title: "ИИ-тренажёр", description: "Сценарии разговоров адаптируются под роль сотрудника, сегмент клиента и этап воронки." },
  { title: "Оценка навыков", description: "Платформа измеряет soft и hard skills, подсвечивает зоны роста и качество выполнения стандартов." },
  { title: "Отчёты и KPI", description: "Руководитель видит динамику по людям и командам, связь обучения с коммерческими результатами и точками риска." }
];

const trainerItems = [
  { title: "Практика в диалоге или переписке", description: "Сотрудник тренируется в формате, который ближе к его реальной работе: встреча, звонок, чат или email-коммуникация." },
  { title: "Адаптация под роль и уровень", description: "Сценарии меняются под Hunter, Account, B2B, B2C и разные уровни зрелости сотрудника." },
  { title: "Оценка soft и hard skills", description: "Платформа смотрит не только на знание продукта, но и на эмпатию, структуру разговора, диагностику и аргументацию." },
  { title: "Отчёты для руководителя", description: "После каждого диалога формируется персональная обратная связь и командная аналитика для руководителя." }
];

const audienceItems = [
  {
    title: "B2B Sales Academy",
    audience: "Корпоративные продажи, сложные сделки, работа с ЛПР и длинным циклом.",
    result: "Рост качества диагностики, аргументации ценности и ведения сделки по этапам.",
    skills: ["SPIN и discovery", "Работа с ЛПР", "Value selling", "Коммерческое предложение", "Следующий шаг"]
  },
  {
    title: "B2C Sales Academy",
    audience: "Розница, сервис, консультационные продажи, рост среднего чека.",
    result: "Выше конверсия в покупку, лучше сервис и устойчивый upsell.",
    skills: ["Выявление потребности", "Cross-sell", "Upsell", "Работа с сомнениями"]
  },
  {
    title: "Hunter Academy",
    audience: "SDR, лидогенерация, холодные касания и выход на первую встречу.",
    result: "Сильнее первые касания, больше назначенных встреч и выше качество квалификации.",
    skills: ["Холодный outreach", "Квалификация", "Обработка отказа", "Call-to-action"]
  },
  {
    title: "Account Academy",
    audience: "Фермеры, аккаунт-менеджеры, развитие текущей базы и удержание.",
    result: "Рост удержания, допродаж и стратегической работы с текущими клиентами.",
    skills: ["Retention", "Upsell", "Cross-sell", "Развитие портфеля"]
  },
  {
    title: "Teach Sales Academy",
    audience: "Продажа сложных решений, ПО, оборудования, тендеров и внедрений.",
    result: "Команда лучше продаёт экспертность, сложную ценность и длинные циклы согласования.",
    skills: ["Consultative selling", "Тендерная логика", "ROI-аргументация", "Продажа изменений"]
  }
];

const featureItems = [
  { title: "Онлайн-контент", description: "Курсы, стандарты, playbooks и материалы по продукту в одном окне для быстрого доступа и обновления.", icon: "content" as const },
  { title: "Практика и симуляции", description: "ИИ-тренажёр, role-play и сценарии под реальные этапы сделки, возражения и переговоры.", icon: "practice" as const },
  { title: "Оценка компетенций", description: "Профили навыков, scorecards и прозрачная диагностика сильных сторон и пробелов.", icon: "competency" as const },
  { title: "Live-разборы и коучинг", description: "Совместные сессии, case review и рекомендации для руководителей и внутренних тренеров.", icon: "coaching" as const },
  { title: "Управление результатом", description: "Единые стандарты продаж, маршруты развития и контроль прохождения ключевых практик.", icon: "results" as const },
  { title: "Аналитика KPI", description: "Дашборды по людям и командам, связь навыков с конверсией, выручкой и скоростью выхода на результат.", icon: "analytics" as const }
];

const pricingPlans = [
  { name: "Base", caption: "Быстрый старт для команды, которой нужен ИИ-тренажёр и понятная базовая аналитика.", features: ["ИИ-тренажёр", "Базовая библиотека сценариев", "Базовые отчёты"], cta: "Записаться на демо" },
  { name: "Pro", caption: "Для компаний, которые хотят глубже кастомизировать сценарии и интегрировать платформу в текущий стек.", features: ["Расширенные сценарии", "SCORM / API", "Расширенные отчёты"], cta: "Записаться на демо", featured: true },
  { name: "Premium", caption: "Enterprise-подход для больших команд и сложных контуров обучения.", features: ["Кастомная разработка", "Кастомизация базы знаний", "Архитектура обучения", "Enterprise-возможности"], cta: "Запросить КП" }
];

const securityItems = [
  { title: "Защищённый контур хранения", description: "Данные обучения и сценарии могут храниться в защищённом контуре с учётом требований безопасности компании.", icon: "shield" as const },
  { title: "Облако РФ / on-premise", description: "Поддерживаем варианты развёртывания в российском облаке или во внутреннем периметре компании.", icon: "cloud" as const },
  { title: "API и SCORM/xAPI", description: "Платформа встраивается в существующие процессы обучения, отчётности и передачи данных через стандартные интерфейсы.", icon: "api" as const },
  { title: "Интеграции с LMS", description: "Можно связать платформу с корпоративной LMS, чтобы объединить контент, практику и отчёты в общем контуре.", icon: "lms" as const }
];

const faqItems = [
  { question: "Чем ИИ-тренажёр отличается от обычного курса?", answer: "Курс передаёт знания, а ИИ-тренажёр помогает отработать поведение в реальном диалоге. Сотрудник тренируется, получает обратную связь и видит прогресс по конкретным навыкам." },
  { question: "Можно ли использовать наши продукты, скрипты и возражения?", answer: "Да. Мы адаптируем базу знаний, сценарии и оценку под ваш продукт, сегменты клиентов, типичные возражения и стандарты продаж." },
  { question: "Подходит ли платформа для B2B и B2C продаж?", answer: "Да. Платформа поддерживает разные модели продаж: корпоративные сделки, розницу, сервис, SDR-процессы, работу с текущей базой и экспертные сложные продажи." },
  { question: "Как руководитель видит прогресс команды?", answer: "У руководителя есть индивидуальные и командные отчёты: динамика навыков, прохождение практики, качество диалогов, зоны риска и связь с KPI." },
  { question: "Можно ли интегрировать с нашей LMS?", answer: "Да. Доступны варианты интеграции через API, SCORM/xAPI и внедрение в ваш внутренний учебный контур." }
];

const footerColumns = [
  { title: "Product", links: [{ label: "Платформа", href: "#platform" }, { label: "ИИ-тренажёр", href: "#ai-trainer" }, { label: "Тарифы", href: "#pricing" }] },
  { title: "Company", links: [{ label: "Для кого", href: "#audience" }, { label: "FAQ", href: "#faq" }, { label: "Записаться на демо", href: "/demo" }] },
  { title: "Legal", links: [{ label: "Политика конфиденциальности", href: "#" }, { label: "Пользовательское соглашение", href: "#" }, { label: "Безопасность данных", href: "#" }] },
  { title: "CTA", links: [{ label: "Войти", href: "/login" }, { label: "Запросить КП", href: "/demo" }, { label: "Связаться с нами", href: "/demo" }] }
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-vc-canvas text-vc-ink">
      <div className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(71,139,255,0.1),transparent_32%),radial-gradient(circle_at_85%_8%,rgba(215,201,255,0.16),transparent_20%),linear-gradient(180deg,#FBFCFF_0%,#FDFEFF_100%)]" />
        <Navbar links={navLinks} />
        <Hero
          badge="AI Sales Academy"
          title="Развиваем продавцов до результата в цифрах"
          description="Платформа обучения sales-команд: база знаний, ИИ-тренажёр, практика диалогов, оценка навыков и аналитика KPI в одном контуре."
        />
      </div>
      <ProblemSection items={problemItems} quote="Продавец не должен тренироваться на клиентах." />
      <HowItWorks steps={howItWorksSteps} />
      <AiTrainerSection items={trainerItems} />
      <AudienceSection items={audienceItems} />
      <FeatureGrid items={featureItems} />
      <PricingSection
        plans={pricingPlans}
        enterpriseNote="Для крупных команд доступно развертывание в контуре компании, интеграции с внутренними LMS и индивидуальные технические доработки."
      />
      <SecuritySection items={securityItems} />
      <FaqSection items={faqItems} />
      <FinalCta />
      <Footer columns={footerColumns} />
    </main>
  );
}
