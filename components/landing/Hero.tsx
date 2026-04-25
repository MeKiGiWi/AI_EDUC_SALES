import { ArrowRight, Sparkles } from "lucide-react";
import { CrystalField } from "@/components/crystal-field";
import { OrbitLines } from "@/components/orbit-lines";
import { MetricCards } from "@/components/landing/MetricCards";
import { Container, GhostButton, PillButton, SurfaceCard } from "@/components/landing/ui";

type HeroProps = {
  badge: string;
  title: string;
  description: string;
};

const impactCards = [
  {
    label: "Повысить эффективность",
    description: "Снизить ошибки, ускорить выполнение задач",
    value: "в 2,5 раза",
    accent: "opacity-90"
  },
  {
    label: "Масштабировать бизнес",
    description: "Внедрить единые стандарты и обучение",
    value: "73%",
    accent: "bg-[radial-gradient(circle_at_top_left,rgba(118,228,199,0.18),transparent_70%)]"
  },
  {
    label: "Экономить бюджет",
    description: "Связать обучение с KPI и процессами",
    value: "до 30% экономии",
    accent: "bg-[radial-gradient(circle_at_top_left,rgba(111,167,255,0.16),rgba(207,226,255,0.08),transparent_72%)]"
  },
  {
    label: "Ускорить внедрение изменений",
    description: "К скорости адаптации",
    value: "+30–50%",
    accent: "bg-[radial-gradient(circle_at_top_left,rgba(215,201,255,0.18),transparent_72%)]"
  }
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
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.72fr)] lg:gap-12">
          <div className="max-w-[760px] pt-8 sm:pt-12 lg:pt-20">
            <div className="inline-flex items-center gap-2 rounded-pill border border-vc-blue/20 bg-white/85 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-vc-blue shadow-[0_10px_30px_rgba(71,139,255,0.08)] sm:text-[12px]">
              <Sparkles className="h-3.5 w-3.5" />
              {badge}
            </div>
            <h1 className="mt-6 max-w-[11ch] font-display text-[clamp(48px,16vw,112px)] font-[850] leading-[0.98] tracking-[-0.025em] text-vc-ink sm:mt-7">
              {title}
            </h1>
            <p className="mt-6 max-w-[660px] text-[17px] leading-8 tracking-[-0.015em] text-vc-body sm:text-[20px] sm:leading-[1.62]">
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

          <div className="relative hidden pb-3 lg:block lg:pb-0">
            <div className="absolute left-8 top-8 h-32 w-32 rounded-full bg-vc-blue/15 blur-3xl" aria-hidden="true" />
            <div className="absolute bottom-10 right-10 h-36 w-36 rounded-full bg-vc-lilac/30 blur-3xl" aria-hidden="true" />
            <SurfaceCard className="relative overflow-hidden p-6 lg:p-7">
              <div className="absolute inset-x-8 top-0 h-px bg-vc-line-fade" aria-hidden="true" />
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-vc-muted sm:text-[12px]">Влияние на бизнес</p>
              <h2 className="mt-3 max-w-[12ch] text-[32px] font-[800] leading-[1.04] tracking-[-0.025em] text-vc-ink">
                Обучение становится управляемым результатом для бизнеса
              </h2>
              <p className="mt-4 max-w-[34ch] text-[15px] leading-7 tracking-[-0.01em] text-vc-body">
                На первом экране руководитель видит не красивый интерфейс, а коммерческий эффект: скорость адаптации, единые стандарты, экономию бюджета и прогнозируемый рост качества работы команды.
              </p>
              <div className="mt-6 space-y-3">
                {[
                  { label: "Скорость адаптации", value: "+30–50%" },
                  { label: "Единые стандарты", value: "73%" },
                  { label: "Экономия бюджета", value: "до 30%" }
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-[24px] border border-vc-border bg-white/80 px-4 py-4">
                    <div>
                      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-vc-faint">{item.label}</p>
                      <p className="mt-2 text-xl font-semibold tracking-[-0.02em] text-vc-ink">{item.value}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-vc-blue" />
                  </div>
                ))}
              </div>
            </SurfaceCard>
          </div>
        </div>

        <div className="mt-10 sm:mt-12">
          <MetricCards items={impactCards} compact />
        </div>
      </Container>
    </section>
  );
}
