import { Bot, Gauge, MessagesSquare, ShieldCheck } from "lucide-react";
import { Container, PillButton, SectionIntro, SurfaceCard } from "@/components/landing/ui";

type TrainerFeature = {
  title: string;
  description: string;
};

export function AiTrainerSection({ items }: { items: TrainerFeature[] }) {
  return (
    <section id="ai-trainer" className="relative py-[88px] sm:py-[112px]">
      <Container>
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-12">
          <div>
            <SectionIntro
              eyebrow="ИИ-тренажёр"
              title="ИИ-тренажёр, который имитирует реальные диалоги с клиентами"
              description="Менеджер тренируется в безопасной среде, получает структурированную обратную связь и видит, как растут конкретные компетенции от сценария к сценарию."
            />
            <div className="mt-8 space-y-4">
              {items.map((item) => (
                <div key={item.title} className="rounded-[24px] border border-vc-border bg-white/75 px-5 py-4 shadow-[0_14px_40px_rgba(50,72,120,0.07)]">
                  <p className="text-base font-semibold tracking-[-0.03em] text-vc-ink">{item.title}</p>
                  <p className="mt-2 text-sm leading-7 text-vc-body">{item.description}</p>
                </div>
              ))}
            </div>
            <PillButton href="/demo" className="mt-8">
              Записаться на демо
            </PillButton>
          </div>

          <SurfaceCard className="relative overflow-hidden p-5 sm:p-7">
            <div className="absolute right-8 top-8 h-28 w-28 rounded-full bg-vc-blue/15 blur-3xl" aria-hidden="true" />
            <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
              <div className="rounded-[28px] border border-vc-border bg-white/90 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-vc-muted">Mock dialogue</p>
                  <MessagesSquare className="h-4 w-4 text-vc-blue" />
                </div>
                <div className="mt-4 space-y-3">
                  <Bubble role="client" text="У нас уже сильные продавцы. Что поменяется после запуска?" />
                  <Bubble role="manager" text="Покажем разницу между знанием продукта и навыком продажи на ваших сценариях и KPI." />
                  <Bubble role="client" text="Важно, чтобы можно было обучать и новых, и сильных аккаунтов." />
                  <Bubble role="manager" text="Сценарии адаптируются под роль, уровень и сегмент клиента." />
                </div>
              </div>

              <div className="space-y-4">
                <SurfaceCard className="p-4">
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-vc-blue/10 p-2 text-vc-blue">
                      <Gauge className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-vc-muted">Scorecard</p>
                      <p className="mt-1 text-2xl font-[850] tracking-[-0.06em] text-vc-ink">Навык продаж: 86%</p>
                    </div>
                  </div>
                </SurfaceCard>

                <SurfaceCard className="p-4">
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-vc-lilac/20 p-2 text-vc-blue">
                      <Bot className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-vc-muted">AI feedback</p>
                      <p className="mt-1 text-sm leading-6 text-vc-body">Сильная диагностика боли, нужно усилить фиксацию следующего шага и работу с риском бездействия.</p>
                    </div>
                  </div>
                </SurfaceCard>

                <SurfaceCard className="p-4">
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-vc-blue/10 p-2 text-vc-blue">
                      <ShieldCheck className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-vc-muted">Компетенции</p>
                      <ul className="mt-2 space-y-2 text-sm text-vc-body">
                        {["Выявление потребностей", "Аргументация ценности", "Работа с возражениями", "Фиксация следующего шага"].map((item) => (
                          <li key={item} className="rounded-[18px] border border-vc-border bg-vc-canvas px-3 py-2">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </SurfaceCard>
              </div>
            </div>
          </SurfaceCard>
        </div>
      </Container>
    </section>
  );
}

function Bubble({ role, text }: { role: "client" | "manager"; text: string }) {
  return (
    <div
      className={`max-w-[90%] rounded-[20px] px-4 py-3 text-sm leading-6 ${
        role === "client" ? "border border-vc-border bg-vc-canvas text-vc-body" : "ml-auto border border-vc-blue/20 bg-vc-blue/10 text-vc-ink"
      }`}
    >
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-vc-muted">{role === "client" ? "Клиент" : "Менеджер"}</p>
      <p>{text}</p>
    </div>
  );
}
