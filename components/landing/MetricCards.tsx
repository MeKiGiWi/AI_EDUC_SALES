import { Container, SectionIntro, SurfaceCard } from "@/components/landing/ui";

type Metric = {
  value: string;
  label: string;
  description: string;
};

export function MetricCards({ items }: { items: Metric[] }) {
  return (
    <section className="py-[88px] sm:py-[104px]">
      <Container>
        <SectionIntro
          eyebrow="Business impact"
          title="Обучение, которое становится измеримым коммерческим результатом"
          description="Показываем руководителям не только прохождение контента, а скорость выхода в продуктивность, динамику навыков и влияние на цифры команды."
        />
        <div className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2 xl:grid-cols-4">
          {items.map((item) => (
            <SurfaceCard key={item.label} className="p-6 sm:p-7">
              <p className="font-display text-[40px] font-[850] leading-none tracking-[-0.08em] text-vc-ink sm:text-[54px]">{item.value}</p>
              <p className="mt-4 text-lg font-semibold tracking-[-0.04em] text-vc-ink">{item.label}</p>
              <p className="mt-3 text-sm leading-7 text-vc-body sm:text-[15px]">{item.description}</p>
            </SurfaceCard>
          ))}
        </div>
      </Container>
    </section>
  );
}
