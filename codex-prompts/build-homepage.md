# Prompt: Build Homepage in Ethereal AI Light UI Style

Use this prompt with Codex after adding `AGENTS.md` and `design-system/` to the repo.

```md
Build a polished homepage for my product using the Ethereal AI Light UI preset in AGENTS.md and design-system/.

Do not copy Voicera exact text, logo, screenshots, SVGs, or layout. Use the reference only for visual grammar: white airy canvas, huge tight typography, pale blue glow crystals, thin orbit lines, soft rounded cards, API/pipeline visuals, muted enterprise AI tone.

Tech stack:
- Next.js App Router
- TypeScript
- Tailwind CSS
- Framer Motion if already installed; otherwise keep static CSS motion minimal
- lucide-react if already installed; otherwise use inline SVG icons

Content:
[YOUR CONTENT HERE]

Page structure:
1. Navbar
2. Hero with eyebrow, massive heading, muted paragraph, understated CTA, and abstract signal/crystal visual
3. Pale trust/proof strip
4. Big thesis section with one huge claim
5. Problem/Solution/Delivery or How It Works section
6. API/pipeline section with structured JSON output visual
7. Use case statement or use-case cards
8. FAQ
9. Footer

Implementation requirements:
- Create reusable components for Container, Eyebrow, CrystalField, OrbitLines, Card, ApiPipelineCard.
- Use tokens from design-system/tokens.json.
- Prefer CSS/SVG decorations over image assets.
- Keep sections spacious and minimal.
- Make mobile responsive.
- Run build/lint if available and fix issues.

Self-review using design-system/qa-checklist.md before final response.
```
