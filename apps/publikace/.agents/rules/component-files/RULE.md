---
name: component-files
description: |
  How components are laid out on disk in this project.

  Trigger for:
  - Creating a component in `app/ui/`
  - Adding a sub-component, style or helper to an existing component
  - Splitting or moving an existing component

  DO NOT trigger for:
  - Route-local components inside `app/actions/`, which stay with the controller that owns them
---

# Component Files

The names below are invented; they illustrate the shape, not files of the app.

## One folder per component, entered through `component.tsx`

A shared component in `app/ui/` is a folder named after it, and `component.tsx` is the only
file anything outside that folder may import. Everything else in there is private.

```tsx
// bad — the caller reaches past the entry into a private file
import { DrawerLink } from '../ui/drawer/drawer-link.tsx'

// good — outside the folder, only the entry exists
import { Drawer } from '../ui/drawer/component.tsx'
```

## Whatever only that component uses lives inside its folder

Sub-components, styles and helpers with a single consumer go in the folder and are never
named in an import from outside it. That is what the folder buys: `drawer/` can grow
`drawer-link.tsx` and `geometry.ts` without adding anything to `app/ui/`'s surface.

The moment a second component needs one of them, it can no longer hide — a sibling reaching
into `drawer/` is exactly what the entry rule forbids. Move it up to its own folder (a
`badge/` that the drawer and a dialog both draw) or, if it is not a component, to a flat
module beside them.

## Not every module is a component

A folder is for something that renders. Types, tokens and pure helpers stay flat `.ts` files
in `app/ui/`, such as a `row-geometry.ts` or a `focus-style.ts` that several components
compose. They have nothing to hide, so a folder around them would be one directory and one
file for no gain.

## One component, one folder — parts included

Anything that renders gets its own folder and its own `component.tsx`, a part that is only
ever written inside another component included. `NoticeCardTitle` renders an `<h2>`, so it
lives in `notice-card-title/` and not in `notice-card/`.

```
app/ui/notice-card/component.tsx        NoticeCard
app/ui/notice-card-title/component.tsx  NoticeCardTitle
```

What binds the parts is what they do — `NoticeCardTitle` imports `NoticeCard` to read its
context — not a shared file.

## No barrels

`component.tsx` is the entry; do not add `index.ts` beside it. This runs on real Node ESM,
where `from './drawer'` throws `ERR_UNSUPPORTED_DIR_IMPORT` — a barrel would still have to be
imported as `'./drawer/index.ts'`, which is longer than the file it was meant to hide.

## Never import back from the parent

A shared constant goes to a third module — never back up the import it came down.

The parent already imports the child, so the child importing the parent closes a cycle. A
`const` read while the parent is still evaluating is in its temporal dead zone, and `css()`
at module level reads it during load: the page dies on `ReferenceError` before anything
renders, not on a render you can trace. A `drawer/geometry.ts` that both import is the way
out.

## Route-local components stay with their controller

`app/actions/**` is exempt from all of the above. A page's confirmation dialog or its card
belongs to that page. This is the narrowest-owner rule from `.agents/skills/remix/SKILL.md`,
and it wins over everything here.

## Why

In this codebase a component is a small part of its own file: most of it is styles and the
decisions behind them, and the JSX is the smaller share. Flat, the only thing separating "how
the drawer is measured" from "what a link looks like" would be a file name. A folder with one
entry says it structurally instead: the boundary is enforced by what callers are allowed to
name, not by a convention they have to remember.
