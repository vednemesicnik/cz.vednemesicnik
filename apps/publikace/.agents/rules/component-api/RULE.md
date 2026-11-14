---
name: component-api
description: |
  What a component asks its caller for, and what it works out itself.

  Trigger for:
  - Designing the props of a new component, in `app/ui/` or beside a controller
  - Adding a prop to an existing component
  - Deciding whether something is one component or several

  DO NOT trigger for:
  - Where the files go, which is `component-files`
  - Domain functions and pure helpers, which are not components
---

# Component API

> Carried over from `cz.vednemesicnik.billing` while this repository has no application code yet.
> The rule applies here as written; the files it cites as examples are billing's. Replace them
> with this repository's own as the app grows.

## Parts are components, not props

A part the caller writes is its own component and its own tag.

```tsx
// bad — the caller describes the card
<DetailCard title="Historie dokladu">…</DetailCard>

// good — the words stand where they appear
<DetailCard>
  <DetailCardTitle>Historie dokladu</DetailCardTitle>
  …
</DetailCard>
```

**Flat names, not dot notation.** `DetailCardTitle`, never `DetailCard.Title` — the spelling
`remix/ui` uses for its own (`Accordion`, `AccordionItem`, `AccordionTrigger`).

`Breadcrumbs`, `Segmented` and `Choice` take an array and render it. They are flat files the
migration has not reached, and not the shape to copy.

## Props carry data, children carry content

The line is whether the caller hands over **something with a shape** or **something they
wrote**. A crumb is a `{ href, label }` the component arranges into a trail, so `crumbs` is a
prop. A heading is words in a language, so it goes between tags.

A prop the component puts back on the screen unchanged is a part in disguise.

## Never ask the caller for an id

`handle.id` is stable per component instance and exists so callers do not supply one.
Anything needing two elements to agree — `aria-labelledby`, `for`, `aria-describedby`,
`popovertarget` — derives both ends from it, and reaches the other component through context:
`handle.context.set()` in the parent's setup, `handle.context.get(Parent)` in the child's
render. The reference is `.agents/skills/remix/references/component-model.md`.

Where a natural key exists, use it instead — `Field` builds `field-${name}` from the name the
control has anyway.

This is what decides compound against a `title` prop. A `<section>` is `generic` in the
accessibility tree until something names it, so two elements have to agree on one string for
the card to be a landmark. A caller who writes neither cannot get it wrong.

## The TSDoc sits on the component

Above the exported function, not above the `css()` block over it — a docblock on a style
constant is not what a caller sees on hover. The style keeps its own line comment when it has
something to say. `.agents/rules/comments/RULE.md` governs what goes in either.

## Export what a caller reaches for

`DetailCardTitle` is six lines and earns its export: the alternative is every caller writing
`<h2 id={…} mix={…}>` and pairing the id by hand. A part with no caller is not an API.

## Verify the markup, not the JSX

An unnamed landmark, an `aria-labelledby` pointing at nothing, a `for` that misses — all
typecheck and render. `Accessibility.getFullAXTree` over a rendered page reports the role and
name a screen reader gets, which is where the pairing is observable. `tmp/*-probe.mjs` are
worked examples.
