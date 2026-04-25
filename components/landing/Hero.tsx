import { ArrowRight, Sparkles, TrendingUp } from "lucide-react";
import { CrystalField } from "@/components/crystal-field";
import { OrbitLines } from "@/components/orbit-lines";
import { Container, GhostButton, PillButton, SurfaceCard } from "@/components/landing/ui";

type HeroProps = {
  badge: string;
  title: string;
  description: string;
};

const scoreBars = [
  { label: "Вопросы", value: "92%" },
  { label: "Выявление боли", value: "84%" },
  { label: "Работа с возражениями", value: "79%" }
];

export function Hero({ badge, title, description }: HeroProps) {
  return (
    <section className="relative overflow-hidden pb-16 pt-8 sm:pb-20 md:pb-24 md:pt-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(71,139,255,0.14),transparent_30%),radial-gradient(circle_at_80%_18%,rgba(215,201,255,0.18),transparent_22%),linear-gradient(180deg,#FBFCFF_0%,#FDFEFF_100%)]" />
      <div className="absolute inset-x-0 top-10 h-[420px] sm:h-[520px]">
        <OrbitLines className="hidden opacity-50 md:block" />
        <CrystalField className="opacity-60" />
      </div>

      <Container className="relative z-10">
        <div className="grid gap-10 md:items-center lg:grid-cols-[minmax(0,0.92fr)_minmax(320px,0.88fr)] lg:gap-14">
          <div className="max-w-[680px] pt-8 sm:pt-12 lg:pt-20">
            <div className="inline-flex items-center gap-2 rounded-pill border border-vc-blue/20 bg-white/85 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-vc-blue shadow-[0_10px_30px_rgba(71,139,255,0.08)] sm:text-[12px]">
              <Sparkles className="h-3.5 w-3.5" />
              {badge}
            </div>
            <h1 className="mt-6 max-w-[10ch] font-display text-[clamp(48px,16vw,112px)] font-[850] leading-[0.92] tracking-hero text-vc-ink sm:mt-7">
              {title}
            </h1>
            <p className="mt-6 max-w-[620px] text-[17px] leading-8 tracking-[-0.025em] text-vc-body sm:text-[20px] sm:leading-[1.6]">
              {description}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap">
              <PillButton href="/demo" className="w-full sm:w-auto">
                Записаться на демо
              </PillButton>
              <GhostButton href="#how-it-works" className="w-full sm:w-auto" ariaLabel="Посмотреть, как работает">
                Посмотреть, как работает
              </GhostButton>
            </div>
            <div className="mt-8 flex flex-wrap gap-3 text-sm text-vc-muted sm:mt-10">
              {["Онлайн-обучение", "ИИ-тренажёр", "Оценка навыков", "KPI-аналитика"].map((item) => (
                <span key={item} className="rounded-pill border border-vc-border bg-white/80 px-4 py-2 shadow-sm">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="relative pb-3 lg:pb-0">
            <div className="absolute left-8 top-8 h-32 w-32 rounded-full bg-vc-blue/15 blur-3xl" aria-hidden="true" />
            <div className="absolute bottom-10 right-10 h-36 w-36 rounded-full bg-vc-lilac/30 blur-3xl" aria-hidden="true" />
            <SurfaceCard className="relative overflow-hidden p-5 sm:p-6 lg:p-7">
              <div className="absolute inset-x-8 top-0 h-px bg-vc-line-fade" aria-hidden="true" />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-vc-muted sm:text-[12px]">AI-trainer session</p>
                  <h2 className="mt-2 text-2xl font-[800] tracking-[-0.05em] text-vc-ink sm:text-[30px]">Симуляция переговоров</h2>
                </div>
                <span className="rounded-pill border border-vc-blue/20 bg-vc-blue/10 px-3 py-2 text-xs font-semibold text-vc-blue">
                  live score
                </span>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[1.18fr_0.82fr]">
                <div className="rounded-[28px] border border-vc-border bg-white/90 p-4 shadow-[0_10px_40px_rgba(50,72,120,0.08)] sm:p-5">
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.22em] text-vc-faint">
                    <span>Диалог</span>
                    <span>адаптивный сценарий</span>
                  </div>
                  <div className="mt-4 flex flex-col space-y-3">
                    <ChatBubble role="client" text="Нас уже обучали. В продажах это ничего не меняет." />
                    <ChatBubble role="manager" text="Понял. Давайте покажу, как мы связываем тренировки с KPI команды и скоростью выхода новичков." />
                    <ChatBubble role="coach" text="Сильный ответ. Добавьте уточняющий вопрос про текущую конверсию и цикл сделки." />
                  </div>
                </div>

                <div className="space-y-4">
                  <SurfaceCard className="p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-vc-muted">Навык продаж</p>
                        <p className="mt-2 text-4xl font-[850] tracking-[-0.07em] text-vc-ink">86%</p>
                      </div>
                      <div className="rounded-full border border-vc-blue/20 bg-vc-blue/10 p-3 text-vc-blue">
                        <TrendingUp className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-vc-borderSoft">
                      <div className="h-full w-[86%] rounded-full bg-[linear-gradient(90deg,#8AB6FF,#478BFF)]" />
                    </div>
                  </SurfaceCard>

                  <SurfaceCard className="p-4 sm:p-5">
                    <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-vc-muted">Компетенции</p>
                    <div className="mt-4 space-y-4">
                      {scoreBars.map((item) => (
                        <div key={item.label}>
                          <div className="mb-2 flex items-center justify-between text-sm text-vc-body">
                            <span>{item.label}</span>
                            <span className="font-semibold text-vc-ink">{item.value}</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-vc-borderSoft">
                            <div
                              className="h-full rounded-full bg-[linear-gradient(90deg,rgba(138,182,255,0.95),rgba(71,139,255,1))]"
                              style={{ width: item.value }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </SurfaceCard>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  { label: "KPI trend", value: "+18%" },
                  { label: "Время ответа", value: "1.4 мин" },
                  { label: "Готовность к звонку", value: "12 кейсов" }
                ].map((item) => (
                  <div key={item.label} className="rounded-[24px] border border-vc-border bg-vc-canvas/70 px-4 py-4">
                    <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-vc-faint">{item.label}</p>
                    <p className="mt-3 flex items-center gap-2 text-lg font-semibold tracking-[-0.04em] text-vc-ink">
                      {item.value}
                      <ArrowRight className="h-4 w-4 text-vc-blue" />
                    </p>
                  </div>
                ))}
              </div>
            </SurfaceCard>
          </div>
        </div>
      </Container>
    </section>
  );
}

function ChatBubble({ role, text }: { role: "client" | "manager" | "coach"; text: string }) {
  const styles = {
    client: "self-start rounded-[22px] border border-vc-border bg-vc-canvas text-vc-body",
    manager: "self-end rounded-[22px] border border-vc-blue/20 bg-vc-blue/10 text-vc-ink",
    coach: "self-start rounded-[22px] border border-vc-lilac/30 bg-vc-lilac/10 text-vc-body"
  } satisfies Record<string, string>;

  const labels = {
    client: "Клиент",
    manager: "Менеджер",
    coach: "AI coach"
  } satisfies Record<string, string>;

  return (
    <div className={`max-w-[92%] px-4 py-3 text-sm leading-6 tracking-[-0.02em] shadow-sm ${styles[role]}`}>
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-vc-muted">{labels[role]}</div>
      <p>{text}</p>
    </div>
  );
}
