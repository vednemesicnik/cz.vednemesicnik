---
name: implement-issue
description: Implement the approved plan for a GitHub issue on a feature branch — autonomous edits, typecheck + tests, Conventional Commits (stops before the PR). Use when a plan for an issue is approved and the code has to be written, or when work resumes on a feature branch that already has one.
argument-hint: [issue-number]
allowed-tools: Bash(gh issue view:*), Bash(gh issue list:*), Bash(gh pr view:*), Bash(git rev-parse:*), Bash(git branch:*), Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(ls:*), Bash(node --version)
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

!`ls -t ~/.claude/plans/plan-issue-*.md 2>/dev/null | head -10 || echo "(none — /plan-issue has not been run)"`

## Issue (only if a number was given above)

!`gh issue view $ARGUMENTS 2>/dev/null || echo "(no issue-number argument — derive it from the branch name above)"`

## Issue comments

!`gh issue view $ARGUMENTS --comments 2>/dev/null || true`

## Open issues (fallback list)

!`gh issue list --limit 20`

## Task

You are the **implementation stage** of the issue pipeline:
`/discover-idea` → `/review-idea` → `/plan-issue` → **`/implement-issue`** → `/ship-issue` → `/next-issue`.

Execute the approved plan autonomously: branch → edits → typecheck + tests → Conventional
Commits. Stop before pushing and before the PR — that is `/ship-issue`.

### Phase 0 — Preflight

1. **Resolve the issue**: "Requested issue number" if non-empty; else the branch name
   (`feat/247-…` → `247`) and `gh issue view <number> --comments`; else `Closes #<n>` in
   `gh pr view --json body`; else show the "Open issues" list and ask. Do not guess.

2. **Check the runtime.** "Node version" must be **26 or newer**. On Node 24 `better-sqlite3`
   fails to load (ABI mismatch) and the seed and the dev server break in ways that read as
   broken code. After an `nvm` switch, lefthook may die with `env: node: No such file or
   directory` — prepend the live `~/.nvm/versions/node/v26.*/bin` to `PATH`. Fix the runtime
   before believing any failure.

3. **Load the plan** `~/.claude/plans/plan-issue-<number>-*.md`. If none exists, say so and
   ask whether to run `/plan-issue <number>` first or implement from the issue body — do not
   silently invent a plan.

4. **Get on the right branch.**
   - On `dev` or `main`: `git fetch origin --prune`, then create `feat/<number>-<kebab-slug>`
     from up-to-date `dev` (`fix/…` for bugfixes, per `docs/_branching-model.md`).
   - On a feature branch carrying this issue number: continue on it.
   - On a feature branch for a **different** issue: stop and ask. Branching off that
     unmerged branch (a stacked PR) is possible, but it is the user's call.

5. **Load what governs the files you'll touch** before the first edit:
   `.agents/rules/*/RULE.md` (file-naming, typescript-conventions, naming-no-abbreviations,
   functional-style), the relevant `.agents/skills/*/SKILL.md` (general-guidance for CSS and
   stories, react-router, prisma-*), and the `modern-web-guidance` search for HTML/CSS/JS.

### Phase 1 — Implement

Work through the plan's steps **end to end without asking between steps**. Report progress,
don't narrate every edit; track the steps with the task tools when there are more than a
handful. Reuse what the plan names; keep the diff to its scope — no drive-by refactors.

**Stop and ask only when** it genuinely can't be decided from the plan:

- the plan left a fork open, or a discovery invalidates its approach;
- a destructive or irreversible operation — notably `prisma migrate reset`/`dev`, which is
  guarded for agents and needs the user's explicit consent text;
- a schema, migration or public-contract change the plan didn't anticipate;
- credentials, production data, or anything outward-facing.

### Phase 2 — Verify

1. `pnpm app:typecheck` and `pnpm test` — both must pass. Report failures with their output;
   never paper over them.
2. If the change is user-visible, run the app (`pnpm app:dev`, or the `/run` skill) and
   confirm the behaviour. Sign in with the seed users (`prisma/data/users.ts`); password
   sign-in needs `ALLOW_PASSWORD_SIGN_IN="true"`.
3. Re-read the acceptance criteria and check each against the actual diff. Name anything
   unmet; do not claim work that isn't done.

### Phase 3 — Commit

Commit locally in logical chunks. **Do not push and do not open a PR.**

- **Conventional Commits**, one concise subject line, English. Write the first subject as the
  line you would want in `git log` — a multi-commit squash puts the PR title on `dev`, and
  `/ship-issue` starts that title from here.
- No AI-attribution / `Co-Authored-By` lines. No references to gitignored notes.
- Append-only history — never force-push or reset already-pushed commits.

### Finish

Report: branch, what was implemented, typecheck/test status, acceptance criteria met vs.
outstanding, and any deviation from the plan (and why).

Then **close with what is open, in the order it should be done** — `/ship-issue <number>` is
**one item on that list, not the list.** A criterion left unmet because it needs a decision, a
follow-up the diff made obvious, a document or a design drawing the change left stale — a
short numbered list, most important first, one or two lines each, and offer the top one as a
question answerable in a word.
