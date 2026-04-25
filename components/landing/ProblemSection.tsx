import { Container, SectionIntro, SurfaceCard } from "@/components/landing/ui";

type ProblemSectionProps = {
  items: string[];
  quote: string;
};

export function ProblemSection({ items, quote }: ProblemSectionProps) {
  return (
    <section className="relative py-[88px] sm:py-[112px]">
      <Container>
        <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:gap-12">
          <SectionIntro
            eyebrow="Почему обучение буксует"
            title="Почему обычное обучение не превращается в навык"
            description="Когда обучение оторвано от ежедневной практики продавца, знания остаются в LMS, а не в реальных разговорах с клиентами."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((item, index) => (
              <SurfaceCard key={item} className="p-5 sm:p-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-vc-faint">0{index + 1}</p>
                <p className="mt-3 text-base leading-7 tracking-[-0.025em] text-vc-ink sm:text-lg">{item}</p>
              </SurfaceCard>
            ))}
          </div>
        </div>

        <SurfaceCard className="mt-8 p-7 sm:mt-10 sm:p-9">
          <p className="max-w-[820px] text-[28px] font-[800] leading-[1.12] tracking-[-0.025em] text-vc-ink sm:text-[42px]">
            {quote}
          </p>
        </SurfaceCard>
      </Container>
    </section>
  );
}
