---
name: review-idea
description: Weigh a proposal against product, design and UX before it becomes an issue — and say no when it should be no. Use when an idea or a change is proposed and it is not yet settled whether it deserves an issue at all.
argument-hint: <what is being proposed>
allowed-tools: Bash(gh issue list:*), Bash(gh issue view:*), Bash(git log:*)
---

## What is being proposed

`$ARGUMENTS`

## Open issues

!`gh issue list --limit 60`

## Recent work

!`git log --oneline -12`

## Task

You are the gate between an idea and an issue. Nothing here writes code, and the **most
valuable outcome is a well-argued no** — an issue that should not exist costs a plan, an
implementation, a review and a revert before anybody notices.

The questions below come from a post-mortem in the billing app (its #159): an issue written from
a design answer, planned, built in full, reversed three times in an afternoon and closed as _not
planned_. Every question is one that would have stopped it on the first pass.

### Phase 0 — Understand what is actually proposed

If the argument is empty, ask what is being weighed and stop. Otherwise restate the proposal in
one sentence and name the surfaces it touches — public website, administration, e‑mail, a
form. If it does not fit one sentence, that is the first finding.

Read what exists before weighing: the design screens that cover it (`DesignSync`, app project
`60d13daa-be98-47ec-95e1-e8913a86fef4`, one screen at a time per `docs/_design-project.md`), the
code it would sit in, and the open issues — half of these proposals are already an issue under
another name.

### Phase 1 — The three lenses

Answer every question **with evidence** — a file, a document, a drawing. "Probably" is a finding
that the proposal is not ready.

#### Product — should this exist at all

1. **Who asks this, and how often?** Name the person and the occasion: a reader of the
   magazine, an author, the coordinator, the association's board. A student magazine publishes
   a few articles a month; a thing that happens twice a year has to earn a schema change.
2. **What answers it today, and why is that not enough?** There is nearly always something. The
   proposal has to beat what exists, not merely differ from it.
3. **Is the reason a need, or a symmetry?** "It should work like podcasts do" is the shape of an
   argument, not an argument. **Symmetry is a tiebreaker between two designs that are both
   needed, never the reason one of them exists.**

#### Evidence — will the data mean anything

A bad answer here is a **stop**, not a note.

4. **What produces this data, and does that thing exist?** Name the act. If it is "an action we
   have not designed", the proposal consumes data nothing produces, and it waits. **An undesigned
   producer is a blocker, not scope prose.**
5. **If the record is missing, does its absence mean anything?** Data that exists only when
   somebody took one particular route is not evidence. A field whose absence says nothing cannot
   answer the question it was added for — and it looks like a record.

#### Design and UX — is it drawn, and for whom

6. **Who reads each surface this touches?** The public website is for readers; the
   administration is for the editorial team; an e‑mail goes to someone outside. State each
   audience separately and ask: does this reader need it, or are we telling them about our own
   bookkeeping?
7. **Is it drawn, or are we filling in?** If the design is silent or two screens disagree, the
   answer is `/ask-design` **before** the issue exists. A design answer is not automatically a
   mandate either: one reasoning from an unchecked premise goes back with the new information.

### Phase 2 — The verdict

Ask with `AskUserQuestion` only if the evidence genuinely leaves the call open. Otherwise say
which of the three it is, and why:

- **Write the issue.** Every question answered with evidence. The answers become the issue (in
  English): 1–2 the motivation, 4 the mechanism, 6 what each surface gets, 7 the design
  citations, plus acceptance-criteria checkboxes.
- **Ask design first.** 6 or 7 unresolved → `/ask-design`, and come back here with the answer —
  not to `/plan-issue`.
- **Drop it.** 4 or 5 failed, or 1 and 2 came out against it. Record the reasoning **where the
  next person will hit it** — a comment on the issue it would have duplicated, or on the
  proposal's own issue. A no that leaves no trace gets proposed again in a month.

Never soften a drop into "we could do a smaller version". A smaller version is a different
proposal and goes through this round from the top.

### What this round does not do

It does not weigh _how_ to build — that is `/plan-issue`. It does not open the issue; it produces
the argued text and the verdict, and the user opens it (or asks you to). It never runs on a bug:
something already broken is a repair, not a proposal.
