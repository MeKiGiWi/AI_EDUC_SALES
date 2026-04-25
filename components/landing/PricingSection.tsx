import { Check } from "lucide-react";
import { Container, PillButton, SectionIntro, SurfaceCard } from "@/components/landing/ui";

type PricingPlan = {
  name: string;
  caption: string;
  features: string[];
  cta: string;
  featured?: boolean;
};

type PricingSectionProps = {
  plans: PricingPlan[];
  enterpriseNote: string;
};

export function PricingSection({ plans, enterpriseNote }: PricingSectionProps) {
  return (
    <section id="pricing" className="py-[88px] sm:py-[112px]">
      <Container>
        <SectionIntro
          eyebrow="Тарифы"
          title="Пакеты под масштаб команды и глубину внедрения"
          description="Без перегруженных таблиц: только ключевые отличия по сценариям, интеграциям, отчётности и уровню кастомизации."
          align="center"
        />

        <div className="mt-10 grid gap-4 lg:mt-14 lg:grid-cols-3">
          {plans.map((plan) => (
            <SurfaceCard key={plan.name} className={`flex h-full flex-col p-6 sm:p-7 ${plan.featured ? "border-vc-blue/35" : ""}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-[34px] font-[850] leading-none tracking-[-0.07em] text-vc-ink">{plan.name}</h3>
                  <p className="mt-3 text-sm leading-7 text-vc-body">{plan.caption}</p>
                </div>
                {plan.featured ? (
                  <span className="rounded-pill border border-vc-blue/20 bg-vc-blue/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-vc-blue">
                    popular
                  </span>
                ) : null}
              </div>
              <div className="my-6 h-px bg-vc-border" />
              <div className="space-y-3">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3 text-sm leading-7 text-vc-body">
                    <span className="mt-1 rounded-full bg-vc-blue/10 p-1 text-vc-blue">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              <PillButton href="/demo" className="mt-8 w-full">
                {plan.cta}
              </PillButton>
            </SurfaceCard>
          ))}
        </div>

        <SurfaceCard className="mt-6 p-6 sm:p-7">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-vc-muted">Enterprise note</p>
          <p className="mt-3 max-w-[960px] text-sm leading-7 text-vc-body sm:text-base">{enterpriseNote}</p>
        </SurfaceCard>
      </Container>
    </section>
  );
}
