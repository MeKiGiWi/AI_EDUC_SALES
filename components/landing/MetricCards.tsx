import { Container, SectionIntro, SurfaceCard } from "@/components/landing/ui";

type Metric = {
  value: string;
  label: string;
  description: string;
  accent?: string;
};

export function MetricCards({
  items,
  compact = false
}: {
  items: Metric[];
  compact?: boolean;
}) {
  return (
    <section className={compact ? "py-0" : "py-[88px] sm:py-[104px]"}>
      <Container>
        {compact ? null : (
          <SectionIntro
            eyebrow="Влияние на бизнес"
            title="Обучение, которое становится измеримым коммерческим результатом"
            description="Показываем руководителям не только прохождение контента, а скорость выхода в продуктивность, динамику навыков и влияние на цифры команды."
          />
        )}
        <div className={`${compact ? "mt-0" : "mt-10 sm:mt-12"} grid gap-4 sm:grid-cols-2 xl:grid-cols-4`}>
          {items.map((item) => (
            <SurfaceCard
              key={item.label}
              className={`relative overflow-hidden border-[rgba(166,190,230,0.55)] p-6 shadow-[0_28px_70px_rgba(39,61,103,0.12)] sm:p-7 ${
                compact ? "min-h-[220px]" : ""
              }`}
            >
              <div
                className={`absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_left,rgba(111,167,255,0.16),transparent_68%)] ${
                  item.accent ?? ""
                }`}
                aria-hidden="true"
              />
              <div className="relative z-10">
                <p className="text-[15px] font-semibold tracking-[-0.02em] text-vc-ink sm:text-[18px]">{item.label}</p>
                <p className="mt-3 max-w-[18ch] text-sm leading-6 tracking-[-0.01em] text-vc-body sm:text-[15px] sm:leading-7">{item.description}</p>
                <p className="mt-6 font-display text-[36px] font-[850] leading-[1.02] tracking-[-0.03em] text-vc-ink sm:text-[48px]">
                  {item.value}
                </p>
              </div>
            </SurfaceCard>
          ))}
        </div>
      </Container>
    </section>
  );
}
