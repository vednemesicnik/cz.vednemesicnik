---
name: review-implementation
description: Review the implementation on this branch before a PR exists — read the local diff against the repo rules and check it against the GitHub issue's acceptance criteria. Report-only; edits only after approval. Use when a feature branch needs a review pass on its own, outside /ship-issue.
argument-hint: [issue-number]
allowed-tools: Bash(gh issue view:*), Bash(gh issue list:*), Bash(git rev-parse:*), Bash(git branch:*), Bash(git diff:*)
---

## Requested issue number

`$ARGUMENTS`

## Current branch

!`git rev-parse --abbrev-ref HEAD`

## Diff vs dev

!`git diff --stat dev...HEAD`

## Issue (only if a number was given above)

!`gh issue view $ARGUMENTS 2>/dev/null || echo "(no issue-number argument — derive it from the branch name above)"`

## Issue comments

!`gh issue view $ARGUMENTS --comments 2>/dev/null || true`

## Open issues (fallback list)

!`gh issue list --limit 20`

## Task

Review the implementation on this branch against the issue above. This is a **pre-PR** stage:
the review runs on the local diff. `/ship-issue` runs the same review as its Phase A.

1. **Resolve the issue**: the argument, else the branch name (`feat/247-…` → `247`) and
   `gh issue view <number> --comments`, else ask. Do not guess.

2. **Extract the design** where the issue touches a designed screen: read the screen by its
   anchor as `docs/_design-project.md` describes — `get_file` here, never in a subagent — and
   save its text and notes to a scratchpad file. The screen decides, not the issue's summary
   of it.

3. **Hand the review to the `implementation-reviewer` agent** (`.claude/agents/`). It reads
   every hunk in a fresh context — the session that wrote the code does not grade its own
   work — against the rules, `AGENTS.md`, the decision records and the issue's acceptance
   criteria. Give it the issue number, the base (`dev`, or the parent branch when stacked)
   and the design file, if any. On a large diff, spawn one per area in parallel and say which
   paths each one owns.

   There is no PR yet, so not the `code-review:code-review` plugin skill — it reads an
   existing PR and posts a comment with an AI-attribution footer. The built-in
   `/code-review` reviews the working diff but is **user-triggered**; suggest it if the user
   wants that engine first.

4. **One ranked report**, most-severe first: the agent's report, merged across agents when
   there were several. Check a finding against the code before you pass it on; drop what does
   not hold and say so.

5. **Stop and wait for approval.** No edits in this turn. After the user picks, apply the fixes
   and re-run `pnpm app:typecheck` and `pnpm test`.
