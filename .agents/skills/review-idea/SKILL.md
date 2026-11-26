---
name: review-idea
description: Weigh a proposal against product, evidence, design and security before it becomes an issue — and say no when it should be no, or change the written plan when the plan is what is out of date. Use when an idea or a change is proposed and it is not yet settled whether it deserves an issue at all, or when circumstances have changed and an app's product, architecture or security documents may no longer say what is true.
argument-hint: <what is being proposed>
allowed-tools: Bash(gh issue list:*), Bash(gh issue view:*), Bash(git log:*)
---

## What is being proposed

`$ARGUMENTS`

## Open issues

!`gh issue list --limit 60 --json number,title,labels --template '{{range .}}{{.number}}  [{{range .labels}}{{.name}} {{end}}]  {{.title}}{{"\n"}}{{end}}'`

## Recent work

!`git log --oneline -12`

## Task

You are the gate between an idea and an issue. Nothing here writes code, and the **most
valuable outcome is a well-argued no** — an issue that should not exist costs a plan, an
implementation, a review and a revert before anybody notices.

The questions below come from an issue that was written from a design answer, planned, built in
full, reversed three times in an afternoon and closed as _not planned_. Every question is one that
would have stopped it on the first pass.

### Phase 0 — Understand what is actually proposed

If the argument is empty, ask what is being weighed and stop. Otherwise restate the proposal in
one sentence, decide which app it belongs to, and name the surfaces it touches. If it does not fit
one sentence, that is the first finding.

Read what exists before weighing, from that app's `AGENTS.md` § For the workflow skills: the
design screens that cover it (**Design project**, one screen at a time), the sections of its
product, architecture and security documents it would change and the findings of the newest
dated review document it touches (**Written design**, where the app has them), the work log in
`docs/work-log/`, the code it would sit in, and the open issues — half of these proposals are
already an issue under another name, and some are a review finding under a new one.

**The written design is the plan, not a veto.** A proposal that contradicts it is not wrong for
that alone: the plan was written from what was known on its date, and a decision since, a service
that changed under us or what the newsroom turned out to do can make the document the thing that
is wrong. Say which of the two it is, with the evidence — the circumstance, its date and where it
is recorded. An out-of-date document is a proposal in its own right, and it ends in _Change the
plan_.

### Phase 1 — The four lenses

Answer every question **with evidence** — a file, a document, a drawing. "Probably" is a finding
that the proposal is not ready.

#### Product — should this exist at all

1. **Who asks this, and how often?** Name the person and the occasion. A student magazine
   publishes a few articles a month and a few issues a year; a thing that happens twice a year has
   to earn a schema change or a new screen.
2. **What answers it today, and why is that not enough?** There is nearly always something. The
   proposal has to beat what exists, not merely differ from it. A proposal that breaks a rule or a
   limit the product document promises names it and says why it should change.
3. **Is the reason a need, or a symmetry?** "It should work like the other one does" is the shape
   of an argument, not an argument. **Symmetry is a tiebreaker between two designs that are both
   needed, never the reason one of them exists.**

#### Evidence — will the data mean anything

A bad answer here is a **stop**, not a note.

4. **What produces this data, and does that thing exist?** Name the act. If it is "an action we
   have not designed", the proposal consumes data nothing produces, and it waits. **An undesigned
   producer is a blocker, not scope prose.** Data whose producer is a job not built yet waits for
   that job.
5. **If the record is missing, does its absence mean anything?** Data that exists only when
   somebody took one particular route is not evidence. A field whose absence says nothing cannot
   answer the question it was added for — and it looks like a record.

#### Design and UX — is it drawn, and for whom

6. **Who reads each surface this touches?** State each audience separately — a reader, a
   signed-in member of the newsroom, whoever holds a shared link, the recipient of an e‑mail —
   and ask: does this reader need it, or are we telling them about our own bookkeeping?
7. **Is it drawn, or are we filling in?** If the design is silent or two screens disagree, the
   answer is `/ask-design` **before** the issue exists. A design answer is not automatically a
   mandate either: one reasoning from an unchecked premise goes back with the new information.

#### Security — what it opens, and to whom

The repository is public, and a path can run without a session, so a proposal can open a door
without anybody drawing one. Answer from the app's security document where it has one.

8. **Which trust boundary does it cross, and who is on the other side?** Name the visitor of
   every new or changed path: a signed-in user and their role, whoever holds a link, a job or a
   script calling without a session, or anybody at all. A path that runs without the session and
   CSRF names what protects it — a key, a limit, a token — and a new thing a visitor without
   sign-in can do states its limit. **A surface reachable without sign-in that nothing limits or
   proves is a stop, not a note.**
9. **What does it add to what is worth protecting?** A new field about a person states its
   purpose and how long it is kept. A new secret, outbound call or kind of file says how it is
   kept, signed or shared. A proposal that builds on an accepted risk or an open review finding
   cites it: building on a known gap makes it more expensive to close.

### Phase 2 — The verdict

Say which of the four it is, and why. Every product, architecture and security point under it is
yours to decide, with its reason. When the evidence leaves the call open, do not hand it to the
user: get a second opinion as [decide-and-inform](../../rules/decide-and-inform/RULE.md)
describes, then give the verdict.

- **Write the issue.** Every question answered with evidence. The answers become the issue (in
  English): 1–2 the motivation, 4 the mechanism, 6 what each surface gets, 7 the design
  citations, 8–9 its security section, plus acceptance-criteria checkboxes. It names its type —
  _Bug_, _Feature_ or _Task_ — and carries its app's label, `web` or `publikace` (both for the
  host or the repository), in the same `gh issue create`
  ([\_workflow-skills.md](../../../docs/_workflow-skills.md) § The issue's type and status) — which sections of the written design it changes and in what words,
  and which review finding it resolves: the documents change in the same PR as the code. Before
  writing, put the three questions of § Filing an issue to it: an open issue that carries the work
  gets a comment instead (its title rewritten if the scope widens); work the size of two PRs is
  two issues, or an epic; and whether the release needs it is answered as the app's **Issue
  weighing** says.
- **Ask design first.** 6 or 7 unresolved → `/ask-design`, and come back here with the answer —
  not to `/plan-issue`.
- **Change the plan.** The proposal is right and the code already does it, or nothing in the code
  has to follow: a decision taken outside any issue, a service that changed, a rule the newsroom
  does not keep, a review finding that was wrong. Write the change into the app's documents
  yourself, on a `docs/<slug>` branch off `dev`, in the words of what is true now, never as
  history, with the resolution of any review finding it settles. Stop before the commit: show the
  diff and let the user say commit. A change that does need code is _Write the issue_, with the
  document change inside it.
- **Drop it.** 4 or 5 failed, 8 found a door nothing guards, or 1 and 2 came out against it.
  Record the reasoning **where the next person will hit it**: a comment on the issue it would have
  duplicated, or on the proposal's own issue. A no that settles a rule of the product goes into the
  app's product document as that rule, written as _Change the plan_ writes it, or, where the app
  has none, into the work log with `/log-work`. A no that leaves no trace gets proposed again in a
  month.

Never soften a drop into "we could do a smaller version". A smaller version is a different
proposal and goes through this round from the top.

### What this round does not do

It does not weigh _how_ to build — that is `/plan-issue`. It does not open the issue; it produces
the argued text and the verdict, and the user opens it (or asks you to). The only files it writes
are the app's documents, under _Change the plan_ or a drop that settles a rule, and it commits
none of them. It never runs on a bug: something already broken is a repair, not a proposal.
