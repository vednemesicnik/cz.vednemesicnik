# 0038. Decisions are kept as a work log, not as binding records

- Date: 2026-10-23

## Context

[0001](0001-keep-what-the-work-settles-in-the-repository.md) kept decisions as records with a
status, in the style of architecture decision records:

- an accepted record was never rewritten;
- a new one had to be checked against every accepted record before it could be accepted;
- a change of direction superseded the old record.

The reviewer agent checked every diff against them.

In practice this bound the work more than it helped. Rethinking how an autosave editor handles a
taken address (#780) meant superseding five records in part. Each partly superseded record was
then marked as replaced even where most of it still held. Nothing in this app is final: the
design, the product model and the code keep moving. A format that treats each answer as law
makes it expensive to say that a better answer exists.

What the records were good for still matters. They say why something is the way it is and what
was turned down, so it is not proposed or rebuilt again by accident.

## Outcome

- `docs/decisions/` becomes `docs/work-log/`. An entry is a dated note of what the work settled
  on and why. It is context for later work, not a rule.
- An entry has no status. A change of direction gets a new entry, and the old one gets a single
  `Later: NNNN` line. Its text stays as history.
- A new entry is not checked against every earlier one. Before changing an area, read its
  entries, so that a change of direction is deliberate and logged rather than accidental.
- Agents write entries with `/log-work`, which replaces `/record-decision`. Code comments cite an
  entry as `log NNNN`.

## What follows

- The reviewer agent and the pipeline skills read entries as context. A diff that departs from an
  entry is a finding only when nothing says why: the issue, the PR or a new entry.
- [0018](0018-agents-decide-and-inform.md) still holds: agents make the call and report it. An
  entry is where a call that shapes later work is written down.
- Agent memory keeps a pointer to an entry, not a second copy.

## Turned down

- **Keeping the records and only dropping the supersede ceremony.** The word "decision" and the
  status line would still read as binding, and the reviewer would still treat them as rules.
- **No log at all, only issues and PRs.** The reason behind a shape and the options turned down
  get lost in long threads, and the same proposal comes back.
