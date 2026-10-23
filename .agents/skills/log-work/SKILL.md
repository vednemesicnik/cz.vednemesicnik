---
name: log-work
description: Write a numbered entry in docs/work-log/ — what the work settled on, when, why, and what was turned down — or log a change of direction from an earlier entry. Use when a piece of work settles something later work should know (architecture, the product model, security, tooling), when a proposal is dropped for a reason the next person needs, or when an earlier entry's direction changes.
argument-hint: <what was settled, in a sentence>
allowed-tools: Bash(ls:*), Bash(grep:*), Bash(gh issue view:*), Bash(gh pr view:*)
---

## What was settled

`$ARGUMENTS`

## Existing entries

!`ls docs/work-log/`

## Task

Read `docs/work-log/README.md` (what an entry is, the index) and `docs/work-log/_template.md`
first. An entry is context for later work, not a rule: it records the best answer of its day.

### 1. Does it belong in the log?

Log it when later work should know it and the code does not say why: a data model shape, a
policy, a security mechanism, a dependency or tool chosen over another, a proposal dropped for
a reason that will come up again.

Do not log:

- UX, layout or visuals — the design project owns them (`/ask-design`); an entry may cite its
  answer when the outcome also shapes code;
- user-facing Czech — the copywriter owns it (`/ask-copy`);
- a convention for writing code — that is a rule in `.agents/rules/`, or a skill when it applies
  to one kind of work;
- what the code already says plainly, or a detail that ends with the issue.

If it is none of these, say which home it belongs in instead and stop.

### 2. Read what the log already says

`grep -ril` the topic's key words across `docs/work-log/` and read the entries that come up.

- **The same outcome is logged** — stop and cite it.
- **It changes direction from an entry** — write a new entry that says what changed and why,
  and add `- Later: NNNN` under the old entry's date. Leave the old text as it is.
- **It touches an entry without changing it** — cite it in the new entry.

### 3. Gather the evidence

An entry is read months later by someone who checks it. Take facts from the issue, the PR and
the code (`gh issue view`, `gh pr view`, `grep`), not from memory. The date is the day the work
settled on it; when backfilling, take it from the issue or PR.

### 4. Write it

Copy `_template.md` to `docs/work-log/NNNN-kebab-title.md` with the next free number, and remove
every hint comment. Then add a row to the index in `README.md`, and on a change of direction
fill the old entry's **Later** cell.

- The title says what was settled: `0042-invoices-are-never-deleted.md`, not `0042-invoices.md`.
- **Context** is what prompted it; **Outcome** is the present tense and short enough to quote;
  **What follows** says what later work should know and what would be a reason to revisit it;
  **Turned down** lists the options not taken and why.
- English, no abbreviations, a few short paragraphs. Link the topic document in `docs/` that
  describes the current state instead of repeating it.
- The repository is public: no unpublished e-mail addresses, secrets or personal data.

### 5. Ship it with the change

An entry from an issue goes into that issue's PR. One without code — a dropped proposal, a
policy — goes in its own small `docs:` PR. Name the entry in the PR body.

If agent memory holds the same outcome, reduce the memory to a pointer at the entry.
