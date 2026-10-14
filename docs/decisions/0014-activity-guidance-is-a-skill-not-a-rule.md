# 0014. Guidance for one activity is a skill, not a rule

- Status: Accepted
- Date: 2026-10-14

## Context

`.agents/rules/` held two kinds of guidance. Some conventions hold for every file of a kind:
naming, file names, TypeScript types, functional style, one function per file. Others apply
only to one kind of work: the rules `semantic-html`, `no-layout-shift` and
`reuse-existing-components` (PR #629) apply only to writing markup. `AGENTS.md` lists every rule
as mandatory for all tasks, so the UI ones were loaded for work that renders nothing.

The component API was not written down at all. `docs/_notes.md` named "Compound components
pattern" in one line, and a new component (`Tabs`, #631) came out as a props-and-array API.

## Decision

A rule in `.agents/rules/` holds a convention for every file of its kind. Guidance for one
activity is a skill in `.agents/skills/` with its own triggers, loaded only for that work.

UI guidance becomes the skill `component-authoring`, with four references: the component API
(compound components first, then props, render props to hand values out), semantic HTML, no
layout shift, and reuse of existing components. The last three moved there from
`.agents/rules/`.

## Consequences

- New guidance asks first whether it holds for every file of a kind (a rule) or for one kind
  of work (a skill or a reference in one).
- `/plan-issue`, `/implement-issue` and the `implementation-reviewer` load `component-authoring`
  when a change adds markup or changes a component.
- The rules that stay are `file-naming`, `typescript-conventions`, `naming-no-abbreviations`,
  `functional-style`, `one-function-per-file`, `package-versions`, `self-review-before-pr`
  and `generic-guidance-examples`.

## Alternatives considered

- **One skill per former rule.** Writing a component usually needs all four at once, and four
  small skills would have to be loaded together every time.
- **Keep them as rules.** They would keep loading for work that renders nothing, and the
  component API would have joined them as a fourth always-on rule.
