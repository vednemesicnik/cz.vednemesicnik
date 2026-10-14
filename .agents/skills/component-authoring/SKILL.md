---
name: component-authoring
description: |
  How this project builds UI: the shape of a component's API (compound components first, then props, render props to hand values out), semantic elements, no layout shift, and reuse of the components the project already has. Load it before writing markup or a component — the references are the project's conventions and override general habits.

  Trigger immediately for:
  - Writing or changing a component in `app/components/` or a route-local one in `app/routes/**/components/`
  - Writing markup in a route (`route.tsx`) — a list, a header, a form, a filter row, a dialog
  - Planning a new component or a new variant of an existing one
  - Reviewing a diff that adds markup or changes a component's props
  - Aligning items in a row, or reserving space, where an item's height can change — CSS included

  DO NOT trigger for:
  - Loaders, actions, server utilities, schema and other code that renders nothing
  - CSS-only changes to look (colour, spacing, layers) — `general-guidance` covers those
  - Web-platform questions (which API, browser support) — use `modern-web-guidance`
---

# Component Authoring

Read the references that match the work before the first edit, completely. They are short;
each ends with why it holds.

## References

| Read when…                                                              | File                                       |
|:------------------------------------------------------------------------|:-------------------------------------------|
| designing a component's API — parts, props, render props, variants      | `references/component-api.md`              |
| writing any markup — which element says what the part is                | `references/semantic-html.md`              |
| something appears, disappears or loads, or a row aligns items of changing height | `references/no-layout-shift.md` |
| writing markup at all — a link, button, heading, field or dialog         | `references/reuse-existing-components.md`  |

Writing a component usually takes all four: its API, the elements it renders, what it does
while its content changes, and which existing components it composes.
