---
name: layout
description: |
  Which mechanism holds a layout, decided by who owns the sizes rather than by how many
  dimensions there are.

  Trigger for:
  - Choosing `display` for a new container, or changing one
  - Adding an element that sits over another — a menu, a stamp, a seam, a badge
  - Making a screen respond to width

  DO NOT trigger for:
  - Which token a length comes from, which the design system's copy in `app/ui/public/ds/` owns
  - Markup the design system's `vdm-*` classes already lay out, which `components.css` styles
---

# Layout

The style constants below are invented; they illustrate the mechanism, not code of the app.

## The parent owns the sizes, or the children do

The textbook line — flex for one dimension, grid for two — is not what separates these here. The
question is which side is holding numbers somebody chose.

Grid where the design's numbers are the layout: a sidebar of a drawn width beside the page, a
fixed aside beside a flexible column, two equal columns of fields. Every one of those figures
comes from a drawing, so the parent is the thing that has to hold it.

Flex where nobody declared a width. A row of buttons is as wide as the words in the buttons, and a
parent that names a track for them has invented a number the design never gave.

```tsx
// bad — tracks invented to hold things nobody measured
const actionsStyle = css({ display: 'grid', gap: '6px', gridTemplateColumns: 'auto auto' })

// good — the labels do the sizing and the parent shares out what is left
const actionsStyle = css({ alignItems: 'center', display: 'flex', gap: '6px' })
```

## A flexible track is `minmax(0, 1fr)`, and a flex item holding text sets `minWidth: 0`

`1fr` means `minmax(auto, 1fr)`, and an item's automatic minimum is its min-content — so one long
unbroken string, an e-mail address or a file name, widens the track instead of wrapping inside
it. The floor has to be removed explicitly, on both mechanisms.

```tsx
// bad — the sidebar holds its width and the main column pushes the page wider than the window
gridTemplateColumns: '200px 1fr',

// good — the track may shrink under its content, so the text wraps where the design drew it
gridTemplateColumns: '200px minmax(0, 1fr)',
```

## Flex cannot align across siblings

In either direction. Pushing a trailing item to the far end of **its own line** is
`marginLeft: 'auto'`, which is correct.

What it cannot do is make that item land in the same column as the one in the row above. Each flex
row shares out its own free space and knows nothing about its siblings. When things must line up,
one grid has to own every row.

```tsx
// bad — a flex row per pair, so no two values start at the same place
const pairStyle = css({ display: 'flex', gap: '8px' })

// good — one grid over the whole list, and the label column is a track they share
const pairsStyle = css({
  alignItems: 'baseline',
  display: 'grid',
  gridTemplateColumns: 'minmax(0, auto) minmax(0, 1fr)',
})
```

## A layer that must cost nothing goes out of flow

Layers stacked in one grid cell — `display: 'grid'` on the parent and
`'& > *': { gridArea: '1 / 1' }` — need no `position: relative` on the parent and no `inset: 0` on
the child. The catch is what decides every case here: **a stacked child still sizes its track.**
The box grows to the largest layer.

That is what a crossfade or a badge over an icon wants, and exactly what a layer that must cost
the page no room cannot have: a menu that sized its row would push every row below it down as it
opened, a seam that sized its frame would move the break it marks. Those go out of flow.

```tsx
// bad — the row is as tall as the open menu, and the whole table steps down with it
const rowStyle = css({ display: 'grid' })
const menuStyle = css({ gridArea: '1 / 1' })

// good — the row is the height of its buttons, open or shut
const rowStyle = css({ position: 'relative' })
const menuStyle = css({ position: 'absolute', right: 0, top: 'calc(100% + 6px)' })
```

**A visually-hidden input is not this rule.** A radio or a file input kept out of flow stays in
the tab order that `display: none` would take it out of. It is an accessibility idiom that happens
to spell `position`, and no layout decision is being made.

## In the top layer, `position` stops meaning anything

`popover` lifts an element out of every ancestor's stacking context and clipping. That is the
point of it, and it is also what breaks the previous section: in the top layer
`position: absolute` resolves against the viewport, so a panel drawn under its trigger lands in a
corner instead. Putting it back takes CSS anchor positioning, behind
`@supports (position-area: bottom)`, so an engine without it keeps the browser's centring, which
is a worse place and never a wrong one. Name the anchor rather than relying on the implicit one
when the invoker and the thing the panel hangs from are not the same element.

The floor settles whether to use it, not taste: `.browserslistrc` promises Firefox 120, `popover`
arrives there at 125, and anchor positioning has shipped in fewer engines still. Below that floor a
menu stays out of the top layer and positions itself; above it, the `@supports` guard is
load-bearing, not decoration.

## `css()` goes on a wrapper of a `vdm-*` element

The mixes sit in the cascade layer `rmx` and the design system's classes are unlayered, so on one
element the class wins whatever the order. A layout the design system's class already sets
(`display`, a gap) is changed on a wrapper around it, or inline.

## Existing layout

A bare `1fr` or a flex row that should be one grid, met while working in a file, is fixed there.
Do not sweep the rest as a side errand: the same posture as `../comments/RULE.md` on old comments.

**`subgrid` is available and rarely needed.** It clears the floor (Safari 16 against a promise
of 17.5). Reach for it when rows of separate components must share a header's columns, not before.

**Whether separate stacked rows should align their trailing items is design's call, not the
code's.** A grid imposed over them would be this rule inventing a layout nobody drew;
`/ask-design` is the route if it matters.
