import { ArrowRight } from "lucide-react";

type ContainerProps = {
  children: React.ReactNode;
  className?: string;
};

type SectionIntroProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  titleClassName?: string;
};

type ButtonProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
};

export function Container({ children, className = "" }: ContainerProps) {
  return <div className={`mx-auto w-[min(1200px,calc(100%-32px))] sm:w-[min(1200px,calc(100%-48px))] ${className}`}>{children}</div>;
}

export function SectionIntro({
  eyebrow,
  title,
  description,
  align = "left",
  titleClassName = ""
}: SectionIntroProps) {
  const alignment = align === "center" ? "mx-auto text-center" : "text-left";

  return (
    <div className={`${alignment} max-w-[760px]`}>
      {eyebrow ? <p className="font-mono text-[12px] uppercase tracking-eyebrow text-vc-muted sm:text-[13px]">{eyebrow}</p> : null}
      <h2 className={`mt-4 font-display text-[clamp(40px,11vw,78px)] font-[850] leading-[0.96] tracking-hero text-vc-ink sm:mt-5 ${titleClassName}`}>
        {title}
      </h2>
      {description ? (
        <p className="mt-5 max-w-[640px] text-base leading-7 tracking-[-0.02em] text-vc-body sm:text-lg sm:leading-8">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function PillButton({ href, children, className = "", ariaLabel }: ButtonProps) {
  return (
    <a
      href={href}
      aria-label={ariaLabel}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-pill border border-vc-blue/20 bg-vc-ink px-5 py-3 text-sm font-semibold tracking-[-0.02em] text-white shadow-vc-soft transition duration-300 ease-vc hover:-translate-y-0.5 hover:bg-vc-blue sm:min-h-14 sm:px-7 sm:text-base ${className}`}
    >
      {children}
    </a>
  );
}

export function GhostButton({ href, children, className = "", ariaLabel }: ButtonProps) {
  return (
    <a
      href={href}
      aria-label={ariaLabel}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-pill border border-vc-border bg-white/80 px-5 py-3 text-sm font-semibold tracking-[-0.02em] text-vc-ink shadow-[0_12px_32px_rgba(50,72,120,0.08)] transition duration-300 ease-vc hover:-translate-y-0.5 hover:border-vc-blue/40 hover:text-vc-blue sm:min-h-14 sm:px-7 sm:text-base ${className}`}
    >
      {children}
      <ArrowRight className="h-4 w-4" />
    </a>
  );
}

export function SurfaceCard({ children, className = "" }: ContainerProps) {
  return (
    <div className={`rounded-vc border border-[rgba(166,190,230,0.45)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,255,255,0.82))] shadow-vc-card backdrop-blur ${className}`}>
      {children}
    </div>
  );
}
