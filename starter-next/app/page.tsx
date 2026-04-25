import { ApiPipelineCard } from "@/components/api-pipeline-card";
import { CrystalField } from "@/components/crystal-field";
import { Nav } from "@/components/nav";
import { OrbitLines } from "@/components/orbit-lines";
import { PricingCard } from "@/components/pricing-card";
import content from "@/content/home.json";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-vc-canvas text-vc-ink">
      <Nav productName={content.productName} />

      <section className="relative min-h-[980px] pt-10">
        <OrbitLines className="opacity-80" />
        <CrystalField />
        <div className="relative z-10 mx-auto w-[min(1200px,calc(100%-48px))]">
          <p className="mb-10 font-mono text-sm uppercase tracking-[0.28em] text-vc-muted">{content.eyebrow}</p>
          <h1 className="max-w-[760px] font-display text-[clamp(58px,9.2vw,116px)] font-[850] leading-[0.94] tracking-[-0.065em] text-vc-ink">
            {content.headline}
          </h1>
          <p className="mt-10 max-w-[650px] text-[clamp(20px,2.1vw,27px)] leading-[1.55] tracking-[-0.025em] text-vc-body">
            {content.subhead}
          </p>
          <div className="mt-16 flex flex-wrap gap-5">
            <a href="#demo" className="rounded-pill border border-vc-border bg-white px-8 py-4 text-lg font-bold tracking-[-0.04em] text-vc-faint shadow-vc-soft transition hover:-translate-y-0.5 hover:text-vc-ink">
              {content.primaryCta}
            </a>
            <a href="#api" className="rounded-pill px-8 py-4 text-lg font-bold tracking-[-0.04em] text-vc-body transition hover:text-vc-blue">
              {content.secondaryCta} →
            </a>
          </div>
        </div>

        <div className="relative z-10 mx-auto mt-36 w-[min(1040px,calc(100%-48px))] text-center">
          <p className="mb-10 font-mono text-sm uppercase tracking-[0.34em] text-vc-faint">Piloting now</p>
          <h2 className="text-[clamp(36px,4.8vw,62px)] font-[850] leading-[1] tracking-[-0.06em] text-vc-ink">
            Trusted by forward-thinking teams
          </h2>
        </div>
      </section>

      <section className="relative py-section">
        <OrbitLines className="opacity-50" />
        <div className="relative z-10 mx-auto w-[min(1120px,calc(100%-48px))] text-center">
          <p className="mb-12 font-mono text-sm uppercase tracking-[0.3em] text-vc-faint">Meet the signal layer</p>
          <h2 className="font-display text-[clamp(48px,7.8vw,96px)] font-[850] leading-[0.96] tracking-[-0.06em] text-vc-ink">
            {content.thesis}
          </h2>
        </div>
      </section>

      <section id="api" className="relative py-section-tight">
        <div className="mx-auto grid w-[min(1200px,calc(100%-48px))] gap-14 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
          <div className="relative pt-4">
            <h2 className="max-w-[560px] text-[clamp(42px,5vw,70px)] font-[850] leading-[1] tracking-[-0.06em] text-vc-ink">
              One API call. One additional field. Complete intelligence.
            </h2>
            <p className="mt-8 max-w-[610px] text-[clamp(20px,2vw,26px)] leading-[1.52] tracking-[-0.025em] text-vc-body">
              Sit inside the existing workflow as a structured output layer: no re-architecture, no separate dashboard, just the signal your product needs.
            </p>
            <div className="mt-14 grid max-w-[520px] grid-cols-2 gap-7 text-xl leading-snug tracking-[-0.04em] text-vc-body">
              <span>Real-time scoring</span>
              <span>Multimodal signal fusion</span>
              <span>Dissonance index output</span>
              <span>Low-latency response</span>
            </div>
          </div>
          <ApiPipelineCard />
        </div>
      </section>

      <section className="py-section">
        <div className="mx-auto w-[min(1120px,calc(100%-48px))] text-center">
          <h2 className="text-[clamp(44px,6.6vw,88px)] font-[850] leading-[1.05] tracking-[-0.06em] text-vc-ink">
            Platforms in <span className="text-vc-blue">sales, hiring, compliance, coaching</span> and risk workflows choose products where deep human understanding meets structured intelligence.
          </h2>
        </div>
      </section>

      <section className="py-section-tight">
        <div className="mx-auto w-[min(1200px,calc(100%-48px))]">
          <p className="mb-8 text-center font-mono text-sm uppercase tracking-[0.3em] text-vc-faint">Packaging</p>
          <h2 className="mb-16 text-center text-[clamp(44px,6vw,84px)] font-[850] leading-none tracking-[-0.06em] text-vc-faint">
            Try it, trust it, scale it.
          </h2>
          <div className="grid gap-10 md:grid-cols-2">
            <PricingCard name="Free" caption="Up to 2 hours of analysis" cta="Start Building" />
            <PricingCard featured name="Pro" caption="Pay as you go" cta="Talk to Sales" />
          </div>
        </div>
      </section>

      <section className="relative py-section-tight">
        <CrystalField className="top-1/3 opacity-50" />
        <div className="relative z-10 mx-auto w-[min(1080px,calc(100%-48px))]">
          <div className="space-y-5">
            {["What signal does the platform return?", "Who is this built for?", "How does it integrate with our app?", "Can we use our own content and workflows?"].map((question) => (
              <button key={question} className="flex w-full items-center justify-between rounded-[24px] border border-vc-border bg-white px-8 py-7 text-left text-2xl font-bold tracking-[-0.04em] text-vc-ink shadow-sm">
                <span>{question}</span>
                <span>⌄</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <footer className="relative border-t border-vc-borderSoft py-20">
        <div className="mx-auto grid w-[min(1200px,calc(100%-48px))] gap-10 md:grid-cols-5">
          {["Product", "Platform", "Developers", "Company", "Legal"].map((title) => (
            <div key={title}>
              <h3 className="mb-6 text-xl font-bold tracking-[-0.04em] text-vc-ink">{title}</h3>
              <div className="space-y-4 text-lg tracking-[-0.035em] text-vc-muted">
                <a className="block" href="#">Overview</a>
                <a className="block" href="#">API</a>
                <a className="block" href="#">Contact</a>
              </div>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-16 flex w-[min(1200px,calc(100%-48px))] items-center justify-between border-t border-vc-borderSoft pt-12 text-vc-muted">
          <div className="text-3xl font-[850] tracking-[-0.07em] text-vc-ink">{content.productName.toLowerCase()}</div>
          <div>© 2026. All rights reserved.</div>
        </div>
      </footer>
    </main>
  );
}
