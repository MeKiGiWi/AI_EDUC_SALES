---
name: ethereal-ai-light-ui
description: Build frontend in a premium airy white AI-infrastructure style: huge typography, pale blue crystal glow, orbit lines, rounded enterprise cards, API/pipeline visuals. Use when user asks for Voicera-like/ref-inspired UI, B2B AI landing pages, API platform pages, credibility/intelligence SaaS, or frontend styling based on this preset.
---

# Ethereal AI Light UI Skill

## Use this skill when

The user wants frontend work in the provided reference style: white airy AI-infrastructure, huge bold typography, pale blue accents, soft crystal glow decorations, thin orbit/signal linework, rounded enterprise cards, API/pipeline visual language.

## Safety/originality rule

Use the reference as style direction only. Do not copy Voicera logo, exact text, screenshots, SVGs, assets, or a pixel-identical layout.

## Mandatory style checklist

- Background mostly `#FBFCFF` / white.
- Headings huge, heavy, deep navy, tight line-height.
- Body text muted gray-blue and spacious.
- Blue accents restrained and intentional.
- Cards: white, pale blue border, 28-40px radius, soft wide shadow.
- Decorative graphics: original CSS/SVG crystal shards, orbit lines, spirograph/network/signal motifs.
- Product visuals: API pipeline, JSON output, signal score, modal chips.
- Layout: large whitespace, few strong sections, no crowded grids.

## Workflow

1. Read `AGENTS.md` if present.
2. Read `design-system/tokens.json`, `visual-rules.md`, `component-recipes.md`, and `qa-checklist.md`.
3. Implement tokens/CSS first.
4. Build reusable primitives: Container, Eyebrow, CrystalField, OrbitLines, Card, Pill, ApiPipelineCard.
5. Build sections.
6. Add subtle motion only after layout is good.
7. Run build/lint if available.
8. Self-review against `qa-checklist.md`.

## Default component primitives

- `Container`: max-width 1200px, responsive gutter.
- `Eyebrow`: uppercase mono, wide tracking, muted.
- `HeroTitle`: clamp 56-112px, weight 850, line-height 0.94, letter spacing -0.06em.
- `VcCard`: white/translucent, pale border, radius 32px, soft shadow.
- `CrystalField`: absolute decorative CSS/SVG, pointer-events none.
- `OrbitLines`: low-opacity SVG curves.
- `ApiPipelineCard`: input -> AI engine -> JSON output visual.

## Default Tailwind classes

```tsx
<h1 className="font-display text-[clamp(56px,9vw,112px)] font-[850] leading-[0.94] tracking-[-0.06em] text-vc-ink" />
<p className="text-[clamp(20px,2vw,26px)] leading-[1.55] tracking-[-0.02em] text-vc-body" />
<div className="rounded-[32px] border border-vc-border/80 bg-white/85 shadow-vc-card" />
```
