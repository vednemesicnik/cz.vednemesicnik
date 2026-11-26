---
name: component-api
description: |
  What a component asks its caller for, and what it works out itself.

  Trigger for:
  - Designing the props of a new component, in `app/ui/` or beside a controller
  - Adding a prop to an existing component
  - Deciding whether something is one component or several, or one with a `variant`

  DO NOT trigger for:
  - Where the files go, which is `component-files`
  - Domain functions and pure helpers, which are not components
---

# Component API

The component names below are invented; they illustrate the shape, not components of the app.

## Choose the shape in this order

1. **Compound components** — a root and named parts, composed in JSX. The default for anything
   that has parts: a card, a row, a dialog, a field with its label, hint and error.
2. **Props** — when the component has no parts of its own: a few scalar settings, data with a
   shape the component arranges, or one value that has to stay consistent and that composition
   would let the caller break.
3. **A function prop** (a render prop) — when the root owns values the caller's own markup needs
   (the open state, the selected item, an id). The function hands them out where the caller can
   see and use them, instead of the root deciding behind a black box.

Go down the list only for a reason you can name in one sentence.

## Parts are components, not props

A part the caller writes is its own component and its own tag.

```tsx
// bad — the caller describes the card
<NoticeCard title="Poslední změny">…</NoticeCard>

// good — the words stand where they appear
<NoticeCard>
  <NoticeCardTitle>Poslední změny</NoticeCardTitle>
  …
</NoticeCard>
```

**Flat names, not dot notation.** `NoticeCardTitle`, never `NoticeCard.Title`: every part is its
own export in its own folder (`component-files`), so there is no static member to hang it on.

## A different shape is a different root, never a `variant`

Two cards that differ in structure are two roots named by their shape — `WideNoticeCard` and
`CompactNoticeCard` — sharing the parts. No `layout` or `variant` prop that switches the
structure, and no `BaseNoticeCard` wrapper: a prop that switches the structure means every part
has to know which structure it is in. A `variant` that changes only the look of the same markup
(a size, a tone) is a setting, and a prop is right for it.

## Props carry data, children carry content

The line is whether the caller hands over **something with a shape** or **something they
wrote**. A crumb is a `{ href, label }` the component arranges into a trail, so `crumbs` is a
prop. A heading is words in a language, so it goes between tags.

A prop the component puts back on the screen unchanged is a part in disguise. An array stops
being right the moment one item needs its own condition, wrapper or markup: then the items are
parts, written as children.

## Hand values out, do not reach into children

When the caller's markup depends on the root's state, a function prop shows the dependency at the
place it is used.

```tsx
// bad — the list decides how a chosen row looks; the caller cannot see or change it
<ChoiceList isChosenHighlighted items={entries} />

// good — the list owns the choice, the caller renders the row with it
<ChoiceList
  items={entries}
  row={({ entry, isChosen }) => <EntryRow entry={entry} isChosen={isChosen} />}
/>
```

- **Context for the parts of the compound, a function prop for the caller's markup.** A part the
  compound ships reads the root's state through `handle.context.get(Root)`. Markup the caller
  writes gets the values through the function, in plain sight.
- **Never inspect or rewrite children** — no walking `handle.props.children` to inject props or to
  check their type. It breaks as soon as the caller wraps a part.
- **An island's props cross the wire.** A `clientEntry` gets serialized props: data, plain objects,
  arrays and JSX, never a function and never an element carrying `on()` or `ref()`. A function
  prop therefore belongs to a server-rendered component; an island takes data and renders the
  interactive markup itself.

## Never ask the caller for an id

`handle.id` is stable per component instance and exists so callers do not supply one. Anything
needing two elements to agree — `aria-labelledby`, `for`, `aria-describedby`, `popovertarget` —
derives both ends from it, and reaches the other component through context:
`handle.context.set()` in the parent's setup, `handle.context.get(Parent)` in the child's render.
The reference is the Handle and Context sections of `node_modules/remix/src/component/README.md`.

```tsx
export function NoticeCard(handle: Handle<NoticeCardProps, NoticeCardContext>) {
  let titleId = `notice-card-title-${handle.id}`
  handle.context.set({ titleId })

  return () => <section aria-labelledby={titleId}>{handle.props.children}</section>
}
```

Where a natural key exists, use it instead — a field can build `field-${name}` from the name its
control has anyway.

This is what decides compound against a `title` prop. A `<section>` is `generic` in the
accessibility tree until something names it, so two elements have to agree on one string for the
card to be a landmark. A caller who writes neither cannot get it wrong.

## The TSDoc sits on the component

Above the exported function, not above the `css()` block over it — a docblock on a style constant
is not what a caller sees on hover. The style keeps its own line comment when it has something to
say. `../comments/RULE.md` governs what goes in either.

## Export what a caller reaches for

`NoticeCardTitle` is a few lines and earns its export: the alternative is every caller writing
`<h2 id={…}>` and pairing the id by hand. A part with no caller is not an API.

## Verify the markup, not the JSX

An unnamed landmark, an `aria-labelledby` pointing at nothing, a `for` that misses — all typecheck
and render. The accessibility tree of the rendered page reports the role and name a screen reader
gets, which is where the pairing is observable: read it in the Browser pane over `pnpm app:fake`,
or with `Accessibility.getFullAXTree` over the DevTools protocol.
