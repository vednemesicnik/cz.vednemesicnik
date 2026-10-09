---
name: reuse-existing-components
description: |
  Build UI from the components the project already has.

  Trigger for:
  - Writing markup in a route or a component (a link, a button, an icon, a heading, a field, a dialog)
  - Planning a new component

  DO NOT trigger for:
  - Native elements no component wraps (`<ul>`, `<section>`, a layout `<div>`)
---

# Reuse Existing Components

## Look in `app/components/` before writing markup

A link, a button, an icon or a heading almost always has a component already —
with the behaviour the hand-written markup would forget (accessibility text, line
breaking, states, focus, dark mode). Search first, then compose:

```tsx
// bad — rebuilds a component the project has
<a href="https://priklad.cz" target="_blank" rel="noopener">
  Zdroj
  <svg>…</svg>
</a>

// good — the existing external-link component, restyled for this place
<ExternalLink className={styles.sourceLink} href="https://priklad.cz">
  Zdroj
</ExternalLink>
```

- **Differs only in look?** Pass a `className` and override in `@layer variant`, or
  use the component's variant prop.
- **Misses a behaviour the design asks for everywhere?** Change the component, so
  every use gets it — not one copy.
- **Nothing fits?** Write a new component, and say in the plan which existing ones
  you checked and why they don't fit.

## Why

A component exists so a decision is made once. Markup written beside it drifts:
it lacks the fixes the component collected, and the next design change has to be
made twice — or is made once and the copy is forgotten.
