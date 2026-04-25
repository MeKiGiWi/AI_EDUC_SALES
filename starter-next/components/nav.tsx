import { ArrowUpRight } from "lucide-react";

export function Nav({ productName = "YourProduct" }: { productName?: string }) {
  return (
    <header className="relative z-20 mx-auto flex w-[min(1200px,calc(100%-48px))] items-center justify-between py-8">
      <a href="#" className="text-2xl font-[850] tracking-[-0.07em] text-vc-ink">
        {productName.toLowerCase()}
      </a>
      <nav className="hidden items-center gap-14 text-[22px] font-medium tracking-[-0.04em] text-vc-muted md:flex">
        <a href="#product" className="transition hover:text-vc-ink">Product</a>
        <a href="#solutions" className="transition hover:text-vc-ink">Solutions</a>
        <a href="#company" className="transition hover:text-vc-ink">Company</a>
      </nav>
      <div className="flex items-center gap-9">
        <a href="#api" aria-label="Open API section" className="hidden text-vc-blue sm:block">
          <ArrowUpRight className="h-5 w-5" />
        </a>
        <a href="#demo" className="text-lg font-bold tracking-[-0.03em] text-vc-faint transition hover:text-vc-ink">
          Book a<br className="hidden sm:block" /> Demo
        </a>
      </div>
    </header>
  );
}
