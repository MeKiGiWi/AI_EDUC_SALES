# AGENTS.md — Green AI Sales Academy — React Native Mobile MVP

## Role

You are building and extending the mobile product direction for `AI Sales Academy`.

This repository should now evolve toward a React Native mobile-first application, not a Next.js landing or web-first product. The active visual and product preset is a green AI Sales Academy interface for practical sales training, simulation, feedback, and capability growth.

Do not introduce alternate product directions, legacy landing-first assumptions, blue/purple SaaS presets, or backend implementation in this repository unless the user explicitly asks.

## Product direction

- Primary target platform: `React Native`, mobile-first.
- Preferred stack for future app initialization: `Expo + TypeScript`, if the repo is not yet initialized as a React Native app.
- iPhone and Android UX come first.
- Tablet comes after mobile.
- Web/desktop is optional and secondary.
- The UI should resemble a working mobile application, not a marketing landing page.

## Architecture rules

- Do not use `Next.js` as the target architecture.
- Do not use App Router patterns as the desired future direction.
- Do not use server components.
- Do not use API routes.
- Do not use server actions.
- Do not add a Node.js backend.
- Do not implement backend code in this repository at this stage.
- The future backend will be a separate Python layer, likely `FastAPI` or a similar Python backend.

## Code rules

- Application code must be only `TypeScript` / `TSX`.
- Do not create `.js` or `.jsx` files for business logic or UI.
- If React Native or Expo requires config files in `.js`, keep them configuration-only.
- Do not expand `.js` config files with product logic.
- Prefer `.json`, `.ts`, and `.tsx` wherever possible.
- Use typed service models, typed screen props, and typed mock data.
- No untyped mock data.
- No large mock arrays embedded directly inside JSX.

## Data and integration rules

- All current product data must come from typed mock data.
- Frontend integrations must be designed behind a typed service layer.
- Any future API integration should be switchable from mock implementations to Python backend implementations.
- Backend contracts should be documented before integration code is added.

## UX rules

- UX copy for the product should be in Russian.
- Code identifiers must stay in English.
- Every user action must have a visible result.
- No empty buttons.
- Every button, row action, or shortcut should do something meaningful:
  - navigation
  - modal
  - bottom sheet
  - mock submit
  - mock export
  - local state update
- Prefer bottom sheets and modals for mobile interaction patterns.
- Prefer structured, practical flows over decorative showcase layouts.

## Visual direction

The UI must feel:

- premium and modern
- light, airy, and mostly white
- green-accented, not blue-accented
- credible, B2B, and operationally sharp
- calm, intelligent, and trustworthy
- focused on learning progress, dialogue practice, feedback, and measurable outcomes

## Source of truth

Always use:

1. `design-system/tokens.json`
2. `design-system/tokens.css`
3. `design-system/component-recipes.md`
4. `design-system/layout-recipes.md`

These files remain the visual reference layer even as the application direction shifts to React Native.

## Mobile UI interpretation

Translate the green design system into mobile product surfaces:

- soft white or mint-tinted canvas
- rounded cards and panels
- clear hierarchy for sessions, scores, feedback, and knowledge blocks
- subtle green glow or emphasis only where it supports focus
- calm depth and restrained decoration
- strong readability on phone-sized screens

## Repository intent

- Keep this repository aligned with the green React Native mobile MVP direction.
- Remove or avoid new Next.js-first assumptions in prompts, docs, and future implementation guidance.
- Keep the current design system as a reference source, but prepare React Native-oriented theme files and component guidance.
- Treat backend work as future Python integration, not current implementation scope.

## Self-review before final answer

- Is the direction clearly React Native mobile-first?
- Did I avoid reintroducing Next.js as the target architecture?
- Are all suggested product flows based on typed mock data?
- Does every user action have a visible result?
- Does the UI direction still feel like one coherent green AI Sales Academy product?
