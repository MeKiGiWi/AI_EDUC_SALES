import { Container, PillButton } from "@/components/landing/ui";

type FooterColumn = {
  title: string;
  links: { label: string; href: string }[];
};

export function Footer({ columns }: { columns: FooterColumn[] }) {
  return (
    <footer className="border-t border-vc-border/80 py-14 sm:py-16">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1.9fr] lg:gap-12">
          <div>
            <a href="#" className="text-[28px] font-[850] tracking-[-0.07em] text-vc-ink">
              AI Sales Academy
            </a>
            <p className="mt-4 max-w-[360px] text-sm leading-7 text-vc-body">
              Платформа развития продавцов для команд, которым важно превращать обучение в стабильные продажи, единые стандарты и прозрачную аналитику.
            </p>
            <PillButton href="/demo" className="mt-6">
              Записаться на демо
            </PillButton>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {columns.map((column) => (
              <div key={column.title}>
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-vc-muted">{column.title}</h3>
                <div className="mt-4 space-y-3">
                  {column.links.map((link) => (
                    <a key={link.label} href={link.href} className="block text-sm leading-7 text-vc-body transition hover:text-vc-ink">
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 border-t border-vc-border/70 pt-6 text-sm text-vc-faint">
          © 2026 AI Sales Academy. Все права защищены.
        </div>
      </Container>
    </footer>
  );
}
