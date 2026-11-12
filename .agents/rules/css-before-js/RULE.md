---
name: css-before-js
description: |
  What CSS can do goes in CSS; JS only where CSS can't or doesn't support it yet.

  Trigger for:
  - Writing client code that changes how something looks or moves with state: toggling
    styles or classes from JS, measuring to position, animating, naming view transitions
  - Reviewing a diff that does any of that

  DO NOT trigger for:
  - Server code: loaders, actions, utilities that render nothing
  - Behaviour with no CSS form (the list under "Where JS stays")
---

# CSS Before JS

## The rule

State lives in the DOM as attributes, and CSS reads it. JS sets a `data-*` attribute, an
`aria-*` state or a transition's type; selectors, media and feature queries do the rest. Reach
for `:has()`, `[data-*]`, `@media`, `@supports`, `@container`, `@property`, `@starting-style`,
`linear()` and view-transition types before writing a style, a measurement or an animation in JS.

Check a feature with the `modern-web-guidance` skill first. Use one that is newly available with
the fallback that skill gives, rather than rebuilding it in JS.

```tsx
// bad: JS measures and decides how it looks
<div style={{ maxHeight: isUnfolded ? measuredFoldHeight : 0 }} ref={measureFold}>

// good: JS states the fact, CSS decides how it looks
<div data-unfolded={isUnfolded || undefined} className={styles.fold}>
```

```css
.fold {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 200ms ease-in-out;

  &[data-unfolded] {
    grid-template-rows: 1fr;
  }
}
```

## Where JS stays

Only where CSS has no form for it, or no browser support yet:

- starting or skipping a view transition, and flushing a framework's render inside it;
- focus, keyboard and pointer handling;
- waiting for something to load or decode;
- reading layout that CSS can't express. Say in a comment why CSS can't.

The one exception: a CSS route that really fails the UX goes to JS, for example a cascade that
doesn't update in an isolated render context. The comment says why. "It's shorter in JS" is not
a reason.

## Why

The owner decided it: moving things into CSS is always the better solution. CSS is declarative
and runs on the browser's own schedule, often on the compositor. It survives re-renders, has no
listeners to clean up, and works before hydration. A style computed in JS does none of that and
hides the design in code.
