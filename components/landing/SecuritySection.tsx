import { Cloud, DatabaseZap, LockKeyhole, Network } from "lucide-react";
import { Container, SectionIntro, SurfaceCard } from "@/components/landing/ui";

type SecurityItem = {
  title: string;
  description: string;
  icon: "shield" | "cloud" | "api" | "lms";
};

const icons = {
  shield: LockKeyhole,
  cloud: Cloud,
  api: DatabaseZap,
  lms: Network
} satisfies Record<SecurityItem["icon"], React.ComponentType<{ className?: string }>>;

export function SecuritySection({ items }: { items: SecurityItem[] }) {
  return (
    <section className="py-[88px] sm:py-[112px]">
      <Container>
        <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:gap-12">
          <SectionIntro
            eyebrow="Security & integrations"
            title="Enterprise-ready контур для обучения и развития"
            description="Поддерживаем защищённое хранение данных, интеграции с внутренними системами и варианты развёртывания под требования вашей ИТ-среды."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((item) => {
              const Icon = icons[item.icon];

              return (
                <SurfaceCard key={item.title} className="p-5 sm:p-6">
                  <span className="inline-flex rounded-[18px] border border-vc-blue/15 bg-vc-blue/10 p-3 text-vc-blue">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 text-[22px] font-[800] leading-tight tracking-[-0.05em] text-vc-ink">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-vc-body">{item.description}</p>
                </SurfaceCard>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
