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

> Carried over from `cz.vednemesicnik.billing`.
> The rule applies here as written; the files it cites as examples are billing's. Replace them
> with this repository's own as the app grows.

## One folder per component, entered through `component.tsx`

A shared component in `app/ui/` is a folder named after it, and `component.tsx` is the only
file anything outside that folder may import. Everything else in there is private.

```tsx
// bad — the caller reaches past the entry into a private file
import { NavLink } from '../ui/panel/nav-link.tsx'

// good — outside the folder, only the entry exists
import { Panel } from '../ui/panel/component.tsx'
```

`app/ui/` is mid-migration: components not yet touched are still flat files (`field.tsx`,
`toast.tsx`, `dialog.tsx`). Convert one when you are already working in it. Do not convert
the rest as a side errand.

## Whatever only that component uses lives inside its folder

Sub-components, styles and helpers with a single consumer go in the folder and are never
named in an import from outside it. That is what the folder buys: `panel/` can grow
`nav-link.tsx` and `geometry.ts` without adding anything to `app/ui/`'s surface.

The moment a second component needs one of them, it can no longer hide — a sibling reaching
into `panel/` is exactly what the entry rule forbids. Move it up to its own folder
(`avatar/`, which the panel and the sign-out dialog both draw) or, if it is not a component,
to a flat module beside them.

## Not every module is a component

A folder is for something that renders. Types, tokens and pure helpers stay flat `.ts` files
in `app/ui/` — `tokens.ts`, `layout-editor.ts`, and in `app/ui/public/` the mixins an island
composes, `focus.ts` and `button.ts`. They have nothing to hide, so a folder around them would
be one directory and one file for no gain.

## One component, one folder — parts included

Anything that renders gets its own folder and its own `component.tsx`, a part that is only
ever written inside another component included. `DetailCardTitle` renders an `<h2>`, so it
lives in `detail-card-title/` and not in `detail-card/`.

```
app/ui/detail-card/component.tsx        DetailCard
app/ui/detail-card-title/component.tsx  DetailCardTitle
```

What binds the parts is what they do — `DetailCardTitle` imports `DetailCard` to read its
context — not a shared file.

`Field`, `SelectField` and `Fieldset` share `field.tsx` as one of the flat files the migration
has not reached.

## No barrels

`component.tsx` is the entry; do not add `index.ts` beside it. This runs on real Node ESM,
where `from './panel'` throws `ERR_UNSUPPORTED_DIR_IMPORT` — a barrel would still have to be
imported as `'./panel/index.ts'`, which is longer than the file it was meant to hide.

## Never import back from the parent

A shared constant goes to a third module — never back up the import it came down.

The parent already imports the child, so the child importing the parent closes a cycle. A
`const` read while the parent is still evaluating is in its temporal dead zone, and `css()`
at module level reads it during load: the page dies on `ReferenceError` before anything
renders, not on a render you can trace. `panel/geometry.ts` exists for exactly this.

## Route-local components stay with their controller

`app/actions/**` is exempt from all of the above. A page's `ConfirmDialog` or `Band` belongs
to that page. This is the narrowest-owner rule from `.agents/skills/remix/SKILL.md`, and it
wins over everything here.

## Why

In this codebase a component is a small part of its own file — the shell was 601 lines, of
which the JSX was 163 and the styles and the decisions behind them were the rest. Flat, the
only thing separating "how the panel is measured" from "what a link looks like" was a file
name. A folder with one entry says it structurally instead: the boundary is enforced by what
callers are allowed to name, not by a convention they have to remember.
