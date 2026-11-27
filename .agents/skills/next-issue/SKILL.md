---
name: next-issue
description: After the PR is merged — land the aftermath, bank what survives the issue, and hand off to a fresh context window with the open work first (design answers, the area's leftovers), a new issue only when nothing is open. Use once a PR is merged and the work moves on.
argument-hint: [next-issue-number]
allowed-tools: Bash(gh issue view:*), Bash(gh issue list:*), Bash(gh pr view:*), Bash(gh pr list:*), Bash(git rev-parse:*), Bash(git branch:*), Bash(git status:*), Bash(git log:*), Bash(git show:*), Bash(git fetch:*), Bash(ls:*), Bash(gh api repos/{owner}/{repo}/issues/*), Bash(gh api -X PATCH repos/{owner}/{repo}/issues/*), Bash(gh project item-list:*), Bash(gh project field-list:*), Bash(gh project view:*)
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

!`gh issue list --limit 60 --json number,title,labels --template '{{range .}}{{.number}}  [{{range .labels}}{{.name}} {{end}}]  {{.title}}{{"\n"}}{{end}}'`

## Task

You are the **turnover stage** of the issue pipeline:
`/discover-idea` → `/review-idea` → `/plan-issue` → `/implement-issue` → `/ship-issue` → **`/next-issue`**.

The working rule behind the pipeline is **one issue per context window.** A window that carried
an issue from plan to merge is full of detail that now lives in git, the PR and the issue. So:
finish the aftermath, write down only what outlives the issue, and hand over to a clean window.

### Phase 0 — Preflight

1. **Confirm the merge happened.** `MERGED` → continue. `OPEN` → stop; the close-out is
   `/ship-issue` and the merge is the user's. `CLOSED` unmerged → ask what happened; an
   abandoned branch is cleaned up differently. No PR for this branch (already on `dev`) → take
   the number from the squash subject or the argument and `gh pr view <n>`. Do not guess.
2. **Resolve the issue just shipped** — `Closes #<n>` in the PR body, else the branch name,
   else ask. `$ARGUMENTS` is the _next_ one. **Decide its app** by the files the PR touched
   and read that app's `AGENTS.md` § For the workflow skills.
3. **Read the subject the squash landed** on `dev`. If it is not a Conventional Commit, the PR
   title (or the single commit) was a sentence — **say so plainly and do not rewrite it**; it
   is pushed history.

### Phase 1 — Land the aftermath

Report what each step did or why it was a no-op.

1. **Stacked children first.** An open PR based on the merged branch is retargeted and rebased
   as [docs/\_branching-model.md](../../../docs/_branching-model.md) § Stacked PRs says —
   deleting the base of an open PR closes it for good. With the user, step by step.
2. **Back to `dev`**: `git switch dev`, `git fetch origin --prune`, `git pull --ff-only`.
   Uncommitted changes after a merge → stop and show them: a fix never committed or a stray,
   and both need a human look.
3. **Delete the landed branch** locally with `git branch -d` (not `-D` without saying why).
   Several `[gone]` branches → `commit-commands:clean_gone`.
4. **Confirm the issue closed.** If not, close it with a comment naming the PR. Tick the
   acceptance-criteria checkboxes the merge verified. Closed, its status is _Done_
   (`gh api repos/{owner}/{repo}/issues/<n> --jq .status.name`); if it is not, set it with
   `gh api -X PATCH repos/{owner}/{repo}/issues/<n> -f status=Done --jq .status.name`.
5. **Close the parent epic when its last child lands.** `gh issue view <n> --json parent`, then
   the epic's `subIssues`. While any is open, name it. When all are closed, **offer** to close
   the epic with a comment on what it covered — the decision is the user's.
6. **Retire the plan file** if `/ship-issue` did not: `rm ~/.claude/plans/plan-issue-<n>-*.md`,
   and name it. No match → move on silently.
7. **Name the leftovers** this issue created outside git, which a fresh window would not know
   about: test rows in a local database, files on Drive or in the Tigris bucket, a Fly secret,
   a deployed Apps Script version. Clean up only unambiguous test debris; **ask before
   anything in production**.
8. **Offer the design pairs this issue was waiting on.** Read `questions/_index.json` in the
   app's design project (its **Design project**) and list entries whose `for` or `names` holds
   the retired issue. Recommend `/ask-design tidy #<n>` by name; do not run it — it deletes
   files from the design project. When there are none, say "none in the index" — a pair older
   than the index has no entry until a full `/ask-design tidy` writes one, so compare the index
   with the file listing and name the pairs it does not cover yet.
9. **Check the written design survived the merge.** Read the squash's diff
   (`git show --stat <sha>`) against the app's **Written design**. A change to behaviour they
   describe that left them untouched, or a review finding the issue resolved without its
   _Resolution_ saying so, is a follow-up for the gate below — a `docs:` PR, or `/review-idea`
   when it is not clear whether the document or the code is the one that is wrong. `dev` is
   never edited directly. Say so in a line when they held.

### Phase 2 — Bank what outlives the issue

Run the `remember:remember` skill. Not a summary of the work — git and the PR hold that — but:

- **what the next change should know** — a design answer, a token, a convention settled
  mid-issue. One that belongs in `docs/work-log/` and did not make it into the PR is
  offered as `/log-work`; memory keeps only a pointer to the entry;
- **anything still open** — a design question awaiting an answer (its agent never finished:
  `/ask-design check <code>` spawns it again), a branch left unmerged on purpose, a deploy not
  yet verified;
- **the leftovers** from 1.7 and the pairs from 1.8.

**In a git worktree** (`git rev-parse --git-dir` differs from `--git-common-dir`), the
handoff written to the worktree's `.remember/` is lost when the worktree is removed. Merge it
into the main checkout's `.remember/remember.md` (the directory above
`git rev-parse --path-format=absolute --git-common-dir`): read that file, keep what still
holds, fold in this session's note, write the result there, and delete the worktree copy.
The Write tool refuses paths outside the worktree, so write it from the shell — `.remember/`
is gitignored and never touches the main checkout's branch.

### Gate — Follow-ups are weighed, then filed or folded

If the issue surfaced work worth doing later, **decide each item yourself** on the three
questions of [docs/\_workflow-skills.md](../../../docs/_workflow-skills.md) § Filing an issue:
an open issue that carries it gets a comment; a change too small for a plan waits for the next
change to that file; only what is left becomes a new issue — opened with its type and
its app's label in the same command (`gh issue create --type Bug|Feature|Task --label web|publikace`;
both labels for the host or the repository), titled as a plain sentence, never a Conventional
Commit, and weighed by the app's **Issue weighing** — when it names a project, the new issue is
added to it with the priority you decide, and to the milestone that priority puts it in when
the weighing names one (§ Ordering by a project). Do not ask the user which to file: you
hold the context. Ask only when an item turns on something only they know, with your
recommendation first. Report one line per item: filed as #n, added to #n, or left out and why.

The backlog grows faster than it drains when every finding becomes an issue, so the default
for a small one is the open issue beside it, not a new number.

### Phase 3 — The next step is the open work

Use `$ARGUMENTS` if given. Otherwise the next step comes from **what is still open**, in this
order, and a new issue is recommended only when the first three are empty:

1. **Open loops of what just shipped:** a design or copy answer that is back and unchecked
   (look at `questions/` in the design project, step 1.8), a copy question still out, a design
   question with no answer (`/ask-design check <code>`), a reply owed, a deviation the PR left
   for design.
2. **Leftovers of the same area:** the unbuilt screens of the drawings this issue worked from,
   and follow-ups the PR or this window named, filed or not. With no issue yet, the step is
   `/discover-idea` on that area, or a no-issue PR for something small.
3. **The next item in the focus area** the user set, or the next unfinished item of a list
   given earlier in the session.
4. **Only then a new issue** of the app being worked in — its label in the "Open issues" list,
   or `gh issue list --label <app> --limit 60` (the default 20 hides part of the backlog) — weighed by the app's **Issue weighing**:
   when it names a project, in the project's order (priority, then age, blockers still holding),
   read with `gh project item-list <n> --owner vednemesicnik --format json`, with the
   reason in a sentence — unblocked, adjacent to what just shipped, or blocking something else.
   When it names a milestone, say how many of its issues are open and closed
   (`gh issue list --milestone "<title>" --state all --limit 200 --json state`), and fix an open
   issue whose priority and milestone disagree.
   Check each candidate's blocker rather than assuming it: a hand step, a decision that is the
   user's, a merged PR waiting on a manual check. Say that 1–3 are empty.

Starting something new while 1–3 are open leaves work half done. Say plainly when the open
work waits on someone else (the copywriter's answer still out, a branch held on purpose), and
what can be done meanwhile. **The pick is the user's**; do not read a new issue's body into
this window.

### Phase 4 — Hand over to a clean window

`/clear` is the user's to type. End with a short report and the lines to paste for the first
open step: `/clear` and its command (`/ask-design check <code>`, `/discover-idea <area>`,
`/plan-issue <n>`, …).

The report: what landed (PR, issue, commit on `dev`), what Phase 1 cleaned up, what was banked,
what the follow-up gate filed or folded, and **what is still open as a short numbered list, in
the Phase 3 order**. Keep it to a screen — its job is to make `/clear` safe to press. Three or
four items is a list; ten is a backlog, and the backlog is `gh issue list`.
