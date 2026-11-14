---
name: ship-issue
description: Close out the implementation on this branch — review + auto-fix, open the PR, get CI green, then ask and land it. Use when the implementation on a feature branch is finished and needs a review pass, a pull request, and merging.
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

Run it for the implementation on this branch: review → auto-fix → PR → green CI →
ready-to-merge. Reuse the existing pieces rather than re-implementing them: PR creation
is the `commit-push-pr` skill (`commit-commands:commit-push-pr`), and the branch and
merge rules are [docs/branching-model.md](../../docs/branching-model.md).

Follow the phases below in order. **Two human gates** exist — respect them.

### Phase 0 — Preflight

1. **Resolve the issue** in this order: use "Requested issue number" if non-empty; else
   derive it from the "Current branch" name (`feat/30-…` → `30`); else read `Closes #<n>`
   from the existing PR body shown above; else show the "Open issues" list and ask which
   one (`/ship-issue <number>`). Do not guess. Fetch it with
   `gh issue view <number> --comments`.
2. **Guard the branch.** If "Current branch" is `dev` or `main`, stop — this pipeline runs
   on a feature branch only. If the working tree has uncommitted changes, note them;
   they'll be committed in Phase B.

### Phase A — Review the implementation (pre-PR, inline)

No PR exists yet at this point, so neither packaged review engine fits:

- `code-review:code-review` (plugin skill) fetches an _existing_ PR with `gh pr view` and
  posts its verdict as a PR comment carrying an AI-attribution footer. Wrong stage, and
  the footer breaks the no-AI-attribution rule — do **not** invoke it here.
- `/code-review` (built-in, reviews the working diff) is **user-triggered** — a command
  cannot launch it. If you want its findings first, say so and let the user run
  `/code-review` before you continue; otherwise proceed with the inline review below.

Read every hunk of `git diff dev...HEAD` yourself and check it against:

- **`AGENTS.md`** — where a change belongs (what Google Drive owns and what the app's cache
  only mirrors; domain rules apart from the UI; shared UI in `app/ui/`), house style (`let` in
  function bodies, Czech for the user and English for the code, English URL paths, comments
  that say why), and the things that bite — `Temporal` dates, `*.test.tsx` actually reached by
  `pnpm test`.
- **The PR checklist in `.github/pull_request_template.md`** — it is this repo's
  self-review list, and every box on it is something the gates cannot check.
- **Migrations** — a new one is fine, an edited applied one is never
  ([docs/migrations.md](../../docs/migrations.md)); plain `CREATE TABLE` / `ALTER TABLE`,
  not the `IF NOT EXISTS` idiom of the initial schema.
- **No real data** — authors, providers, e-mail addresses, Drive IDs and links all
  fictional, `priklad.cz`.
- **Design conformance** where the issue cites a design document: check the diff against
  the document itself in the design canvas, not against the issue's summary of it —
  the screen the diff touches, read by its id as
  [docs/design-project.md](../../../docs/design-project.md) describes.
- **The issue-conformance layer** — acceptance criteria met / partial / unmet, scope
  creep, tests or docs the issue explicitly asked for.

On a large diff you may fan the read out to parallel `pr-review-toolkit:code-reviewer`
subagents, one per area, and merge their findings. Produce one ranked report,
most-severe first, each finding as `file:line` · severity · one-line problem · proposed
fix.

### 🛑 Gate 1 — Apply fixes (auto-apply, gate only on risk)

Split the findings into two buckets:

- **Low-risk / mechanical** — house-style and convention fixes (`let` vs `const`, English
  identifiers, Czech UI copy, comment density, file placement), trivial refactors,
  obvious correctness fixes with a single clear resolution. **Apply these yourself** with
  the Edit tool, no questions.
- **Risky / ambiguous** — anything with multiple viable approaches, a behavioural change,
  a schema or public-contract impact, or where the right fix is unclear. **Stop and ask**
  which option to take before touching these.

