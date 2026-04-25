import { Container, SectionIntro, SurfaceCard } from "@/components/landing/ui";

type AudienceCard = {
  title: string;
  audience: string;
  result: string;
  skills: string[];
};

export function AudienceSection({ items }: { items: AudienceCard[] }) {
  return (
    <section id="audience" className="py-[88px] sm:py-[112px]">
      <Container>
        <SectionIntro
          eyebrow="Направления академии"
          title="Выберите направление обучения под ваши задачи"
          description="Собираем академию под тип продаж, цикл сделки и зону роста команды, чтобы обучение сразу ложилось на реальную воронку."
        />
        <div className="mt-10 grid gap-4 lg:mt-14 lg:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <SurfaceCard key={item.title} className="flex h-full flex-col p-5 sm:p-6">
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-vc-muted">academy track</p>
              <h3 className="mt-4 text-[28px] font-[850] leading-[1.02] tracking-[-0.06em] text-vc-ink">{item.title}</h3>
              <div className="mt-5 space-y-4 text-sm leading-7 text-vc-body">
                <p>
                  <span className="font-semibold text-vc-ink">Для кого:</span> {item.audience}
                </p>
                <p>
                  <span className="font-semibold text-vc-ink">Результат:</span> {item.result}
                </p>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {item.skills.map((skill) => (
                  <span key={skill} className="rounded-pill border border-vc-border bg-white px-3 py-2 text-xs font-medium text-vc-body">
                    {skill}
                  </span>
                ))}
              </div>
            </SurfaceCard>
          ))}
        </div>
      </Container>
    </section>
  );
}
