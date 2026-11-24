---
name: review-idea
description: Weigh a proposal against product, evidence, design and security before it becomes an issue — and say no when it should be no, or change the written plan when the plan is what is out of date. Use when an idea or a change is proposed and it is not yet settled whether it deserves an issue at all, or when circumstances have changed and the product, architecture or security documents may no longer say what is true.
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
the sections of [product.md](../../../docs/product.md),
[architecture.md](../../../docs/architecture.md) and [security.md](../../../docs/security.md) it
would change, the findings of the newest `docs/review-*.md` it touches, the code it would sit in,
and the open issues above — half of these proposals are already somebody else's issue under a
different name, and some are a review finding under a new one.

**The written design is the plan, not a veto.** A proposal that contradicts it is not wrong for
that alone: the plan was written from what was known on its date, and a decision since, a service
that changed under us or what the newsroom turned out to do can make the document the thing that
is wrong. Say which of the two it is, with the evidence — the circumstance, its date and where it
is recorded. A document that is out of date is a proposal in its own right, and it ends in the
verdict _Change the plan_.

### Phase 1 — The four lenses

Answer every question **with evidence**, naming a file, a document or a drawing. "Probably" is
not an answer; it is a finding that the proposal is not ready.

#### Product — should this exist at all

1. **Who asks this question, and how often?** Name the person and the occasion. This is a student
   editorial board making four issues a year; a thing that happens twice a year has to earn a
   new screen. Frequency against cost, both stated out loud.
2. **What answers it today, and why is that not enough?** There is nearly always something.
   In billing, #159's purpose — telling that a document did not vanish from the series — was already served
   by the **mandatory** reason on the storno. The proposal has to beat what exists, not merely
   differ from it. `product.md` § People and § The journey say who does what today, and
   § Rules every screen follows and § Limits what the app has already promised them; a proposal
   that breaks a rule or a limit names it and says why it should change.
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
   **An undrawn producer is a blocker, not scope-limiting prose.** `architecture.md` names the
   producers there are: the data model, the flows, § Lifecycles and § Background work. Data
   whose producer is a job that is not built yet waits for that job, and the table there says
   which ones are.
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

#### Security — what it opens, and to whom

The repository is public, whoever holds a link never signs in and the jobs call without a
session, so a proposal can open a door without anybody drawing one. `security.md` is what these are answered from.

8. **Which trust boundary does it cross, and who is on the other side?** Name the visitor of
   every new or changed path from § Trust boundaries: a signed-in editor-in-chief, a
   proofreader, whoever holds a link, a job with its ID token, or anybody at all. A path under
   `/l/` or `/api/` runs without the session and CSRF, so what protects it has to be named — a
   key, a limit, a token — and a new thing a visitor without sign-in can do needs its limit
   stated, the way an article link has thirty an hour. **A surface reachable without sign-in
   that nothing limits or proves is a stop, not a note.**
9. **What does it add to what is worth protecting?** A new field about a person goes into
   § Personal data with its purpose, and the retention that document still leaves open applies
   to it too. A new secret, a new outbound call or a new kind of file says how it is kept, signed
   or shared, against § Threats and controls. If the proposal relies on an accepted risk, or on
   a finding the review left open, cite it: building on top of a known gap makes the gap more
   expensive to close.

### Phase 2 — The verdict

**The verdict is yours, and so is every product, architecture and security point under it.**
You hold the documents, the code and the evidence; the user decides from a recommendation, not
from an open question, and a choice handed over without one is work handed back. State each
point as a decision with its reason. Ask with `AskUserQuestion` only when the call turns on
something only the user knows — what the newsroom actually does, money, a person, a service
account outside the repository — and even then put your recommendation first, with why. Say
which of the four it is, and why, in your own voice:

- **Write the issue.** Every question answered with evidence. The answers are not thrown away —
  they become the issue: 1 and 2 the motivation, 4 the mechanism, 6 what each surface gets,
  7 the design citations, 8 and 9 its security section. The issue also says **which sections of
  `product.md`, `architecture.md` or `security.md` it changes, and in what words**, and which
  review finding it resolves: the documents change in the same PR as the code, so the plan and
  the app never disagree for longer than a branch. It names its type too, _Bug_, _Feature_ or
  _Task_ as [docs/workflow-skills.md](../../../docs/workflow-skills.md) defines them, because
  the issue is opened with it (`gh issue create --type …`). An issue that carries all of it is
  one a planner cannot misread.
- **Ask design first.** 6 or 7 unresolved. Run `/ask-design`, and come back to this round with
  the answer — not to `/plan-issue`.
- **Change the plan.** The proposal is right and the code already does it, or nothing in the
  code has to follow: a decision taken outside any issue, a service that changed, a rule the
  newsroom does not keep, a finding the review got wrong. Write the change into the documents
  yourself — on a `docs/<slug>` branch off `dev`, in the words of what is true now, never as
  history — together with the _Resolution_ of any review finding it settles, and stop before the
  commit: show the diff and let the user say commit. A change that does need code is _Write the
  issue_ instead, with the document change inside it.
- **Drop it.** 4 or 5 failed, 8 found a door nothing guards, or 1 and 2 came out against it. Say so plainly and record the
  reasoning **where the next person will hit it**: a comment on the issue it would have
  duplicated, a note in the design document that proposes it, or — when the no settles a rule of
  the product — that rule in `product.md`, written the way _Change the plan_ writes it. A no that leaves no trace gets
  proposed again in a month.

Never soften a drop into "we could do a smaller version". If a smaller version is right, that
is a different proposal and it goes through this round from the top.

### What this round does not do

It does not weigh _how_ to build the thing — that is `/plan-issue`. It does not open the issue
on GitHub either; it produces the argued text and the verdict, and the user opens it. The only
files it writes are the documents in `docs/`, under _Change the plan_ or a _Drop it_ that settles
a rule, and it commits none of them. A question of UX the documents leave open goes to
`/ask-design`; one of product, architecture or security is decided here, because the design
answers UX only and the user decides from recommendations. And it
never runs on a bug: something already broken is not a proposal, it is a repair.
