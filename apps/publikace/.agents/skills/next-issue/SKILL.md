---
name: next-issue
description: After the PR is merged — land the aftermath, bank what survives the issue, and hand off to a fresh context window for the next one. Use once a PR is merged and the work moves on to the next issue.
argument-hint: [next-issue-number]
allowed-tools: Bash(gh issue view:*), Bash(gh issue list:*), Bash(gh pr view:*), Bash(gh pr list:*), Bash(git rev-parse:*), Bash(git branch:*), Bash(git status:*), Bash(git log:*), Bash(git fetch:*), Bash(ls:*), Bash(gh api repos/{owner}/{repo}/issues/*), Bash(gh api -X PATCH repos/{owner}/{repo}/issues/*)
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

!`ls -t ~/.claude/plans/plan-publikace-issue-*.md 2>/dev/null | head -10 || echo "(none)"`

## Open issues

!`gh issue list --limit 50`

## Task

You are the **turnover stage** of the issue pipeline:
`/discover-idea` → `/review-idea` → `/plan-issue` → `/implement-issue` → `/ship-issue` → **`/next-issue`**.

`/ship-issue` stops at the merge because merging is the user's call. This command starts
just after it. Its purpose is the working rule behind the whole pipeline: **one issue per
context window.** A window that carried an issue from plan to merge is full of detail that
is now recorded in git, the PR and the issue — carrying it into the next issue costs
context and buys nothing. So: finish the aftermath, write down only what outlives the
issue, and hand over to a clean window.

### Phase 0 — Preflight

1. **Confirm the merge actually happened.** Read the PR block above.
   - `state: MERGED` → continue.
   - `state: OPEN` → stop. The close-out belongs to `/ship-issue`, and the merge belongs to
     the user. Say which of the two is outstanding and hand back.
   - `state: CLOSED` (not merged) → stop and ask what happened; an abandoned branch is
     cleaned up differently from a merged one.
   - No PR for this branch → the user may already be on `dev` after merging. Take the issue
     number from the "Recent commits on dev" squash subject or from the argument, and find
     the PR with `gh pr view <n>`. Do not guess.
2. **Resolve the issue that was just shipped** — `Closes #<n>` in the PR body, else the
   branch name, else ask. This is the issue being _retired_; `$ARGUMENTS` is the _next_ one.
3. **Read the subject the squash actually landed** in the "Recent commits on dev" block. It
   should be a Conventional Commit; when it is not, the PR title was a sentence and the
   squash used it verbatim, as `PR_TITLE` always does
   ([docs/branching-model.md](../../../docs/branching-model.md)). **Say so plainly and do not
   rewrite it** — it is pushed history. This is the last gate that can see it, so a silent
   pass here is how twenty-two of them got onto `dev`.

### Phase 1 — Land the aftermath

Work through these; report what each one did or why it was a no-op.

1. **Stacked children first.** If any open PR in the list above is based on the merged
   branch, retarget it _before_ the branch is deleted — deleting the base of an open PR
   closes it, and a closed PR whose base is gone cannot be reopened. The exact order
   (`gh pr edit <child> --base dev`, then `git rebase --onto`, then the delete) is in
   [docs/branching-model.md](../../../docs/branching-model.md). Follow it as written.
2. **Back to `dev`.** `git checkout dev`,
   `git fetch origin --recurse-submodules=no --prune`, `git pull --ff-only`. Fetch that
   way every time — the `--prune` is what clears the `origin/*` refs whose branches were
   deleted on merge, and without it the local view of the remote keeps growing. If the
   working tree has uncommitted changes, stop and show them — a leftover edit after a merge
   is either a fix that was never committed or a stray, and both need a human look.
3. **Delete the landed branch** locally (`git branch -d`, which refuses if it holds
   unmerged work — do not reach for `-D` without saying why). If the list shows several
   `[gone]` branches, the `commit-commands:clean_gone` skill clears them and their
   worktrees in one pass.
4. **Confirm the issue closed.** A squash-merged `Closes #<n>` closes it automatically, but
   only if the line survived into the PR body. If it is still open, close it with a comment
   naming the PR. Closed, its status is _Done_
   (`gh api repos/{owner}/{repo}/issues/<n> --jq .status.name`); if it is not, set it with
   `gh api -X PATCH repos/{owner}/{repo}/issues/<n> -f status=Done --jq .status.name`.
5. **Close the parent epic when its last child lands.** If the retired issue has a parent
   (`gh issue view <n> --json parent`), read that parent's children
   (`gh issue view <epic> --json subIssues`). While any of them is still open, name it and
   move on. When they are all closed, **offer to close the epic** — with a comment saying
   what it covered — and leave the decision to the user, the way follow-ups are offered
   rather than filed. Nothing else in the pipeline looks at this: `/ship-issue` says
   _parent_ about a branch in a stack, not about an issue, so an epic whose last child has
   landed stays open until somebody notices. #173 is how this step got here.
6. **Retire the plan file** if `/ship-issue` did not: `rm ~/.claude/plans/plan-publikace-issue-<n>-*.md`.
   Only that number, and name the file you removed. No match means the issue was
   implemented without `/plan-issue` — not an error, move on without a word.
7. **Name the leftovers.** Anything this issue created outside git that a fresh window
   would not know about: test rows in the local database, files uploaded to Drive during a
   real-send check, a deployed script version. List them. Clean up only what is unambiguously
   test debris, and ask before anything on Drive or in production.
8. **Offer the design pairs this issue was waiting on.** Read `questions/_index.json` in
   the design project ([docs/design-project.md](../../../docs/design-project.md)) and list the
   entries whose `for` or `names` holds the retired issue. Those are the only pairs whose
   retirement this merge can have unblocked. When there are any, recommend
   `/ask-design tidy #<n>` by name, and do not run it: it deletes files from the design project,
   and whether nothing else still depends on a pair is that command's check, not this
   one's. When there are none, say so in a line — but only as "none in the index": a pair older
   than the index has no entry until a full `/ask-design tidy` writes one, so compare the index
   with the file listing and name the pairs it does not cover yet.

### Phase 2 — Bank what outlives the issue

Run the `remember:remember` skill so the next window opens with a handoff instead of a
blank slate. The handoff is not a summary of the work — git, the PR and the closed issue
already hold that, and repeating it is exactly the context this command exists to shed.
What belongs in it:

- **decisions that will bind the next change** — a design answer, a token that was added, a
  convention settled mid-issue;
- **anything still open** — a design question with no answer (its agent never finished:
  `/ask-design check <code>` spawns it again), a branch left unmerged on
  purpose, a deploy not yet verified;
- **the leftovers from Phase 1.7** that were not cleaned up, and any pair Phase 1.8 offered.

### 🛑 Gate — Follow-ups are offered, not filed

If the issue surfaced work worth doing later, **list it and ask** — one line each, with
what you would title it and its type (_Bug_, _Feature_ or _Task_). File only what the user
picks, with that type (`gh issue create --type …`); a new issue starts in _Backlog_. The backlog here grows faster than
it drains, and an agent filing issues on its own initiative is part of why.

### Phase 3 — Pick the next issue

Use `$ARGUMENTS` if it is non-empty. Otherwise read the "Open issues" list above — it is
fetched with `--limit 50` on purpose, because `gh issue list` defaults to 20 and this
backlog is longer than that; issues have gone unseen for a day that way.

Recommend one, in a sentence, with the reason — unblocked, adjacent to what just shipped,
or blocking something else. Say plainly if the honest recommendation is that the top
candidates are all blocked on a design answer. **The pick is the user's**; do not start
planning it here, and do not read the issue body into this window.

### Phase 4 — Hand over to a clean window

You cannot clear your own context — `/clear` is the user's to type. So end with a short
report and the two lines to paste:

```
/clear
/plan-issue <next>
```

The report, in this order: what landed (PR, issue, commit on `dev`), what Phase 1 cleaned
up, what was banked into the handoff, and then **what is still open, as a short numbered list,
most important first** — one or two lines per item saying what it is, why it waits, and the
command or act that starts it, with the recommended next issue as one of those items rather
than a line of its own. The order is the argument: this list is what the `/clear` is pressed
against, so an item buried under the pipeline's own next step is an item that does not survive.

Keep it to something that fits on a screen — its job is to make the `/clear` safe to press,
not to be read later. Three or four items is a list; ten is a backlog, and the backlog is
`gh issue list`.
