---
name: ship-issue
description: Close out the implementation on this branch — review + auto-fix, open the PR, run the Copilot review loop, get CI green, then ask and land it. Use when the implementation on a feature branch is finished and needs a review pass, a pull request, and merging.
argument-hint: [issue-number]
allowed-tools: Bash(gh issue view:*), Bash(gh issue list:*), Bash(gh pr view:*), Bash(gh pr list:*), Bash(gh pr checks:*), Bash(git rev-parse:*), Bash(git branch:*), Bash(git status:*), Bash(git diff:*), Bash(git log:*)
---

## Requested issue number

`$ARGUMENTS`

## Current branch

!`git rev-parse --abbrev-ref HEAD`

## Working tree

!`git status --short`

## Diff vs dev

!`git diff --stat dev...HEAD`

## Commits vs dev

!`git log --oneline dev..HEAD`

## Existing PR for this branch, if any

!`gh pr view --json number,title,baseRefName,headRefName,url,body,state,mergeable,isDraft 2>/dev/null || echo "(no PR yet)"`

## Open PRs, with their bases

!`gh pr list --state open --json number,title,baseRefName,headRefName --template '{{range .}}{{.number}}  {{.headRefName}} → {{.baseRefName}}  {{.title}}{{"\n"}}{{end}}'`

## Issue (only if a number was given above)

!`gh issue view $ARGUMENTS 2>/dev/null || echo "(no issue-number argument — derive it from the branch name above)"`

## Open issues (fallback list)

!`gh issue list --limit 20`

## Task

You are the **close-out stage** of the issue pipeline:
`/discover-idea` → `/review-idea` → `/plan-issue` → `/implement-issue` → **`/ship-issue`** → `/next-issue`.

Review → auto-fix → PR → Copilot loop → green CI → ask → merge. Reuse the existing pieces:
the review is `review-implementation`'s, the PR lifecycle is
`.agents/skills/pull-request-workflow/SKILL.md`, and the branch and merge rules are
`docs/_branching-model.md`. **Two human gates** exist — respect them.

### Phase 0 — Preflight

1. **Resolve the issue**: the argument, else the branch name (`feat/247-…` → `247`), else
   `Closes #<n>` in the existing PR body, else ask. Fetch it with
   `gh issue view <number> --comments`.
2. **Guard the branch.** On `dev` or `main`, stop. Note uncommitted changes; Phase B commits
   them.

### Phase A — Review the implementation (pre-PR, inline)

Run the review exactly as `.agents/skills/review-implementation/SKILL.md` describes — every
hunk of `git diff dev...HEAD` against `self-review-before-pr`, the rules, `AGENTS.md`, design
conformance and the issue's acceptance criteria. Not the `code-review:code-review` plugin (it
needs a PR and adds an attribution footer); the built-in `/code-review` is user-triggered.
Also check **no real data** in fixtures and docs (`priklad.cz`). One ranked report,
most-severe first.

### 🛑 Gate 1 — Apply fixes (auto-apply, gate only on risk)

- **Low-risk / mechanical** — conventions, trivial refactors, correctness fixes with one clear
  resolution: **apply them yourself**, no questions.
- **Risky / ambiguous** — several viable approaches, a behavioural change, a migration or
  public-contract impact: **stop and ask** which option to take.

List what you applied and what you hold. After all edits run `pnpm app:typecheck` and
`pnpm test`; both must pass.

### Phase B — Commit & open the PR

Drive the `commit-push-pr` skill (`commit-commands:commit-push-pr`) with the repo's rules:

