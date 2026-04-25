# AGENTS.md — Ethereal AI Light UI Preset

## Role

You are building frontend UI in a visual style inspired by the provided reference: a premium, airy, white AI-infrastructure website with oversized typography, pale blue glow artifacts, thin orbital linework, rounded enterprise cards, API/pipeline visuals, and calm B2B credibility/intelligence positioning.

Use this as a style system, not as a clone. Never copy exact Voicera text, logo, illustrations, page layout, screenshots, SVGs, or proprietary assets.

## Non-negotiable visual direction

The UI must feel:

- premium, technical, AI-native
- airy and mostly white
- calm, precise, enterprise-ready
- sparse rather than dense
- soft, luminous, slightly scientific
- more like “intelligence layer / API infrastructure” than generic SaaS

## Core style tokens

Use the tokens from `design-system/tokens.json` and `design-system/tokens.css`.

Default palette:

- Background: `#FBFCFF` / near-white
- Ink: `#111227` / deep navy-black
- Muted text: `#62667D`
- Faint text: `#A6A8B3`
- Primary blue: `#478BFF`
- Pale blue: `#CFE2FF`
- Borders: `#DDE6F5`
- Glow: blue/lilac only, never neon-heavy

## Typography rules

- Use a geometric grotesk: `Inter`, `Geist`, `Satoshi`, or similar.
- Hero headings are massive: `clamp(56px, 9vw, 112px)`.
- Heading letter spacing: `-0.06em` to `-0.035em`.
- Hero line-height: `0.92` to `0.98`.
- Section headings: large, bold, centered or editorial left-aligned.
- Eyebrows: uppercase, wide tracking, muted gray/blue, often mono-like.
- Body text: muted, generous line height, 18-24px.

## Layout rules

- Use a centered max-width container around 1160-1240px.
- Use very tall vertical spacing: sections 120-180px on desktop.
- Avoid crowded grids. Prefer 2-column editorial sections and large cards.
- Let decorative graphics float behind or beside content.
- Cards should look lightweight: white fill, thin pale border, large radius, soft shadows.
- Keep many sections visually minimal with one dominant idea.

## Signature motifs to recreate originally

Create original variations of:

1. Blue translucent crystal shards / prisms with blur and glow.
2. Thin pale-blue orbital curves across the page.
3. Spirograph / signal network / orbit-like abstract diagrams.
4. Pill labels with pale borders and soft shadow.
5. API/pipeline card with input -> AI engine -> JSON output.
6. Pricing/API cards with light border and sparse rows.
7. Large sentence sections with selected words in blue.
8. FAQ rows with huge rounded rectangles.

Do not use copyrighted assets from the reference.

## Component style rules

### Navbar
- White/transparent, sticky or top-aligned.
- Left wordmark placeholder, muted nav links, small blue arrow/action icon, subdued CTA.
- Use generous horizontal spacing.
- Nav text should feel oversized compared to default SaaS nav.

### Hero
- Oversized left-aligned heading.
- Uppercase eyebrow above.
- Muted paragraph below with max width around 560px.
- CTA can be intentionally understated; avoid loud buttons unless product requires it.
- Right side can contain abstract signal diagram, pill labels, or crystal field.

### Cards
- Border: `1px solid rgba(166, 190, 230, 0.45)`.
- Radius: 28-36px.
- Shadow: large, soft, very low opacity.
- White or translucent white surface.
- Plenty of internal padding: 32-56px.

### API/pipeline panels
- Use a big rounded white card.
- Show three stages: input stream, AI/signal engine, structured JSON output.
- Include a few monospace lines in pale blue.
- Use small uppercase labels with wide tracking.

### Decorative graphics
- Must be subtle. They should support the page, not dominate.
- Use CSS gradients, SVG lines, and div prisms. No raster screenshots.
- Glow should be blue/lilac with blur 20-80px.

## Motion rules

- Use slow fade/blur/translate reveals.
- Duration: 500-900ms.
- Do not animate every tiny element.
- Crystal objects may drift subtly if the project supports motion.
- Avoid bouncy, playful motion.

## Accessibility and responsiveness

- Maintain contrast for real text. Pale text is for decoration only.
- Mobile: reduce hero size, hide or simplify large decorative graphics, keep spacing generous.
- Do not make important CTAs too faint on mobile.

## Build workflow for Codex

Before coding:

1. Read `design-system/reference-analysis.md`.
2. Read `design-system/tokens.json`.
3. Read `design-system/component-recipes.md`.
4. Decide which page recipe applies from `design-system/layout-recipes.md`.

When coding:

1. Implement tokens first.
2. Build reusable components: container, eyebrow, crystal field, orbit lines, pill, card.
3. Build sections with real content.
4. Add motion only after static layout works.
5. Run lint/build if available.

Self-review before final answer:

- Does the page look mostly white and airy?
- Is the hero typography huge and tightly set?
- Are blue accents restrained and intentional?
- Are cards rounded, pale, and soft?
- Are there API/intelligence motifs?
- Did you avoid copying Voicera assets/text/layout exactly?
