---
name: ship-issue
description: Close out the implementation on this branch — review + auto-fix, open the PR, run the Copilot review loop, get CI green, then ask and land it. Use when the implementation on a feature branch is finished and needs a review pass, a pull request, and merging.
argument-hint: [issue-number]
allowed-tools: Bash(gh issue view:*), Bash(gh issue list:*), Bash(gh pr view:*), Bash(gh pr list:*), Bash(gh pr checks:*), Bash(git rev-parse:*), Bash(git branch:*), Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(gh api repos/{owner}/{repo}/issues/*), Bash(gh api -X PATCH repos/{owner}/{repo}/issues/*)
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

!`gh issue list --limit 20 --json number,title,labels --template '{{range .}}{{.number}}  [{{range .labels}}{{.name}} {{end}}]  {{.title}}{{"\n"}}{{end}}'`

## Task

You are the **close-out stage** of the issue pipeline:
`/discover-idea` → `/review-idea` → `/plan-issue` → `/implement-issue` → **`/ship-issue`** → `/next-issue`.

Review → auto-fix → PR → Copilot loop → green CI → ask → merge. The review is
`review-implementation`'s, and the branch and merge rules are
[docs/\_branching-model.md](../../../docs/_branching-model.md) — where this skill and that
document disagree, the document wins. **Two human gates** exist — respect them.

### Phase 0 — Preflight

1. **Resolve the issue**: the argument, else the branch name (`feat/247-…` → `247`), else
   `Closes #<n>` in the existing PR body, else show the "Open issues" list and ask. Do not
   guess. Fetch it with `gh issue view <number> --comments`.
2. **Decide the app** by the files in "Diff vs dev" (`apps/web/**`, `apps/publikace/**`, or
   the repository's own outside `apps/`) and read that app's `AGENTS.md` § For the workflow
   skills; a diff across several reads each.
3. **Guard the branch.** On `dev` or `main`, stop. Note uncommitted changes; Phase B commits
   them. A PR an earlier session opened is picked up where it stands: carry on from the
   phase it has reached.

### Phase A — Review the implementation (pre-PR)

Run the review exactly as [review-implementation](../review-implementation/SKILL.md)
describes: the design extracted here in the main session, then the diff read by the
`implementation-reviewer` agent in a fresh context, given the issue number, the base (`dev`,
or the parent branch when stacked), the app, the design file and whether the change is gated.
Not the
`code-review:code-review` plugin (it needs a PR and adds an attribution footer); the built-in
`/code-review` is user-triggered. Check each finding against the code before acting on it.
One ranked report, most-severe first.

### Gate 1 — Apply fixes (auto-apply, decide the risky ones)

- **Low-risk / mechanical** — conventions, trivial refactors, a document that only has to
  follow what the issue settled, correctness fixes with one clear resolution: **apply them
  yourself**, no questions.
- **Risky / ambiguous** — several viable approaches, a behavioural change, a migration or
  public-contract impact: **decide** per
  [decide-and-inform](../../rules/decide-and-inform/RULE.md) (a second opinion first), apply
  it, and say what you chose and what you turned down.
- **Always asked**, never decided: an authentication, two-factor or session mechanism, and
  anything that would edit an applied migration.

List what you applied, what you decided and what waits on the user. After all edits run the
app's **Gates**; every one must pass.

### Phase B — Commit & open the PR

Drive the `commit-push-pr` skill (`commit-commands:commit-push-pr`) with the repository's rules:

- **Conventional Commits** for every commit, review fix-ups included (never "Address
  review…"), with the app's **Commit scopes**. No AI-attribution / `Co-Authored-By` lines,
  none in the PR body either.
- Target **`dev`** — or, for a branch stacked on an unmerged feature branch, that branch
  ([docs/\_branching-model.md](../../../docs/_branching-model.md) § Stacked PRs).
- **The PR title is a Conventional Commit subject** (`feat(articles): …`). The repository
  squashes with `COMMIT_OR_PR_TITLE`: a single-commit PR lands its commit subject on `dev`, a
  multi-commit PR its **title**, so both are written as one; the `pr-title` CI job checks the
  title.
- Title and body **in English**, from `.github/pull_request_template.md` (`release.md` and
  `hotfix.md` are for the other directions). Summary, changes, `Closes #<n>`; tick only the
  boxes that are true and delete the ones for an app the diff does not touch.
- **Assign the user** (`--assignee @me`). Never `@`-mention them or refer to them in the third
  person — comments post under their account.
- If lefthook rejects the push, read why — the app's **Traps** name the failures that have
  nothing to do with the diff. `--no-verify` is not the fix.

Once the PR exists:

- **Check the issue is _In review_**: `gh api repos/{owner}/{repo}/issues/<number> --jq .status.name`.
  GitHub moves it there itself when a PR into `dev` says `Closes #<n>`, but not for a PR
  stacked on another branch, where the keyword closes nothing. Then set it with
  `gh api -X PATCH repos/{owner}/{repo}/issues/<number> -f status='In review' --jq .status.name`,
  unless it is already there.
- **Retire the plan**: `rm ~/.claude/plans/plan-issue-<number>-*.md` and name the file. No
  match means the branch was built without `/plan-issue` — move on silently.

### Phase C — Copilot review loop

Copilot is the automated reviewer, for both apps, and it **does not run by itself**.

1. **Request it**:
   `gh api repos/{owner}/{repo}/pulls/<n>/requested_reviewers -X POST -f 'reviewers[]=copilot-pull-request-reviewer[bot]'`.
   Confirm it registered in `gh api repos/{owner}/{repo}/issues/<n>/timeline` — a
   `review_requested` event for `Copilot` — rather than re-posting: the reviewer list can be
   empty while it is already reviewing.
2. **When it does not register** (no event after one retry, a quota error, a re-request that
   never shows up), do not wait on it: the `implementation-reviewer` pass from Phase A stands
   in — run it again on any fix commits — then go to green CI and Gate 2, and say Copilot did
   not run.
3. **Poll**, capped, at a cadence scaled to the change (a few files ≈ 180 s, more → longer),
   one monitor per event; don't report mid-round.
4. **Address every comment.** When one flags a pattern, grep the whole diff and fix **all**
   occurrences in one commit — Copilot flags only a subset. Fixes are normal append commits
   with Conventional subjects.
5. **Reply** to each thread in the thread's language, naming the fixing commit; **resolve** it
   with GraphQL `resolveReviewThread`; push; and **re-request** the review (step 1).
6. **Repeat** until a round brings no new comments and **unresolved threads == 0** — counted
   over the full thread set (`reviewThreads(first: 100)` with `pageInfo.hasNextPage` checked),
   not just this round's. A thread you push back on is replied to and left unresolved for the
   user.

`/code-review <PR#>` and `/code-review ultra <PR#>` are user-triggered and billed: offer them
when the change warrants a second opinion, never launch them.

### Phase D — Ready to merge

1. **CI green** — `gh pr checks`. The `branch-protection` ruleset requires the checks, so red
   blocks: say what failed. A failed `image` job is first rerun (its cache export is flaky)
   before investigating. **"No checks reported"** is normal for a stacked PR, whose base is a
   feature branch — the workflows run only on PRs into `dev` and `main`, so there the gates
   run locally and the PR says so; on a PR into `dev` or `main` the same silence is an alarm:
   look before going further.
2. **Report**: PR URL, checks, unresolved threads (0) or why Copilot did not run, acceptance
   criteria status, anything left open. Name the **direction** (feature/fix → `dev`, or onto
   its parent when stacked) and whether anything in "Open PRs, with their bases" is stacked on
   this branch.
3. **If the issue has design questions in the index** — `questions/_index.json` entries in the
   app's design project whose `for` holds this issue — recommend `/ask-design tidy #<n>`. Do
   not run it; it deletes files from the design project.

### 🛑 Gate 2 — Ask, then merge

Merging is the user's call, and it is **a question, not the end of the road**. Ask with
`AskUserQuestion`: merge now, hold, or hold for a stated reason. A sentence in a hand-back is
not a gate; the question is, and it is the only brake between here and a landed PR —
`gh pr merge` falls under the `Bash(gh pr *)` allow rule and raises no permission prompt of its
own. Ask even when everything is green: **green is not the same as wanted**, and a PR can be
green and deliberately unmerged, waiting on a design answer.

### Phase E — The merge

Only after a yes. If the answer was to hold, say what it waits on in a sentence the next
session can act on without re-reading this one.

1. **Refuse** if the PR is a draft, not `OPEN`, or `mergeable` says it conflicts. Say which,
   and stop.
2. **Retarget children before landing anything.** In "Open PRs, with their bases", re-read
   live with `gh pr list` at this moment, find every PR whose base is this PR's head branch.
   Deleting a branch that is the base of an open PR closes that PR, a closed PR whose base is
   gone cannot be reopened, and this repository deletes head branches on merge by itself. So
   follow [docs/\_branching-model.md](../../../docs/_branching-model.md) § Stacked PRs exactly,
   with the user: note the parent's tip, retarget each child to `dev`, merge the parent, then
   `git rebase --onto origin/dev <parent-tip> <child>` and push the child with
   `--force-with-lease` — the one force-push of the flow, asked for first. Read the recipe out
   of the document rather than from memory: `<parent-tip>` is load-bearing, and getting it
   wrong replays commits that are already on `dev`.
3. **Merge by direction** (`docs/_branching-model.md` § Merge methods):

   | direction                  | command                                                  |
   | -------------------------- | -------------------------------------------------------- |
   | feature / fix → `dev`      | `gh pr merge <n> --squash --delete-branch`               |
   | hotfix → `main`            | `gh pr merge <n> --squash --delete-branch`               |
   | release `dev → main`       | `gh pr merge <n> --merge` — never delete (`/release-pr`) |
   | back-merge `main → dev`    | `gh pr merge <n> --merge` — never delete (`/release-pr`) |
   | an import with its history | `gh pr merge <n> --merge --delete-branch`                |

   The back-merge's head **is `main`** — deleting it would delete production. **One exception,
   a judgement call rather than a loophole:** a long-lived branch whose individual commits are
   each worth keeping may land with a merge commit instead of a squash. Name it and let the
   user decide; never take it silently, and never to dodge the squash for a three-commit fix.

   Before a squash, make sure the subject that will land — the PR title, or the single
   commit's subject — is a Conventional Commit (`gh pr edit <n> --title`); after the merge it
   is history.
4. **Land it**: confirm the merge and that `Closes #<n>` closed the issue (`dev` is the default
   branch, so it fires there; a PR into `main` closes nothing by itself). Then
   `git switch <base> && git pull --ff-only`, and remove the local head branch if it survived.
5. **Report** the PR as it landed, the method and why, any stacked child and where it stands,
   the issue's state, and where the working tree stands.

End by naming **`/next-issue`** — aftermath, handoff, and a clean context window for the next
issue — as **one item on a short numbered list** of what is left, most important first: a
finding parked in the PR body, a stacked child still to retarget, a design answer the merge
has just unblocked. One or two lines each, and offer the top one as a question answerable in a
word.
