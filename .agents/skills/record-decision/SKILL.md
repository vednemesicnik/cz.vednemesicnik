---
name: record-decision
description: Write a numbered decision record in docs/decisions/ — what was decided, when, why, and what was turned down — or supersede an older one, after checking it against every accepted record so they stay one consistent whole. Use when a decision that binds later changes has just been made (architecture, the product model, security, tooling), when a proposal is dropped for a reason the next person needs, or when an accepted decision changes.
argument-hint: <the decision, in a sentence>
allowed-tools: Bash(ls:*), Bash(grep:*), Bash(gh issue view:*), Bash(gh pr view:*)
---

## The decision

`$ARGUMENTS`

## Existing records

!`ls docs/decisions/`

## Task

Read `docs/decisions/README.md` (format, statuses, index) and `docs/decisions/_template.md`
first.

### 1. Is it a decision record at all?

Write one when the decision **binds a later change** and its reason is not obvious from the
code: a data model shape, a policy, a security mechanism, a dependency or tool chosen over
another, a proposal dropped for a reason that will come up again.

Do not write one for:

- UX, layout or visuals — the design project owns them (`/ask-design`); a record may cite
  its answer when the decision also binds code;
- user-facing Czech — the copywriter owns it (`/ask-copy`);
- a convention for writing code — that is a rule in `.agents/rules/`, or a skill when it
  applies to one kind of work (decision 0014);
- what the code already says plainly, or a detail that ends with the issue.

If it is none of these, say which home it belongs in instead and stop.

### 2. Is it already recorded?

`grep -ril` the topic's key words across `docs/decisions/`. If a record covers it:

- **the same decision** — stop and cite it;
- **a changed decision** — write a new record, and in the old one change **only** the status
  line to `Superseded by NNNN`. An accepted record's body is never rewritten.

### 3. Gather the evidence

The record is read months later by someone who checks it. Take facts from the issue, the PR
and the code (`gh issue view`, `gh pr view`, `grep`), not from memory. The date is the day
the decision was made; when backfilling, take it from the issue or PR that settled it.

A decision the user has not confirmed is `Proposed`; say so and ask before marking it
`Accepted`.

### 4. Check it against every accepted record

Step 2 finds records about the same topic. This step checks that the new decision fits
**all of them together**, because records on different topics can still collide. A
rule about who may edit content can contradict one about who may publish, for example.

Read the **Decision** and **Consequences** of every `Accepted` record, and for each one
say which applies:

- **unaffected** — a different area, nothing to check;
- **consistent** — they touch, and the new record relies on it or extends it; cite it in
  the new record;
- **in tension** — the new decision contradicts it, or a consequence of one would break the
  other. **Stop and ask the user** which one wins. The answer is a new record that
  supersedes the old one (step 2), or a changed draft of this one, never a silent pick.

Then check the new record against itself and what is planned:

- **its own consequences**: does each one follow from the decision, or does one turn
  today's interim state into a rule?
- **the design answers and the code it cites**: is a "must" the current code or an open
  issue's plan already breaks?
- **the process**: was it written in the PR that carried the decision, as 0001 asks? If
  not, say so.

Report the result to the user as a short table, record by record, with every tension named,
before the record is merged. A record that contradicts another one fails exactly where it
should help: the next change can no longer tell which one applies.

### 5. Write it

Copy `_template.md` to `docs/decisions/NNNN-kebab-title.md` with the next free number, and
remove every hint comment. Then add a row to the index in `README.md`.

- The title states the decision: `0042-invoices-are-never-deleted.md`, not
  `0042-invoices.md`.
- **Context** is what forced it; **Decision** is the present tense and short enough to quote;
  **Consequences** say what a later change must do and when to revisit; **Alternatives** list
  what was turned down and why.
- English, no abbreviations, a few short paragraphs. Link the topic document in `docs/` that
  describes the current state instead of repeating it.
- The repository is public: no unpublished e-mail addresses, secrets or personal data.

### 6. Ship it with the change

A decision made inside an issue goes into that issue's PR. A decision without code — a
dropped proposal, a policy — goes in its own small `docs:` PR. Name the record in the PR
body.

If agent memory holds the same decision, reduce the memory to a pointer at the record.
