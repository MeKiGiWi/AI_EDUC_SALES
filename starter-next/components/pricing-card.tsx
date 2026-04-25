import { Headphones, Layers3, Video } from "lucide-react";

export function PricingCard({ featured = false, name, caption, cta }: { featured?: boolean; name: string; caption: string; cta: string }) {
  return (
    <article className={`rounded-[32px] border bg-white p-9 shadow-vc-soft ${featured ? "border-vc-blue/35" : "border-vc-border"}`}>
      <h3 className="text-5xl font-[850] tracking-[-0.06em] text-vc-ink">{name}</h3>
      <p className="mt-5 text-xl tracking-[-0.03em] text-vc-bluePale">{caption}</p>
      <a className="mt-12 inline-flex text-xl font-bold tracking-[-0.04em] text-vc-faint" href="#demo">{cta}</a>

      <div className="my-12 h-px bg-vc-border" />
      <p className="mb-7 text-lg font-bold tracking-[-0.03em] text-vc-body">Signal analysis</p>
      <Row icon={<Headphones />} label="Audio analysis" value={featured ? "$0.03 / min" : "Included"} />
      <Row icon={<Video />} label="Video analysis" value={featured ? "$0.03 / min" : "Included"} />
      <Row icon={<Layers3 />} label="Composite analysis" value={featured ? "$0.03 / min" : "Included"} />
    </article>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="mb-6 flex items-center justify-between gap-4 text-lg tracking-[-0.03em] text-vc-ink">
      <div className="flex items-center gap-4 text-vc-ink">
        <span className="h-6 w-6 text-vc-body">{icon}</span>
        <span>{label}</span>
      </div>
      <strong className="text-right font-bold">{value}</strong>
    </div>
  );
}
