---
name: next-issue
description: After the PR is merged — land the aftermath, bank what survives the issue, and hand off to a fresh context window with the open work first (design answers, the area's leftovers), a new issue only when nothing is open. Use once a PR is merged and the work moves on.
argument-hint: [next-issue-number]
allowed-tools: Bash(gh issue view:*), Bash(gh issue list:*), Bash(gh pr view:*), Bash(gh pr list:*), Bash(git rev-parse:*), Bash(git branch:*), Bash(git status:*), Bash(git log:*), Bash(git fetch:*), Bash(ls:*)
---

## Requested next issue number

`$ARGUMENTS`

## Current branch

!`git rev-parse --abbrev-ref HEAD`

## Working tree

!`git status --short`

## PR for this branch

!`gh pr view --json number,title,state,mergedAt,headRefName,baseRefName,url,body 2>/dev/null || echo "(no PR for this branch)"`

## Open PRs (a stacked child would be based on this branch)

!`gh pr list --state open --json number,title,headRefName,baseRefName,url`

## Local branches

!`git branch -vv`

## Recent commits on dev

!`git log --oneline origin/dev -8`

## Leftover plan files

!`ls -t ~/.claude/plans/plan-issue-*.md 2>/dev/null | head -10 || echo "(none)"`

## Open issues

!`gh issue list --limit 60`

## Task

You are the **turnover stage** of the issue pipeline:
`/discover-idea` → `/review-idea` → `/plan-issue` → `/implement-issue` → `/ship-issue` → **`/next-issue`**.

The working rule behind the pipeline is **one issue per context window.** A window that carried
an issue from plan to merge is full of detail that now lives in git, the PR and the issue. So:
finish the aftermath, write down only what outlives the issue, and hand over to a clean window.

### Phase 0 — Preflight

1. **Confirm the merge happened.** `MERGED` → continue. `OPEN` → stop; the close-out is
   `/ship-issue` and the merge is the user's. `CLOSED` unmerged → ask what happened. No PR for
   this branch (already on `dev`) → take the number from the squash subject or the argument
   and `gh pr view <n>`. Do not guess.
2. **Resolve the issue just shipped** — `Closes #<n>` in the PR body, else the branch name,
   else ask. `$ARGUMENTS` is the _next_ one.
3. **Read the subject the squash landed** on `dev`. If it is not a Conventional Commit, the PR
   title was a sentence — **say so plainly and do not rewrite it**; it is pushed history.

### Phase 1 — Land the aftermath

Report what each step did or why it was a no-op.

1. **Stacked children first.** An open PR based on the merged branch is retargeted
   (`gh pr edit <child> --base dev`) and rebased **before** the branch is deleted — deleting the
   base of an open PR closes it for good. With the user, step by step.
2. **Back to `dev`**: `git switch dev`, `git fetch origin --prune`, `git pull --ff-only`.
   Uncommitted changes after a merge → stop and show them.
3. **Delete the landed branch** locally with `git branch -d` (not `-D` without saying why).
   Several `[gone]` branches → `commit-commands:clean_gone`.
4. **Confirm the issue closed.** If not, close it with a comment naming the PR, and tick the
   acceptance-criteria checkboxes that the merge verified.
5. **Close the parent epic when its last child lands.** `gh issue view <n> --json parent`, then
   the epic's `subIssues`. While any is open, name it. When all are closed, **offer** to close
   the epic with a comment on what it covered — the decision is the user's.
6. **Retire the plan file** if `/ship-issue` did not: `rm ~/.claude/plans/plan-issue-<n>-*.md`,
   and name it. No match → move on silently.
7. **Name the leftovers** outside git: test rows in the local database, a deployed Apps Script
   version, a Fly secret, files in the Tigris bucket. Clean up only unambiguous test debris;
   ask before anything in production.
8. **Offer the design pairs this issue was waiting on.** `get_file questions/_index.json` in the
   design project (`docs/_design-project.md`) and list entries whose `for` or `names` holds the
   retired issue. Recommend `/ask-design tidy #<n>` by name; do not run it.

### Phase 2 — Bank what outlives the issue

Run the `remember:remember` skill. Not a summary of the work — git and the PR hold that — but:

- **what the next change should know** — a design answer, a token, a convention settled
  mid-issue. One that belongs in `docs/work-log/` and did not make it into the PR is
  offered as `/log-work`; memory keeps only a pointer to the entry;
- **anything still open** — a design question awaiting an answer, a branch left unmerged on
  purpose, a deploy not yet verified;
- **the leftovers** from 1.7 and the pairs from 1.8.

**In a git worktree** (`git rev-parse --git-dir` differs from `--git-common-dir`), the
handoff written to the worktree's `.remember/` is lost when the worktree is removed. Merge it
into the main checkout's `.remember/remember.md` (the directory above
`git rev-parse --path-format=absolute --git-common-dir`): read that file, keep what still
holds, fold in this session's note, write the result there, and delete the worktree copy.
The Write tool refuses paths outside the worktree, so write it from the shell — `.remember/`
is gitignored and never touches the main checkout's branch.

### 🛑 Gate — Follow-ups are offered, not filed

If the issue surfaced work worth doing later, **list it and ask**, one line each, with the
title you would give it — a capitalised sentence with the kind of work in the label, never
a Conventional Commit (`pull-request-workflow`). File only what the user picks. Work the user chooses not to file is
still open: it stays on the list in Phase 3.

### Phase 3 — The next step is the open work

Use `$ARGUMENTS` if given. Otherwise the next step comes from **what is still open**, in this
order, and a new issue is recommended only when the first three are empty:

1. **Open loops of what just shipped:** a design or copy answer that is back and unchecked
   (look at `questions/` in the design project, step 1.8), a question still out, a reply
   owed, a deviation the PR left for design.
2. **Leftovers of the same area:** the unbuilt screens of the drawings this issue worked from,
   and follow-ups the PR or this window named, filed or not. With no issue yet, the step is
   `/discover-idea` on that area, or a no-issue PR for something small.
3. **The next item in the focus area** the user set, or the next unfinished item of a list
   given earlier in the session.
4. **Only then a new issue** from the "Open issues" list (fetched with `--limit 60`, because
   the default 20 hides part of the backlog), with the reason in a sentence. Say that 1–3 are
   empty.

Starting something new while 1–3 are open leaves work half done. Say plainly when the open
work waits on someone else (a design answer still out, the `donate-page` branch), and what
can be done meanwhile. **The pick is the user's**; do not read a new issue's body into this
window.

### Phase 4 — Hand over to a clean window

`/clear` is the user's to type. End with a short report and the lines to paste for the first
open step: `/clear` and its command (`/ask-design check <code>`, `/discover-idea <area>`,
`/plan-issue <n>`, …).

The report: what landed (PR, issue, commit on `dev`), what Phase 1 cleaned up, what was banked,
and **what is still open as a short numbered list, in the Phase 3 order**. Keep it to a
screen — its job is to make `/clear` safe to press.
