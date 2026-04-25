import { CheckCircle2, FileJson, Radio, Video } from "lucide-react";

export function ApiPipelineCard() {
  return (
    <div className="rounded-[36px] border border-vc-border bg-white/90 p-8 shadow-vc-card md:p-12">
      <div className="mb-12 flex items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <CheckCircle2 className="h-6 w-6 text-vc-blue" />
          <span className="font-mono text-sm uppercase tracking-[0.28em] text-vc-blueSoft">Signal API</span>
        </div>
        <div className="text-right text-xs uppercase tracking-[0.18em] text-vc-faint">structured output</div>
      </div>

      <div className="grid gap-7 md:grid-cols-3 md:items-start">
        <Stage icon={<Video className="h-8 w-8" />} label="Input" title="Video or audio stream" />
        <Stage icon={<Radio className="h-8 w-8" />} label="Engine" title="Behavioral signal fusion" active />
        <Stage icon={<FileJson className="h-8 w-8" />} label="Output" title="JSON intelligence score" />
      </div>

      <pre className="mt-16 overflow-hidden rounded-[24px] bg-vc-canvas px-6 py-6 font-mono text-[13px] leading-7 text-vc-muted ring-1 ring-vc-borderSoft">
{`{
  "confidence": 0.7204,
  "review_recommended": false,
  "signal_bands": {
    "aligned_pct": 68.4,
    "neutral_pct": 14.2,
    "dissonance_pct": 17.4
  }
}`}
      </pre>

      <div className="mt-8 flex flex-wrap gap-3">
        <span className="rounded-pill border border-vc-border bg-white px-5 py-3 text-sm font-semibold text-vc-body">3 modalities fused</span>
        <span className="rounded-pill border border-vc-border bg-white px-5 py-3 text-sm font-semibold text-vc-body">JSON / REST / WebSocket</span>
        <span className="rounded-pill border border-vc-border bg-white px-5 py-3 text-sm font-semibold text-vc-body">&lt;200ms</span>
      </div>
    </div>
  );
}

function Stage({ icon, label, title, active = false }: { icon: React.ReactNode; label: string; title: string; active?: boolean }) {
  return (
    <div className="text-center">
      <div className={`mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[22px] border bg-white ${active ? "border-vc-blue shadow-vc-glow text-vc-blue" : "border-vc-blue/45 text-vc-blue"}`}>
        {icon}
      </div>
      <div className="font-mono text-xs uppercase tracking-[0.32em] text-vc-blueSoft">{label}</div>
      <div className="mt-3 text-lg font-medium leading-snug tracking-[-0.03em] text-vc-body">{title}</div>
    </div>
  );
}
