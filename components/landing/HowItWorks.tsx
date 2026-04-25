import { ArrowRight } from "lucide-react";
import { Container, SectionIntro, SurfaceCard } from "@/components/landing/ui";

type Step = {
  title: string;
  description: string;
};

export function HowItWorks({ steps }: { steps: Step[] }) {
  return (
    <section id="how-it-works" className="py-[88px] sm:py-[112px]">
      <Container>
        <SectionIntro
          eyebrow="Как работает платформа"
          title="Единый контур развития продавцов: от знаний до KPI"
          description="Каждый этап дополняет следующий: база знаний превращается в практику, практика в измеримый навык, а навык в управляемый коммерческий результат."
          align="center"
        />

        <div className="mt-10 grid gap-4 lg:mt-14 lg:grid-cols-5">
          {steps.map((step, index) => (
            <div key={step.title} className="relative">
              <SurfaceCard className="h-full p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-vc-muted">0{index + 1}</span>
                  <span className="rounded-pill border border-vc-blue/15 bg-vc-blue/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-vc-blue">
                    stage
                  </span>
                </div>
                <h3 className="mt-6 text-[24px] font-[800] leading-[1.02] tracking-[-0.05em] text-vc-ink">{step.title}</h3>
                <p className="mt-4 text-sm leading-7 text-vc-body sm:text-[15px]">{step.description}</p>
              </SurfaceCard>
              {index < steps.length - 1 ? (
                <div className="pointer-events-none hidden lg:absolute lg:right-[-18px] lg:top-1/2 lg:flex lg:h-9 lg:w-9 lg:-translate-y-1/2 lg:items-center lg:justify-center lg:rounded-full lg:border lg:border-vc-border lg:bg-white">
                  <ArrowRight className="h-4 w-4 text-vc-blue" />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