List what you auto-applied and what you're holding for approval, then apply the approved
risky fixes. After all edits run `pnpm typecheck`, `pnpm test`, `pnpm lint` and
`pnpm format`, and confirm they pass before continuing. If one fails, fix and re-run.
`format` is not optional here — `oxfmt` formats Markdown too and the pre-push hook's
`format:check` will otherwise reject the push for a doc, not for the code.

### Phase B — Commit & open the PR

Drive the `commit-push-pr` skill. Enforce the repo's conventions:

- **Conventional Commits** for every commit (including review-fixups — never "Address
  review…"). No AI-attribution / `Co-Authored-By` lines.
- Branch **targets `dev`** — unless this branch was stacked on another unmerged feature
  branch, in which case the PR targets that branch and gets retargeted to `dev` when the
  parent merges.
- **The PR title is a Conventional Commit subject, not a sentence.** The repository squashes
  with `PR_TITLE`, so this line — not the branch's commits, however well they are written —
  is what lands in `dev`'s history. Write it as `feat(issues): …` from the start; the
  `pr-title` CI job checks it, and
  [docs/branching-model.md](../../docs/branching-model.md) says why it is worth a rule.
- PR **title and body in English**, using `.github/pull_request_template.md` (the default
  template; `release.md` and `hotfix.md` are for the other two directions). Body: a summary
  and how it satisfies the issue's acceptance criteria; link the issue (`Closes #<n>`).
  Tick only the boxes that are actually true and delete what does not apply.
- **Assign the user** as assignee. Don't reference them in third person or `@`-mention
  them — comments post under their account.
- If the push is rejected by lefthook, read the failure before re-running: Node 24 and an
  unformatted `.claude/settings.local.json` both fail it for reasons unrelated to the
  diff. `--no-verify` is not the fix.

Once the PR exists and you have its URL, retire the plan:
`rm ~/.claude/plans/plan-publikace-issue-<number>-*.md`. What it was holding now lives in the
commits, the PR body and the issue, and `/implement-issue` offers that directory
newest-first — a shipped plan left behind is one more stale candidate in that list. Delete
only the file for this issue number, only after the PR is open, and name the file you
removed. If the glob matches nothing, the branch was implemented without `/plan-issue`;
that is not an error, so move on without a word.

### Phase C — Checks

1. **CI** — `.github/workflows/ci.yml` runs format, lint, typecheck and the suite on the
   PR, on Node 26 from `.nvmrc`. Confirm it is green with `gh pr checks`. On this plan the
   checks **cannot be made required**, so a red one is advisory — which means nobody but
   you is going to stop the merge. Treat red as blocking anyway, and say what failed.

   **"No checks reported" is not a failure on a PR aimed at a feature branch.** CI triggers
   on `pull_request` filtered by base, so a stacked child never fires it, and there the push
   hook was the gate. On a PR into `dev` or `main` the same silence means something is
   wrong — look before going further.

2. **A second opinion, if the change warrants one** — `/code-review <PR#>` and
   `/code-review ultra <PR#>` are **user-triggered and billed**. Offer them; never launch
   them yourself. There is no automated reviewer configured on this repository, so the
   inline review in Phase A plus CI is the whole of the verification.

### Phase D — Ready to merge

1. Report a concise **ready-to-merge** summary: PR URL, checks status, acceptance criteria
   status, anything left open.
2. Name the **direction** the branch merges in — feature/fix → `dev`, or onto its parent when
   it is stacked — and say whether anything in "Open PRs, with their bases" is stacked on it.
   The flags come in Phase E, worked out against that list rather than stated from habit.
3. **If the issue cites a design question, say so and recommend `/ask-design tidy #<n>`** — do not
   run it. Check the issue body for a `questions/*.md` path; if there is one, the pair may have
   just become retirable. Recommend it rather than acting: the design project is shared, has no
   git, and deletion there is not undoable — and the pair only retires once _no_ open issue
   cites it, which is a check that belongs in that command, not this one.

### 🛑 Gate 2 — Ask, then merge

Merging is still the user's call — but it is the answer to a question, not the end of the
road. **Ask with `AskUserQuestion`**, offering to merge now, to hold, or to hold for a stated
reason. A sentence in a hand-back is not a gate; it is prose the user has to interrupt. The
question is, and it is the only stop between here and a landed PR: `gh pr merge` is inside the
`Bash(gh pr *)` allow rule on this machine and will not prompt on its own.

Ask even when everything is green. **Green is not the same as wanted** — `#130` is green and
deliberately unmerged, waiting on a design answer — and the acceptance criteria you just
reported are exactly what the user is weighing.

### Phase E — The merge

Only once the question above has been answered yes. If the answer was to hold, stop here and
say what it is waiting on, in a sentence the next session can act on without re-reading this
one.

The rules are [docs/branching-model.md](../../docs/branching-model.md). Do not re-derive them;
what follows is that document, and where the two disagree the document wins.

1. **Refuse the merge** if the PR is a draft, if `state` is not `OPEN`, or if `mergeable`
   says the branch conflicts. Say which, and stop.

2. **Look for children before anything else.** In "Open PRs, with their bases", find every PR
   whose **base** is this PR's `headRefName`. Those are stacked on it, and they are the reason
   this phase cannot be a remembered command.

   If there are none, go on. If there are any, follow the document exactly — merge the parent
   **without** `--delete-branch`, retarget each child while the old base still exists, rebase
   it `--onto` the new base, and only then delete the parent branch. **Deleting a branch that
   is the base of an open PR closes that PR**, and a closed PR whose base is gone cannot be
   reopened; the work comes back only as a new number. Read the recipe out of the document
   rather than from memory — `<parent-tip>` is load-bearing, and getting it wrong replays
   commits that are already on `dev`.

3. **Merge by direction, not by habit.** The base decides the method, and the two lower rows
   are not oversights:

   | direction               | method     | branch                  |
   | ----------------------- | ---------- | ----------------------- |
   | feature / fix → `dev`   | `--squash` | `--delete-branch`       |
   | hotfix → `main`         | `--squash` | `--delete-branch`       |
   | release `dev → main`    | `--merge`  | **keep** — it is `dev`  |
   | back-merge `main → dev` | `--merge`  | **keep** — it is `main` |

   ```sh
   gh pr merge <n> --squash --delete-branch    # feature/fix, and hotfix
   gh pr merge <n> --merge                     # release and back-merge: never --delete-branch
   ```

   **One exception, and it is a judgement call rather than a loophole.** A long-lived branch
   whose individual commits are each worth keeping is merged with a merge commit instead — the
   document's example ran to 94 written messages, and squashing that would trade a month of
   history for one line. **Name it and let the user decide**; never take it silently, and never
   use it to dodge the squash rule for a three-commit fix.

   A squash puts the **PR title** on `dev`, not the branch's commits. If that title is not a
   Conventional Commit subject, fix it with `gh pr edit <n> --title` before merging — after the
   merge it is history.

4. **Land it.** Confirm the merge happened and, if the PR body carried `Closes #<n>`, that the
   issue actually closed. `dev` is this repository's **default** branch, which is what makes the
   keyword fire on an ordinary feature merge; a PR into `main` closes nothing by itself, so
   after a release or a hotfix the issue is still open and closing it is a separate act. Then
   return to the branch the PR targeted and pull: `git switch <base> && git pull --ff-only`. If
   the local head branch survived the remote delete, remove it.

5. **Report** the PR number and title as it landed, the method used and why, what happened to
   any stacked child, the issue's state, and where the working tree now stands.

Either way, end by naming what comes after the merge: **`/next-issue`**, which lands the
aftermath (stacked children, branch cleanup, the plan file, leftovers outside git), banks
what outlives the issue into a handoff, and hands over to a clean context window for the
next one. This window has carried the issue from plan to merge and is full of detail that
now lives in git, the PR and the issue — one issue per context window is the point.

And name it as **one item on a short list, not the whole of what is left.** Review and CI turn
up work the PR deliberately did not carry — a finding parked in its body, a stacked child still
to retarget, a design answer the merge has just unblocked. So end with a numbered list, **most
important first**, where the order is the argument: one or two lines per item saying what it is,
why it waits, and the command or act that starts it. Then offer the top one as a question the
user can answer in a word. Three or four items is a list; ten is a backlog, and the backlog is
`gh issue list`.
