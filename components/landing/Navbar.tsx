"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Container, PillButton } from "@/components/landing/ui";

type NavLink = {
  label: string;
  href: string;
};

type NavbarProps = {
  links: NavLink[];
};

export function Navbar({ links }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50">
      <Container className="pt-4 sm:pt-5">
        <div className="rounded-[28px] border border-vc-border/80 bg-white/80 px-4 py-3 shadow-[0_18px_50px_rgba(50,72,120,0.08)] backdrop-blur-xl sm:px-5">
          <div className="flex items-center justify-between gap-4">
            <a href="#" className="inline-flex items-center gap-3" aria-label="AI Sales Academy home">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-vc-primary/20 bg-vc-primary/10 text-xs font-semibold uppercase tracking-[0.16em] text-vc-primary">
                AI
              </span>
              <span className="text-base font-[850] leading-tight tracking-[-0.05em] text-vc-ink sm:text-lg">
                AI Sales
                <br className="sm:hidden" /> Academy
              </span>
            </a>

            <button
              type="button"
              aria-label={isOpen ? "Закрыть меню" : "Открыть меню"}
              aria-expanded={isOpen}
              onClick={() => setIsOpen((value) => !value)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-vc-border bg-white text-vc-ink shadow-sm transition hover:border-vc-primary/40 md:hidden"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <nav className="hidden items-center gap-7 text-[17px] font-medium tracking-[-0.03em] text-vc-muted md:flex lg:gap-9">
              {links.map((link) => (
                <a key={link.href} href={link.href} className="transition hover:text-vc-ink">
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="hidden items-center gap-3 md:flex">
              <a
                href="/login"
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-pill border border-vc-primary bg-white/90 px-6 text-sm font-semibold tracking-[-0.015em] text-vc-primary shadow-[0_12px_32px_rgba(26,54,37,0.08)] transition hover:-translate-y-0.5 hover:bg-[#F2FBF5] sm:text-base lg:min-h-16 lg:px-7"
              >
                Войти
                <span aria-hidden="true">↗</span>
              </a>
              <PillButton href="/demo">Записаться на демо</PillButton>
            </div>
          </div>

          {isOpen ? (
            <div className="mt-4 border-t border-vc-border/70 pt-4 md:hidden">
              <nav className="flex flex-col gap-2">
                {links.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="rounded-[20px] px-3 py-3 text-base font-medium tracking-[-0.03em] text-vc-body transition hover:bg-vc-primary/5 hover:text-vc-ink"
                  >
                    {link.label}
                  </a>
                ))}
                <a
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="mt-2 inline-flex min-h-12 items-center justify-center gap-2 rounded-pill border border-vc-primary bg-white/90 px-5 text-sm font-semibold tracking-[-0.015em] text-vc-primary transition hover:bg-[#F2FBF5]"
                >
                  Войти
                  <span aria-hidden="true">↗</span>
                </a>
                <PillButton href="/demo" className="mt-2" ariaLabel="Записаться на демо">
                  Записаться на демо
                </PillButton>
              </nav>
            </div>
          ) : null}
        </div>
      </Container>
    </header>
  );
}
