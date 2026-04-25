import { Container, GhostButton, PillButton, SurfaceCard } from "@/components/landing/ui";

export function FinalCta() {
  return (
    <section id="demo" className="py-[88px] sm:py-[112px]">
      <Container>
        <SurfaceCard className="relative overflow-hidden px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-14">
          <div className="absolute right-[-40px] top-[-30px] h-40 w-40 rounded-full bg-vc-blue/15 blur-3xl" aria-hidden="true" />
          <div className="absolute bottom-[-60px] left-[-10px] h-44 w-44 rounded-full bg-vc-lilac/20 blur-3xl" aria-hidden="true" />
          <div className="relative z-10 max-w-[860px]">
            <p className="font-mono text-[12px] uppercase tracking-eyebrow text-vc-muted">Demo session</p>
            <h2 className="mt-5 font-display text-[clamp(38px,11vw,76px)] font-[850] leading-[0.95] tracking-hero text-vc-ink">
              Покажем, как обучение продавцов может влиять на выручку
            </h2>
            <p className="mt-5 max-w-[680px] text-base leading-7 text-vc-body sm:text-lg sm:leading-8">
              Разберём вашу команду, роли, сценарии продаж и покажем, как запустить Академию продаж под ваши KPI.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <PillButton href="/demo" className="w-full sm:w-auto">
                Записаться на демо
              </PillButton>
              <GhostButton href="/login" className="w-full sm:w-auto" ariaLabel="Войти">
                Войти
              </GhostButton>
            </div>
          </div>
        </SurfaceCard>
      </Container>
    </section>
  );
}
