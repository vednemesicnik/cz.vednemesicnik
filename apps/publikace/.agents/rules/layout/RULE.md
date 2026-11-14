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
  - Which token a length comes from, which `app/ui/tokens.ts` and its test own
  - The interior of `app/actions/invoices/invoice-sheet.tsx`, which is a printed document
    rather than a screen — the section below says what that costs it
---

# Layout

> Carried over from `cz.vednemesicnik.billing` while this repository has no application code yet.
> The rule applies here as written; the files it cites as examples are billing's. Replace them
> with this repository's own as the app grows.

Citations here name a file and the constant inside it. Line numbers are left out on purpose:
every one this rule could have quoted had moved by the time it was written.

## The parent owns the sizes, or the children do

The textbook line — flex for one dimension, grid for two — is not what separates these here.
The question is which side is holding numbers somebody chose.

Grid where the design's numbers are the layout: `shellStyle` in `app/ui/layout/component.tsx`
is `212px minmax(0, 1fr)`, `columnsStyle` in `app/actions/invoices/send-page.tsx` is
`minmax(0, 1fr) 280px`, `gridStyle` in `app/ui/field.tsx` is two equal columns. Every one of
those figures comes from a drawing, so the parent is the thing that has to hold it.

Flex where nobody declared a width. A row of buttons is as wide as the words in the buttons,
and a parent that names a track for them has invented a number the design never gave.

```tsx
// bad — tracks invented to hold things nobody measured
const wrapStyle = css({ display: 'grid', gap: '6px', gridTemplateColumns: 'auto auto' })

// good — the labels do the sizing and the parent shares out what is left
const wrapStyle = css({ alignItems: 'center', display: 'flex', gap: '6px' })
```

## A flexible track is `minmax(0, 1fr)`, and a flex item holding text sets `minWidth: 0`

`1fr` means `minmax(auto, 1fr)`, and an item's automatic minimum is its min-content — so one
long unbroken string, an e-mail address or a customer's name, widens the track instead of
wrapping inside it. The floor has to be removed explicitly, on both mechanisms.

This is the most-decided fact in the app's layout: `minmax(0, 1fr)` appears 39 times against
four bare `1fr`, and `minWidth: 0` nineteen times — `fieldStyle` in `app/ui/field.tsx`,
`pageStyle` in `app/ui/layout/component.tsx`, and every other place a flex child carries
text.

```tsx
// bad — the sidebar holds at 212px and the main column pushes the page wider than the window
gridTemplateColumns: '212px 1fr',

// good — the track may shrink under its content, so the text wraps where the design drew it
gridTemplateColumns: '212px minmax(0, 1fr)',
```

## Flex cannot align across siblings

In either direction. Pushing a trailing item to the far end of **its own line** is
`marginLeft: 'auto'`, which is correct and is the app's idiom twenty-two times over —
`bandActionStyle` in `app/actions/customers/bands.ts` is the shape.

What it cannot do is make that item land in the same column as the one in the row above. Each
flex row shares out its own free space and knows nothing about its siblings. When things must
line up, one grid has to own every row.

```tsx
// bad — a flex row per pair, so no two values start at the same place
const rowStyle = css({ display: 'flex', gap: '8px' })
const labelStyle = css({ width: 'auto' })

// good — one grid over the whole list, and the label column is a track they share
const rowsStyle = css({
  alignItems: 'baseline',
  display: 'grid',
  gridTemplateColumns: 'minmax(0, auto) minmax(0, 1fr)',
})
```

`rowsStyle` in `app/actions/customers/customer-details.tsx` is that grid.

## A layer that must cost nothing goes out of flow

Layers stacked in one grid cell — every child `gridArea: '1 / 1'` — need no
`position: relative` on the parent and no `inset: 0` on the child. The catch is what decides
every case here: **a stacked child still sizes its track.** The box grows to the largest
layer.

That is what a crossfade or a badge over an icon wants, and exactly what a layer that must
cost the page no room cannot have. `gridArea` has no use in `app/` today, so the spelling to
copy is the shared-layout swap in
`.agents/skills/remix/references/animate-elements.md` — `display: 'grid'` on the parent and
`'& > *': { gridArea: '1 / 1' }`, which is the case that wants the box to grow.

Every out-of-flow site in the app is out of flow for that one reason:

