# 0001. Record decisions in the repository

- Date: 2026-10-13
- Later: 0038

## Context

Decisions that bind later changes were spread over issue bodies, PR threads, design answers
and an agent's private memory. The topic documents in `docs/` say how things are, not why,
and not what was turned down. A decision nobody can find gets proposed again — and sometimes
built — a few months later.

## Outcome

Every decision that binds later changes gets a numbered record in `docs/decisions/`, in the
format of [the index](README.md). It is written when the decision is made, in the PR that
carries it, or on its own when no code changes. Agents write it with `/record-decision`;
`/plan-issue`, `/review-idea` and `/next-issue` ask whether one is due.

The decisions made before this one were backfilled from their issues as 0002–0011.

## What follows

- An issue or a proposal that touches a recorded decision cites it, or argues for
  superseding it.
- Design and copy answers stay in their own projects; a record cites them.
- Agent memory keeps a pointer to a record, not a second copy of it.
