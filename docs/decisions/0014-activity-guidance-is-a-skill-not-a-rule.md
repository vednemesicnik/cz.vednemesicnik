# 0014. Guidance for one body of work is a skill, not a rule

- Status: Accepted
- Date: 2026-10-14

## Context

`.agents/rules/` held one short convention per file, each with its own trigger. Building UI
had three of them: `semantic-html`, `no-layout-shift` and `reuse-existing-components`
(PR #629). They apply to the same body of work and are read together, yet each stood alone in
the list of mandatory rules, and a fourth one for the component API was about to join them.

The component API was not written down at all. `docs/_notes.md` named "Compound components
pattern" in one line, and a new component (`Tabs`, #631) came out as a props-and-array API.

## Decision

A rule in `.agents/rules/` is one short, always-binding convention with a single trigger.
Guidance made of several references for one body of work is a skill in `.agents/skills/`,
loaded only for that work.

UI guidance becomes the skill `component-authoring`, with four references: the component API
(compound components first, then props, render props to hand values out), semantic HTML, no
layout shift, and reuse of existing components. The last three moved there from
`.agents/rules/`.

## Consequences

- New guidance asks first whether it is one convention with one trigger (a rule) or part of a
  body of work that already has a skill (a reference in it).
- `/plan-issue`, `/implement-issue` and the `implementation-reviewer` load `component-authoring`
  when a change adds markup or changes a component.
- The rules that stay are `file-naming`, `typescript-conventions`, `naming-no-abbreviations`,
  `functional-style`, `one-function-per-file`, `package-versions`, `self-review-before-pr`
  and `generic-guidance-examples`. Some of them are scoped to an activity too (a pull request,
  a package install, writing guidance), but each is one convention on its own.

## Alternatives considered

- **One skill per former rule.** Writing a component usually needs all four at once, and four
  small skills would have to be loaded together every time.
- **Keep them as rules.** Four separate rules for one body of work, each found and read on
  its own, with nothing saying they belong together.