| Where                                                     | Why it costs nothing                                                                                         |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `menuPanel`, `app/ui/public/menu-style.ts`                | a menu that sized its row would push every row below it down as it opened                                    |
| `seamStyle`, `app/actions/invoices/sheet-frame.tsx`       | a seam that sized the frame would move the page break it marks                                               |
| `DOCUMENT_MARK`, `app/actions/invoices/invoice-sheet.tsx` | `invoice-sheet-pages.ts` has to have nothing to add for it — the constant's own comment carries the argument |

```tsx
// bad — the row is as tall as the open menu, and the whole table steps down with it
const detailsStyle = css({ display: 'grid' })
const menuPanel = css({ gridArea: '1 / 1' })

// good — the row is the height of its buttons, open or shut
const detailsStyle = css({ position: 'relative' })
const menuPanel = css({ position: 'absolute', right: 0, top: 'calc(100% + 6px)' })
```

**A visually-hidden input is not this rule.** `choiceStyle` in
`app/ui/public/split-action-island.tsx`, the file input in
`app/actions/settings/public/signature-upload-island.tsx` and the radio in
`app/ui/choice.tsx` are out of flow to stay in the tab order that `display: none` would take
them out of. They are an accessibility idiom that happens to spell `position`, and no layout
decision is being made.

## In the top layer, `position` stops meaning anything

`popover` lifts an element out of every ancestor's stacking context and clipping. That is the
point of it, and it is also what breaks the previous section: in the top layer
`position: absolute` resolves against the viewport, so a panel drawn under its trigger lands
in a corner instead. Putting it back takes CSS anchor positioning.

`panelStyle` in `app/ui/internal-note.tsx` is the worked case — `positionArea` behind
`@supports (position-area: bottom)`, so an engine without it keeps the browser's centring,
which is a worse place and never a wrong one. The anchor is **named** rather than `auto`,
because the invoker and the thing the panel hangs from are not always the same element;
`popoverAnchorName` in `app/ui/invoice-actions.ts` holds that argument.

The counter-case is the row menu in `app/ui/row-actions.tsx`, which stays a `<details>` and
stays out of the top layer. Its comment says why, and what would make it worth revisiting.
Both arguments are already written down where they apply — cite them, do not restate them.

The floor is what settles this, not taste: `.browserslistrc` promises Firefox 120, `popover`
arrives there at 125, and anchor positioning has shipped in fewer engines still. The
`@supports` guard is load-bearing, not decoration.

## The document is not the app

`app/actions/invoices/invoice-sheet.tsx` holds no grid at all, one flex, and eighty-five
table tags. That is not an oversight to be tidied. It prints, and it is read by a PDF
renderer and — through the mail — by clients that support neither stylesheets nor custom
properties. Tables are what survives that trip.

Nothing else in this file applies inside it.

## The codebase has not caught up on some of this

- **Four bare `1fr` tracks**, in `app/ui/invoice-questions.tsx`, `app/actions/settings/hub.tsx`,
  `app/actions/invoices/send-page.tsx` and `app/actions/invoices/detail/component.tsx`. None
  has bitten yet because of what happens to sit in them.
- **Six breakpoints and no ladder** — 620, 640, 720, 820, 900 and 1000px. `app/ui/tokens.ts`
  has no `--space-*` either, so the gaps and paddings around them are raw pixel strings. Both
  are a token question rather than a mechanism one, and bigger than this rule.
- **Two spellings of visually-hidden**, `clip`/`clipPath` against `height`/`opacity`/`width`.

Fix one when you are already working in it. Do not sweep: the posture is
`.agents/rules/comments/RULE.md`'s on narrated comments and `component-files/RULE.md`'s on
flat files, and for the same reason.

**`subgrid` is available and not yet needed.** It clears the floor comfortably — Safari 16
against a promise of 17.5 — and has zero uses. The rows it would serve, in
`app/actions/customers/recurrence-page.tsx`, have fixed px tracks and no header sharing them,
so there is nothing for it to align. Reach for it when a ragged edge appears, not before.

## Undecided: trailing items in stacked bands

Where bands stack — `app/actions/customers/bands.ts` and the lists and details that use it —
each band is its own flex row. By the rule above, their trailing buttons therefore sit wherever
their own width puts them and form no column.

**Whether they should form one is design's call, not the code's.** The app is internally
consistent as it stands, and a grid imposed over the bands would be this rule inventing a
layout nobody drew. `/ask-design` is the route if it ever matters.
