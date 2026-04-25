import { ChevronDown } from "lucide-react";
import { Container, SectionIntro } from "@/components/landing/ui";

type FaqItem = {
  question: string;
  answer: string;
};

export function FaqSection({ items }: { items: FaqItem[] }) {
  return (
    <section id="faq" className="py-[88px] sm:py-[112px]">
      <Container>
        <SectionIntro
          eyebrow="FAQ"
          title="Частые вопросы о запуске академии продаж"
          description="Собрали вопросы, которые чаще всего возникают у L&D, коммерческих директоров и руководителей продаж перед запуском."
          align="center"
        />

        <div className="mt-10 space-y-4">
          {items.map((item) => (
            <details key={item.question} className="group rounded-[28px] border border-vc-border bg-white/90 px-5 py-5 shadow-[0_18px_50px_rgba(50,72,120,0.07)] sm:px-8 sm:py-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-[20px] font-[800] leading-tight tracking-[-0.04em] text-vc-ink sm:text-[24px]">
                <span>{item.question}</span>
                <span className="rounded-full border border-vc-border bg-white p-2 text-vc-body transition group-open:rotate-180">
                  <ChevronDown className="h-4 w-4" />
                </span>
              </summary>
              <p className="pt-4 text-sm leading-7 text-vc-body sm:pt-5 sm:text-base">{item.answer}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}
