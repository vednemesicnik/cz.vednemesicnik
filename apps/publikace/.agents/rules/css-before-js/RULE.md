---
name: css-before-js
description: |
  What CSS can do goes in CSS; JS only where CSS cannot or does not support it yet.

  Trigger for:
  - Writing an island (`clientEntry`) or a mixin that changes how something looks or moves with
    state: toggling styles or classes, measuring to position, animating
  - Writing a server-rendered component whose look depends on state the markup already carries
  - Reviewing a diff that does any of that

  DO NOT trigger for:
  - Server code that renders nothing: controllers, middleware, data and domain modules
  - Behaviour with no CSS form (the list under "Where JS stays")
---

# CSS Before JS

The names below are invented; they illustrate the pattern, not code of the app.

## State lives in the DOM, and CSS reads it

JS sets a `data-*` attribute, an `aria-*` state or a form control's own state; the selectors in a
`css()` object do the rest. Reach for `:has()`, `[data-*]`, `:checked`, `@media`, `@supports`,
`@container`, `@starting-style` and `transition-behavior` before writing a style, a measurement or
an animation in JS. Most state needs no island at all: a radio's `:checked` read through `:has()`
switches a form's fields with the page served as HTML.

Check a feature with the `modern-web-guidance` skill first, and against the floor in
`.browserslistrc`. Use one that is newly available with the fallback that skill gives, rather than
rebuilding it in JS.

```tsx
// bad — the island measures and decides how it looks
<div style={{ maxHeight: isOpen ? measuredHeight : 0 }}>…</div>

// good — the island states the fact (and keeps a shut panel out of reach), CSS decides the look
const panelStyle = css({
  display: 'grid',
  gridTemplateRows: '0fr',
  transition: 'grid-template-rows 200ms ease-in-out',
  /* A 0fr row still holds its content's height until the content may shrink. */
  '& > *': { overflow: 'hidden' },
  '&[data-expanded]': { gridTemplateRows: '1fr' },
})

<div data-expanded={isOpen || undefined} mix={panelStyle}>
  <div inert={!isOpen}>…</div>
</div>
```

The transitions use the design system's `--transition-*` tokens where one fits, and respect
`prefers-reduced-motion`.

## Where JS stays

Only where CSS has no form for it, or no support at the floor yet:

- focus, keyboard and pointer handling;
- waiting for something to load, decode or answer;
- reading layout that CSS cannot express — placing a menu where the floor has no anchor
  positioning, for example. Say in a comment why CSS cannot.

The one exception: a CSS route that really fails the UX goes to JS, and the comment says why.
"It is shorter in JS" is not a reason.

## Why

CSS is declarative and runs on the browser's own schedule, often on the compositor. It needs no
island to hydrate, has no listeners to clean up and works before the script loads, which here is
the default: most screens are served as HTML with no script of their own. A style computed in JS
does none of that and hides the design in code.
