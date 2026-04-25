# Component Recipes

## Container

Use a centered `max-width: 1200px` container with responsive gutter.

```tsx
<section className="py-section">
  <div className="mx-auto w-[min(1200px,calc(100%-clamp(40px,8vw,128px)))]">...</div>
</section>
```

## Eyebrow

```tsx
<p className="font-mono text-[13px] uppercase tracking-[0.26em] text-vc-muted">
  AI-POWERED SIGNAL INTELLIGENCE
</p>
```

Use for section labels: `Product`, `Pricing`, `Meet the platform`, `API layer`, etc.

## Hero heading

```tsx
<h1 className="font-display text-[clamp(56px,9vw,112px)] font-[850] leading-hero tracking-hero text-vc-ink">
  Understand High-Stakes Conversations with AI
</h1>
```

Rules:

- 3-5 lines is okay.
- Keep line-height tight.
- Do not center every hero; left hero works best.

## Muted body paragraph

```tsx
<p className="max-w-[620px] text-[clamp(20px,2vw,26px)] leading-[1.55] tracking-[-0.02em] text-vc-body">
  Add your own product copy here.
</p>
```

## Understated CTA

The reference vibe often uses muted CTAs, not loud buttons. Use one primary only when conversion matters.

```tsx
<a className="inline-flex h-14 items-center rounded-pill border border-vc-border bg-white px-7 text-sm font-semibold text-vc-ink shadow-vc-soft transition hover:-translate-y-0.5 hover:border-vc-blue/40">
  Book a Demo
</a>
```

## Crystal shard

Create with CSS, not image assets.

```tsx
<div className="absolute h-24 w-10 rotate-[-12deg] [clip-path:polygon(50%_0%,88%_18%,78%_88%,50%_100%,20%_88%,12%_18%)] border border-vc-blue/30 bg-[linear-gradient(135deg,rgba(239,245,255,.95),rgba(111,154,255,.62)_52%,rgba(255,255,255,.55))] shadow-vc-glow" />
```

## Orbit lines

Use absolute SVG curves or CSS ovals. Keep opacity low.

```tsx
<svg className="pointer-events-none absolute inset-0 opacity-35" viewBox="0 0 1200 800" fill="none">
  <path d="M40 620 C260 420 480 760 730 500 C920 300 810 130 1160 80" stroke="#478BFF" strokeOpacity="0.18" strokeWidth="1.5" />
</svg>
```

## API pipeline card

Structure:

1. Header: small check icon, mono label, provider badge optionally.
2. Pipeline row: input stream -> AI/signal engine -> structured JSON.
3. JSON preview in mono.
4. Footer chips: modalities, protocol, latency.

Visual:

- White card.
- Large radius 32-40px.
- Pale blue border.
- Soft shadow.
- Lots of empty vertical space.

## Pricing card

- Large card, radius 32px.
- Sparse rows.
- Large plan name.
- Pale blue subcopy.
- Use line dividers.
- Featured card can have stronger blue border, but still soft.

## FAQ item

```tsx
<button className="flex w-full items-center justify-between rounded-[24px] border border-vc-border bg-white px-10 py-8 text-left text-2xl font-bold tracking-[-0.03em] text-vc-ink">
  <span>Question text?</span>
  <ChevronDown className="h-5 w-5" />
</button>
```

## Footer

- Keep huge whitespace above footer.
- Columns with muted links.
- Logo/wordmark placeholder bottom left.
- Social icons center or near brand.
- Legal text pale.
