# Codex UI Preset: Ethereal AI Light UI

Пакет сделан по загруженным референсам Voicera: белая премиальная B2B/AI эстетика, огромная жирная типографика, много воздуха, ледяной синий акцент, мягкие glow-объекты, тонкие орбитальные линии, API/pipeline-карточки и почти невесомые enterprise-интерфейсные элементы.

Важно: это не набор для копирования чужого сайта 1-в-1. Используй как дизайн-направление, чтобы делать оригинальный продукт в очень похожей визуальной системе: настроение, плотность, ритм, цвета, типографика, компоненты.

## Что внутри

- `AGENTS.md` — главный файл, который можно положить в корень репозитория, чтобы Codex всегда следовал стилю.
- `.codex/skills/ethereal-ai-light-ui/SKILL.md` — Codex Skill с короткими правилами и workflow.
- `design-system/` — токены, правила, компоненты, layout recipes, checklist.
- `codex-prompts/` — готовые промпты для задач: собрать главную, компонент, редизайн, ревью.
- `starter-next/` — минимальный Next.js/Tailwind пример с компонентами в нужной эстетике.
- `preview/reference-preview.html` — standalone HTML-превью визуального направления.

## Как использовать с Codex

1. Скопируй `AGENTS.md` в корень своего проекта.
2. Скопируй папку `design-system/` в корень проекта.
3. Если используешь Codex Skills, скопируй `.codex/skills/ethereal-ai-light-ui/` в проект.
4. Скопируй `design-system/tailwind.preset.ts` и подключи его в своем `tailwind.config.ts` или используй как референс.
5. Для первой генерации открой `codex-prompts/build-homepage.md`, замени блок `[YOUR CONTENT]` и дай Codex.

## Быстрый промпт

```md
Use the Ethereal AI Light UI preset from AGENTS.md and design-system/.
Build an original landing page with my content.
Keep the reference style: white canvas, huge heavy typography, faint gray/blue text, airy spacing, soft crystal glow decorations, thin orbit lines, rounded cards, API/pipeline UI, and calm enterprise AI feel.
Do not copy Voicera text, logo, layout, screenshots, or proprietary assets.
```

## Рекомендуемый стек

- Next.js App Router
- TypeScript
- Tailwind CSS
- Framer Motion for subtle reveals
- lucide-react for simple icons
- optional: shadcn/ui, but кастомизировать под этот preset

## Главный визуальный принцип

Не делай “обычный SaaS”. Делай “воздушную AI-инфраструктуру”: белый фон, огромный уверенный текст, невесомые панели, очень много пространства, технологичные API-детали и мягкая синяя энергия на фоне.
