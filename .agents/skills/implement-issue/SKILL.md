---
name: implement-issue
description: Implement the approved plan for a GitHub issue on a feature branch — autonomous edits, typecheck + tests, Conventional Commits (stops before the PR). Use when a plan for an issue is approved and the code has to be written, or when work resumes on a feature branch that already has one.
argument-hint: [issue-number]
allowed-tools: Bash(gh issue view:*), Bash(gh issue list:*), Bash(gh pr view:*), Bash(git rev-parse:*), Bash(git branch:*), Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(ls:*), Bash(node --version), Bash(gh api repos/{owner}/{repo}/issues/*), Bash(gh api -X PATCH repos/{owner}/{repo}/issues/*), Bash(gh project item-list:*), Bash(gh project field-list:*), Bash(gh project view:*)
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

!`gh issue list --limit 20 --json number,title,labels --template '{{range .}}{{.number}}  [{{range .labels}}{{.name}} {{end}}]  {{.title}}{{"\n"}}{{end}}'`

## Task

You are the **implementation stage** of the issue pipeline:
`/discover-idea` → `/review-idea` → `/plan-issue` → **`/implement-issue`** → `/ship-issue` → `/next-issue`.

Execute the approved plan autonomously: branch → edits → gates → Conventional Commits. Stop
before pushing and before the PR — that is `/ship-issue`.

### Phase 0 — Preflight

1. **Resolve the issue**: "Requested issue number" if non-empty; else the branch name
   (`feat/247-…` → `247`) and `gh issue view <number> --comments`; else `Closes #<n>` in
   `gh pr view --json body`; else show the "Open issues" list and ask. Do not guess.

2. **Decide the app** the issue belongs to by the files the plan touches (`apps/web/**`,
   `apps/publikace/**`, or the repository's own outside `apps/`), and read that app's
   `AGENTS.md` § For the workflow skills. Every app-specific step below names the item it uses.

3. **Check the runtime.** "Node version" must be **26 or newer**; on an older one both apps
   fail in ways that read as broken code. Read the app's **Traps** for what else breaks the
   tooling before the code does (a hook that loses `node` after an `nvm` switch, a generate
   step on a fresh checkout). Fix the runtime before believing any failure.

4. **Load the plan** `~/.claude/plans/plan-issue-<number>-*.md`. If none exists, say so and
   ask whether to run `/plan-issue <number>` first or implement from the issue body — do not
   silently invent a plan.

5. **Get on the right branch.**
   - On `dev` or `main`: `git fetch origin --prune`, then create `feat/<number>-<kebab-slug>`
     from up-to-date `dev` (`fix/…` for bugfixes, per
     [docs/\_branching-model.md](../../../docs/_branching-model.md)).
   - On a feature branch carrying this issue number: continue on it.
   - On a feature branch for a **different** issue: stop and ask. Branching off that
     unmerged branch (a stacked PR, [docs/\_branching-model.md](../../../docs/_branching-model.md)
     § Stacked PRs) is possible, but it is the user's call.

   Once on the branch, **move the issue to _In progress_**: read its status with
   `gh api repos/{owner}/{repo}/issues/<number> --jq .status.name`, and unless it is already
   _In progress_ or _In review_, set it with
   `gh api -X PATCH repos/{owner}/{repo}/issues/<number> -f status='In progress' --jq .status.name`.
   When the app's **Issue weighing** names a project, set the item's Status there to In Progress
   too ([docs/\_workflow-skills.md](../../../docs/_workflow-skills.md) § Ordering by a project).

6. **Load what governs the files you'll touch** before the first edit: the app's **Rules**
   (its rule files, its guidance skills, the `modern-web-guidance` search for HTML, CSS and
   client-side JavaScript) and its **Traps**.

### Phase 1 — Implement

Work through the plan's steps **end to end without asking between steps**. Report progress,
don't narrate every edit; track the steps with the task tools when there are more than a
handful. Reuse what the plan names; keep the diff to its scope — no drive-by refactors.

**The documents change with the code.** Make the edits the plan's _The written design_ names
to the app's **Written design**, in the words of what is true once the branch lands, never as
history. When the issue resolves a finding of a dated review document, write the issue number
into that finding's _Resolution_ and leave the rest of the review as it is: it is a dated
reading, and only its resolutions move. If the code turns out to change something the plan
said it would not — a state, a limit, an endpoint, a job, a boundary — the documents follow
the code here, and the deviation is named in the Finish report. A work-log entry the plan
calls for is written in this branch too (`/log-work`).

**A gated change is gated everywhere.** When the plan's _Release_ puts the change behind the
app's **Release gate**, every surface it adds calls the gate's helper — the UI hides it and its
route or action answers 404 in production — and a migration only expands; dropping the old
structure is a contract issue of its own
([docs/\_branching-model.md](../../../docs/_branching-model.md) § Unreleased work behind a
gate, § Migrations: expand, then contract). The first issue that needs the helper adds it, by the app's rules.

When the plan left a fork open, a discovery invalidates its approach, or a schema, migration or
public-contract change turns up that the plan didn't anticipate, **decide** per
[decide-and-inform](../../rules/decide-and-inform/RULE.md) and name the decision in the Finish
report — except for the two below, which are always asked.

**Stop and ask only for:**

- an authentication, two-factor or session mechanism the plan did not settle;
- **an applied migration that looks like it wants editing — a hard stop.** Editing one is
  never the answer (the app's **Traps** say why its runner refuses the database); a new
  migration is, decided like any other fork above;
- a destructive or irreversible operation, or a consent-guarded command the app's **Traps**
  name;
- credentials, production data, or anything outward-facing.

### Phase 2 — Verify

1. **The app's Gates** — every one must pass. Fix and re-run until green; report failures
   with their output, never paper over them. A gate that checks formatting can fail on a
   Markdown file written this turn, not on the code — the app's **Traps** say when and how to
   format it.
2. **See it**, if the change is user-visible, as the app's **Seeing a change** says (the dev
   server or the fake app, the seed users, the `/run` skill), and confirm the behaviour the
   issue asked for. **Be honest about reach:** a page behind a sign-in the agent cannot drive
   (Google SSO, the production site) is handed to the user as a named check, never reported
   as passed.
3. **Re-read the acceptance criteria** — the plan's explicit list plus anything the issue's
   prose asked for — and check each against the actual diff, the documents included. Name
   anything unmet; do not claim work that isn't done.

### Phase 3 — Commit

Commit locally in logical chunks. **Do not push and do not open a PR.**

- **Conventional Commits**, one concise subject line, English, with the app's **Commit
  scopes**. Write the first subject as the line you would want in `git log` — a single-commit
  squash lands it on `dev` as it is, and `/ship-issue` starts the PR title from it.
- No AI-attribution / `Co-Authored-By` lines. No references to gitignored notes.
- Append-only history — never force-push or reset already-pushed commits.

### Finish

Report: branch, app, what was implemented, the status of each gate, acceptance criteria met
vs. outstanding, the documents changed, every decision taken under decide-and-inform with what
it turned down, and any deviation from the plan (and why). Name every check handed to the user.

Then **close with what is open, in the order it should be done** — `/ship-issue <number>` is
**one item on that list, not the list.** A criterion left unmet because it waits on the user
(a fact only they have, a sign-in only they can make, an outward step), a follow-up the diff
made obvious, a document or a design drawing the change left stale — a short numbered list,
most important first, one or two lines each, and offer the top one as a question answerable in
a word. Three or four items is a list; ten is a backlog, and the backlog is `gh issue list`.
