---
name: self-review-before-pr
description: |
  Self-review the full diff before opening a PR or requesting an automated review.

  Trigger for:
  - Preparing to open a pull request
  - Requesting or re-requesting a Copilot/automated review
  - Finishing a feature or fix branch before hand-off

  DO NOT trigger for:
  - Work-in-progress commits that are not yet up for review
---

# Self-Review Before PR

Before opening a PR or requesting a Copilot review, review the **entire diff**
yourself first (`git diff <base>..HEAD`). The goal is to catch as much as
possible up front so review rounds stay short — every issue found here is a
billed, slow Copilot round-trip avoided.

## How

Read every changed hunk and check it against the checklist below. Fix what you
find, then re-run `pnpm app:typecheck`, `pnpm test`, and `biome check` before
pushing.

## Checklist

### Correctness / data safety

- **Persistence lifecycle** — clear or delete persisted state (localStorage,
  cookies, …) only once the operation truly succeeded, not optimistically before
  a request that can still fail (server validation, expired session/CSRF).
- **Serializable payloads** — never `JSON.stringify` `File`/`Blob`/class
  instances into storage; they become `{}` and corrupt a later restore. Strip
  non-serializable fields first.
- **State reset on identity change** — state kept in a reused component (React
  Router reuses a route component across param changes) must reset when its key
  (id/param) changes, or it leaks between records.

### React / effects

- **Effect dependencies** — depend on the specific fields you read, not a whole
  object whose identity churns (e.g. `navigation.state`, not `navigation`).
- **Run-once side effects** — guard effects that must fire once (clear a flag /
  early-return) so redirect or loading re-renders don't repeat them.
- **Native vs synthetic events** — on native `<dialog>`, React `onClose` /
  `onCancel` props do not fire reliably; use `addEventListener` instead.
- **`beforeunload`** — set `event.returnValue = ''` as well as
  `preventDefault()` so the native prompt shows in all browsers.

### Consistency / hygiene

- **PR description matches code** — every claim in the description is actually
  implemented, or fix the description.
- **Parallel code paths agree** — sibling files doing the same thing (e.g. the
  add / edit routes) are wired identically.
- **Conventions** — kebab-case files, one component per directory, `type` not
  `interface`, `@layer` CSS modules, English comments / Czech UI copy, no
  abbreviations in identifiers.

## Why

Copilot review is billed and slow to iterate. A few minutes reading the diff
against this checklist removes most findings before they cost a review cycle,
and keeps the remaining rounds focused on genuinely subtle issues.
