---
name: review-idea
description: Weigh a proposal against product, design and UX before it becomes an issue — and say no when it should be no. Use when an idea or a change is proposed and it is not yet settled whether it deserves an issue at all.
argument-hint: <what is being proposed>
allowed-tools: Bash(gh issue list:*), Bash(gh issue view:*), Bash(git log:*)
---

## What is being proposed

`$ARGUMENTS`

## Open issues

!`gh issue list --limit 25`

## Recent work

!`git log --oneline -12`

## Task

You are the gate between an idea and an issue. Nothing here writes code, and the
**most valuable outcome is a well-argued no** — an issue that should not exist costs a plan,
an implementation, a review and a revert before anybody notices.

This exists because of **#159**. It was written from a design answer, planned, implemented in
full, reversed three times in one afternoon and closed as _not planned_. Every question below
is one that would have stopped it on the first pass. They are not a general product checklist;
they are that post-mortem turned into a procedure. Read #159's closing comment once before
using this on something that resembles it.

### Phase 0 — Understand what is actually proposed

If the argument is empty, ask what is being weighed and stop. Otherwise restate the proposal in
one sentence, in your own words, and say what surfaces it would touch. If you cannot state it in
one sentence, that is the first finding.

Read what already exists before weighing anything: the design documents that cover it (the app
project's artifact, read one screen at a time as
[docs/design-project.md](../../../docs/design-project.md) describes),
the code it would sit in, and the open issues above — half of these proposals are already
somebody else's issue under a different name.

### Phase 1 — The three lenses

Answer every question **with evidence**, naming a file, a document or a drawing. "Probably" is
not an answer; it is a finding that the proposal is not ready.

#### Product — should this exist at all

1. **Who asks this question, and how often?** Name the person and the occasion. This is a student
   editorial board making four issues a year; a thing that happens twice a year has to earn a
   new screen. Frequency against cost, both stated out loud.
2. **What answers it today, and why is that not enough?** There is nearly always something.
   In billing, #159's purpose — telling that a document did not vanish from the series — was already served
   by the **mandatory** reason on the storno. The proposal has to beat what exists, not merely
   differ from it.
3. **Is the reason a need, or a symmetry?** _"It should work like the corrective document"_ is
   the shape of an argument, not an argument. #159 rested on symmetry with `K faktuře:` — and
   that collapsed the moment somebody asked why the corrective document needs its reference
   (without it a minus document cannot be assigned) and whether the new one does (it cannot,
   an invoice is complete on its own). **Symmetry is a tiebreaker between two designs that are
   both needed. It is never the reason one of them exists.**

#### Evidence — will the data actually mean anything

These two killed #159 and neither is a design question. **A bad answer here is a stop, not a
note.**

4. **What produces this data, and does that thing exist?** Name the act. If the answer is "an
   action we have not designed", the proposal is a consumer for data nothing produces, and it
   waits. #159's own body said _"Which action creates a replacement… is not drawn — do not
   invent it here"_ — that sentence was in the issue from the start and was read as a footnote.
   **An undrawn producer is a blocker, not scope-limiting prose.**
5. **If the record is missing, does its absence mean anything?** Data that only appears when
   somebody took one particular route is not evidence. #159's binding would exist on invoices
   made by duplicating and be absent on invoices typed from scratch — so _no binding_ would have
   meant neither "no successor" nor "successor unknown". **A field whose absence says nothing
   cannot answer the question it was added for**, and it is worse than no field, because it
   looks like a record.

#### Design and UX — is it drawn, and for whom

6. **Who is the audience of each surface this touches?** The e-mail goes to an author or a
   provider and the shared-link page to whoever has the link; the screens are the
   editors-in-chief's. Two of #159's three reversals came from that one
   distinction, and nobody had made it. State the audience of every surface separately, and ask
   of each: does this reader need it, or are we telling them about our own bookkeeping?
7. **Is it drawn, or are we filling in?** If the design documents are silent, or two of them
   disagree, the answer is `/ask-design` **before** the issue exists — not a `Not drawn` section
   inside it. A design answer is also not automatically a mandate: an answer reasoning from a
   premise nobody checked (see 3) is exactly what this round is for, and it goes back with the
   new information rather than into an issue.

### Phase 2 — The verdict

Ask the user with `AskUserQuestion` only if the evidence genuinely leaves the call open.
Otherwise say which of the three it is, and why, in your own voice:

- **Write the issue.** Every question answered with evidence. The answers are not thrown away —
  they become the issue: 1 and 2 the motivation, 4 the mechanism, 6 what each surface gets,
  7 the design citations. An issue that carries them is one a planner cannot misread.
- **Ask design first.** 6 or 7 unresolved. Run `/ask-design`, and come back to this round with
  the answer — not to `/plan-issue`.
- **Drop it.** 4 or 5 failed, or 1 and 2 came out against it. Say so plainly and record the
  reasoning **where the next person will hit it**: a comment on the issue it would have
  duplicated, or a note in the design document that proposes it. A no that leaves no trace gets
  proposed again in a month.

Never soften a drop into "we could do a smaller version". If a smaller version is right, that
is a different proposal and it goes through this round from the top.

### What this round does not do

It does not weigh _how_ to build the thing — that is `/plan-issue`. It does not open the issue
on GitHub either; it produces the argued text and the verdict, and the user opens it. And it
never runs on a bug: something already broken is not a proposal, it is a repair.
