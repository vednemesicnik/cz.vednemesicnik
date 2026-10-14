# 0010. One component per role, no administration twins

- Status: Accepted
- Date: 2026-10-10
- Issues: PR #537

## Context

The application grew `Admin*` copies of public components. The design system draws one
component per role — one button, one dialog — with no split between administration and the
public site. The copies drift apart in variant names, borders and heights, and every adoption
of the design system lands twice.

## Decision

The `Admin*` twins are folded into the one component named after the design system, step by
step. The first step, PR #537, removed `AdminButton` in favour of `Button`.

## Consequences

- A change to an `Admin*` component that has a public or design-system counterpart unifies it
  instead of extending the copy — often within the same issue.
- A new component is not created in an administration and a public variant.
