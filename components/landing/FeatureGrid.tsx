import { BarChart3, BookOpen, BriefcaseBusiness, ChartNoAxesCombined, GraduationCap, MessagesSquare } from "lucide-react";
import { Container, SectionIntro, SurfaceCard } from "@/components/landing/ui";

type FeatureItem = {
  title: string;
  description: string;
  icon: "content" | "practice" | "competency" | "coaching" | "results" | "analytics";
};

const icons = {
  content: BookOpen,
  practice: MessagesSquare,
  competency: GraduationCap,
  coaching: BriefcaseBusiness,
  results: ChartNoAxesCombined,
  analytics: BarChart3
} satisfies Record<FeatureItem["icon"], React.ComponentType<{ className?: string }>>;

export function FeatureGrid({ items }: { items: FeatureItem[] }) {
  return (
    <section id="platform" className="py-[88px] sm:py-[112px]">
      <Container>
        <SectionIntro
          eyebrow="Capabilities"
          title="Всё, что нужно sales-команде для системного развития"
          description="Контент, практика, обратная связь, coaching и аналитика соединены в одной платформе, поэтому развитие не рассыпается между инструментами."
          align="center"
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => {
            const Icon = icons[item.icon];

            return (
              <SurfaceCard key={item.title} className="p-5 sm:p-6">
                <span className="inline-flex rounded-[20px] border border-vc-blue/15 bg-vc-blue/10 p-3 text-vc-blue">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-[24px] font-[800] leading-[1.08] tracking-[-0.025em] text-vc-ink">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-vc-body">{item.description}</p>
              </SurfaceCard>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
