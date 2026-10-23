# 0001. Keep what the work settles in the repository

- Date: 2026-10-13
- Later: 0038

## Context

What the work settled on, and why, was spread over issue bodies, PR threads, design answers
and an agent's private memory. The topic documents in `docs/` say how things are, not why,
and not what was turned down. An answer nobody can find gets proposed again — and sometimes
built — a few months later.

## Outcome

Whatever later work should know gets a numbered entry in the repository, in
[`docs/work-log/`](README.md). It is written when the work settles it, in the PR that carries
it, or on its own when no code changes. Agents write it with `/log-work`; `/plan-issue`,
`/review-idea` and `/next-issue` ask whether one is due.

What was settled before this entry was backfilled from its issues as 0002–0011.

The entries started as binding decision records with a status, in `docs/decisions/`, written
with `/record-decision`. [0038](0038-decisions-are-kept-as-a-work-log.md) made them this log.

## What follows

- An issue or a proposal that touches an area cites its entries, or says why it changes
  direction, and the change gets an entry of its own.
- Design and copy answers stay in their own projects; an entry cites them.
- Agent memory keeps a pointer to an entry, not a second copy of it.
