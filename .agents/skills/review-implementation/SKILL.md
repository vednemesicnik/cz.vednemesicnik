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

2. **Review the diff inline.** There is no PR yet, so do **not** invoke the
   `code-review:code-review` plugin skill — it reads an existing PR and posts a comment with an
   AI-attribution footer. The built-in `/code-review` reviews the working diff but is
   **user-triggered**; suggest it if the user wants that engine first.

   Read every hunk of `git diff dev...HEAD` yourself against:
   - the checklist in `.agents/rules/self-review-before-pr/RULE.md` (correctness and data
     safety, React and effects, consistency);
   - the conventions in `.agents/rules/*/RULE.md` and `AGENTS.md` — kebab-case files,
     no-abbreviation identifiers, `type` over `interface`, functional style, TSDoc,
     `@layer`-wrapped CSS modules, English comments with Czech UI copy;
   - **design conformance** where the issue touches a designed screen — the screen itself in
     the design project, read by its anchor as `docs/_design-project.md` describes, not the
     issue's summary of it.

   On a large diff you may fan out to parallel `pr-review-toolkit:code-reviewer` subagents,
   one per area, and merge their findings.

3. **Add the issue-conformance layer.** Against the diff: each acceptance criterion met /
   partial / unmet (citing the file that fulfils it), scope creep, tests or docs the issue
   explicitly asked for.

4. **One ranked report**, most-severe first, in two sections — **Conformance gaps** and **Code
   findings** — each finding as `file:line` · severity · one-line problem · proposed fix.

5. **Stop and wait for approval.** No edits in this turn. After the user picks, apply the fixes
   and re-run `pnpm app:typecheck` and `pnpm test`.
