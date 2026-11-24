---
name: implement-issue
description: Implement the approved plan for a GitHub issue on a feature branch — autonomous edits, typecheck + tests, Conventional Commits (stops before the PR). Use when a plan for an issue is approved and the code has to be written, or when work resumes on a feature branch that already has one.
argument-hint: [issue-number]
allowed-tools: Bash(gh issue view:*), Bash(gh issue list:*), Bash(gh pr view:*), Bash(git rev-parse:*), Bash(git branch:*), Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(ls:*), Bash(node --version), Bash(gh api repos/{owner}/{repo}/issues/*), Bash(gh api -X PATCH repos/{owner}/{repo}/issues/*)
---

## Requested issue number

`$ARGUMENTS`

## Current branch

!`git rev-parse --abbrev-ref HEAD`

## Working tree

!`git status --short`

## Node version (26 or newer is required)

!`node --version`

## Plan files from /plan-issue (newest first)

!`ls -t ~/.claude/plans/plan-publikace-issue-*.md 2>/dev/null | head -10 || echo "(none — /plan-issue has not been run)"`

## Issue (only if a number was given above)

!`gh issue view $ARGUMENTS 2>/dev/null || echo "(no issue-number argument — derive it from the branch name above)"`

## Issue comments

!`gh issue view $ARGUMENTS --comments 2>/dev/null || true`

## Open issues (fallback list)

!`gh issue list --limit 20`

## Task

You are the **implementation stage** of the issue pipeline:
`/discover-idea` → `/review-idea` → `/plan-issue` → **`/implement-issue`** → `/ship-issue` → `/next-issue`.

Execute the already-approved plan autonomously: branch → edits → typecheck + tests →
Conventional Commits. Stop before pushing and before the PR — that is `/ship-issue`.

### Phase 0 — Preflight

1. **Resolve the issue** in this order: use "Requested issue number" if non-empty; else
   derive it from the "Current branch" name (`feat/30-…` → `30`) and fetch it with
   `gh issue view <number> --comments`; else — branches created before this pipeline
   carry no number (`feat/focus-ring-on-row-links`) — try `gh pr view --json body` for a
   `Closes #<n>` line; else show the "Open issues" list and ask which one
   (`/implement-issue <number>`). Do not guess.

2. **Check the runtime.** "Node version" above must be **26 or newer**. On Node 24 the
   suite fails with `Temporal is not defined` and the pre-push hook fails the same way —
   both read as broken code rather than a wrong shell. Fix the version before believing
   any failure.

3. **Load the plan.** Read `~/.claude/plans/plan-publikace-issue-<number>-*.md` from the
   list above. If no plan file exists for this issue, say so and ask whether to run
   `/plan-issue <number>` first or to implement straight from the issue body — do not
   silently invent a plan.

4. **Get on the right branch.**
   - On `dev` or `main`: `git fetch origin --recurse-submodules=no --prune`, then create
     `feat/<number>-<kebab-slug>` from
     up-to-date `dev` (slug from the issue title; `fix/…` for bugfixes, per
     [docs/branching-model.md](../../../docs/branching-model.md)).
   - Already on a feature branch carrying this issue number: continue on it.
   - On a feature branch for a **different** issue: stop and ask. If the new work
     genuinely builds on that unmerged branch, branching off it — a stacked PR — is
     established practice here, but it is the user's call, not an assumption.

   Once on the branch, **move the issue to _In progress_**: read its status with
   `gh api repos/{owner}/{repo}/issues/<number> --jq .status.name`, and unless it is already
   _In progress_ or _In review_, set it with
   `gh api -X PATCH repos/{owner}/{repo}/issues/<number> -f status='In progress' --jq .status.name`.

5. **Load what governs the files you'll touch** before the first edit: `AGENTS.md`
   (where a change belongs, house style, the things that bite),
   `.agents/skills/remix/SKILL.md` for routes, controllers, middleware and `remix/ui`
   components, the `modern-web-guidance` search for HTML/CSS/client-side JS, and
   [docs/migrations.md](../../../docs/migrations.md) before any schema work.

### Phase 1 — Implement

Work through the plan's implementation steps **end to end without asking for
confirmation between steps**. Report progress as you go; don't narrate every edit.
Track the steps with the task tools if the plan has more than a handful.

Prefer reusing existing utilities and components over new code — the plan already names
them. Keep the diff to the plan's scope: no drive-by refactors, no extra features.

**The written design changes with the code.** Make the edits the plan's _The written design_
names to `docs/product.md`, `docs/architecture.md` and `docs/security.md`, in the words of what
is true once the branch lands, never as history. When the issue resolves a finding of
`docs/review-*.md`, write the issue number into that finding's _Resolution_ and leave the rest of
the review as it is: it is a dated reading, and only its resolutions move. If the code turns out
to change something the plan said it would not — a state, a limit, an endpoint, a job, a
boundary — the documents follow the code here, and the deviation is named in the report.

Hold the house style while you write, not afterwards: `let` inside function bodies,
Czech for anything a user reads and English for everything else, comments that record a
decision and what it was chosen over, tests beside the code they test.

**Stop and ask only when** it genuinely can't be decided from the plan:

- the plan left a fork open, or a discovery invalidates the plan's approach;
- the change needs a **new migration where the plan expected none**, or — worse — looks
  like it wants an existing one edited. Editing an applied migration is never the
  answer: the journal stores a sha256 of `up.sql` and both runners refuse the database.
- a public-contract change the plan didn't anticipate;
- credentials, production data, or anything outward-facing is involved.

### Phase 2 — Verify

1. `pnpm typecheck` and `pnpm test` — both must pass. Fix and re-run until green; report
   failures with their output, never paper over them.
2. `pnpm lint` and `pnpm format`. The pre-push hook runs `format:check` and `oxfmt`
   formats **Markdown** too, so a doc written this turn fails the push unless `format`
   ran. The same hook trips on an unformatted `.claude/settings.local.json` — a failure
   that has nothing to do with the diff.
3. If the change is user-visible, run the app (`pnpm app:dev`, http://localhost:44100, or the
   `/run` skill) and confirm the behaviour the issue asked for. Sign-in is Google SSO, so
   an authenticated page may be out of your reach — mounting the piece on a throwaway
   public route is how to see it yourself; otherwise hand the browser check back to the
   user rather than claiming it passed.
4. Re-read the issue's acceptance criteria — the plan's explicit list, plus anything the
   issue's prose asked for — and check each one against the actual diff, the documents in
   `docs/` included. Anything unmet
   gets named. Do not claim done work that isn't.

### Phase 3 — Commit

Commit locally in logical chunks. **Do not push and do not open a PR.**

- **Conventional Commits**, single concise subject line, no body unless asked, English.
  The first commit's subject is the one `/ship-issue` reuses as the PR title, and a squash
  puts that title on `dev` — so write it as the line you would want to read in `git log`.
- No AI-attribution / `Co-Authored-By` lines.
- Append-only history — never force-push or reset already-pushed commits.

### Finish

Report: branch name, what was implemented, typecheck/test/lint status, acceptance
criteria met vs. outstanding, and any deviation from the plan (and why).

Then **close with what is open, in the order it should be done** — `/ship-issue <number>` for
review → PR → ready to merge is **one item on that list, not the list.** Writing the code turns
up work it cannot land: a criterion left unmet because it needs a decision, a follow-up the diff
made obvious, a document or a drawing the change left stale. A report that names only the next
command buries them, and they are exactly what does not survive a context window.

A short numbered list, **most important first**, where the order is the argument: one or two
lines per item saying what it is, why it waits, and the command or act that starts it. Then
offer the top one as a question the user can answer in a word. Three or four items is a list;
ten is a backlog, and the backlog is `gh issue list`.