- **Conventional Commits** for every commit, review fix-ups included (never "Address
  review…"). No AI-attribution / `Co-Authored-By` lines, none in the PR body either.
- Target **`dev`** — or, for a branch stacked on an unmerged feature branch, that branch.
- **The PR title is a Conventional Commit subject** (`feat(articles): …`). The repository
  squashes with `COMMIT_OR_PR_TITLE`: a multi-commit PR lands its **title** on `dev`.
- Title and body **in English**, from `.github/pull_request_template.md` (`release.md` and
  `hotfix.md` are for the other directions). Summary, changes, `Closes #<n>`; tick only the
  boxes that are true.
- **Assign the user** (`--assignee @me`). Never `@`-mention them or refer to them in the third
  person — comments post under their account.
- If lefthook rejects the push, read why; `--no-verify` is not the fix.

Once the PR exists, **retire the plan**: `rm ~/.claude/plans/plan-issue-<number>-*.md` and name
the file. No match means the branch was built without `/plan-issue` — move on silently.

### Phase C — Copilot review loop

Copilot is the automated reviewer here, and it **does not run by itself**.

1. Request it:
   `gh api repos/vednemesicnik/cz.vednemesicnik/pulls/<n>/requested_reviewers -X POST -f 'reviewers[]=copilot-pull-request-reviewer[bot]'`.
2. **Poll** at a cadence scaled to the change (a few files ≈ 180 s, more → longer), one
   monitor per event; don't report mid-round.
3. Address **every** comment. When one flags a pattern, grep the whole diff and fix **all**
   occurrences in one commit — Copilot flags only a subset. Fixes are normal append commits.
4. Reply to each thread (in the thread's language), resolve it via GraphQL
   `resolveReviewThread`, push, and **re-request** the review.
5. Repeat until Copilot has no new comments and **unresolved threads == 0** — verify the full
   thread set, not just this round's.

`/code-review <PR#>` and `/code-review ultra <PR#>` are user-triggered and billed: offer them
when the change warrants a second opinion, never launch them.

### Phase D — Ready to merge

1. **CI green** — `gh pr checks`. Red blocks; say what failed. `docker-build` has flaky GHA
   cache-export failures — rerun before investigating.
2. Report: PR URL, checks, unresolved threads (0), acceptance criteria status, anything left
   open. Name the **direction** (feature/fix → `dev`, or onto its parent when stacked) and
   whether anything in "Open PRs, with their bases" is stacked on this branch.
3. **If the issue has design questions in the index** (`questions/_index.json` entries whose
   `for` holds this issue), recommend `/ask-design tidy #<n>` — do not run it; deletion in the
   design project cannot be undone.

### 🛑 Gate 2 — Ask, then merge

Merging is the user's call, and it is **a question, not the end of the road**. Ask with
`AskUserQuestion`: merge now, hold, or hold for a stated reason. Ask even when everything is
green — green is not the same as wanted.

### Phase E — The merge

Only after a yes. If the answer was to hold, say what it waits on in a sentence the next
session can act on.

1. **Refuse** if the PR is a draft, not `OPEN`, or `mergeable` says it conflicts.
2. **Look for stacked children first.** If any open PR's base is this PR's head branch, **stop
   and ask**: merging with branch deletion would close it, and a closed PR whose base is gone
   cannot be reopened. Merge without `--delete-branch`, retarget the child
   (`gh pr edit <child> --base dev`), rebase it onto `dev`, and only then delete the parent
   branch — step by step, with the user.
3. **Merge by direction** (`docs/_branching-model.md`):

   | direction               | command                                 |
   | ----------------------- | --------------------------------------- |
   | feature / fix → `dev`   | `gh pr merge <n> --squash --delete-branch` |
   | hotfix → `main`         | `gh pr merge <n> --squash --delete-branch` |
   | release `dev → main`    | `gh pr merge <n> --merge` — never delete |
   | back-merge `main → dev` | `gh pr merge <n> --merge` — never delete |

   The back-merge's head **is `main`** — deleting it would delete production. Before a squash,
   make sure the PR title is a Conventional Commit (`gh pr edit <n> --title`); after the merge
   it is history.
4. **Land it**: confirm the merge and that `Closes #<n>` closed the issue (`dev` is the default
   branch, so it fires there; a PR into `main` closes nothing by itself). Then
   `git switch <base> && git pull --ff-only`, and remove the local head branch if it survived.
5. **Report** the PR as it landed, the method and why, any stacked child, the issue's state,
   and where the working tree stands.

End by naming **`/next-issue`** — aftermath, handoff, and a clean context window for the next
issue — as **one item on a short numbered list** of what is left, most important first, and
offer the top one as a question answerable in a word.
