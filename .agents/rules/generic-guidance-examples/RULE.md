---
name: generic-guidance-examples
description: |
  Examples in agent guidance are invented, never taken from the app.

  Trigger for:
  - Writing or editing a rule (`.agents/rules/`), a skill (`.agents/skills/`) or the conventions in `AGENTS.md`

  DO NOT trigger for:
  - `docs/`, which describes the app as it is and names its real files
  - Code comments and TSDoc `@example` blocks next to the code they describe
---

# Generic Guidance Examples

## Invent the example

Illustrate a convention with made-up names, not with real files, functions or
components from the application:

```
// bad — names a real module of the app
`app/utils/<existing-module>.ts` holds several functions — split it like `<existing-directory>/`.

// good
`app/utils/invoice.ts` holds several functions — split it into `app/utils/invoice/`.
```

Pick names that don't exist in the app, so nobody takes the example for a
pointer to real code.

## Why

The app moves; the guidance doesn't follow. A real path in an example goes stale
on the next rename or refactor and then points at code that no longer exists or
no longer looks like the rule says. An invented example can't go stale.
