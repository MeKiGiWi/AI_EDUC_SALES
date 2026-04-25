# Motion Rules

## Motion personality

Motion should feel calm, precise, and expensive.

Use:

- slow fade-in
- slight upward translate
- blur-to-clear reveal
- gentle stagger for cards
- subtle crystal drift
- very slow orbit-line opacity changes

Avoid:

- bouncy easing
- fast playful animations
- rotating every object
- scroll-jacking
- hover effects that feel like a game

## Framer Motion defaults

```ts
export const vcReveal = {
  hidden: { opacity: 0, y: 22, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1] }
  }
};

export const vcStagger = {
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.12 }
  }
};
```

## CSS drift

```css
@keyframes vc-drift {
  0%, 100% { transform: translate3d(0,0,0) rotate(var(--r)); }
  50% { transform: translate3d(8px,-14px,0) rotate(calc(var(--r) + 2deg)); }
}
```

Use only on decorative elements.
