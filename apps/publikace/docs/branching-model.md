# Branching model

The same shape [`cz.vednemesicnik`](https://github.com/vednemesicnik/cz.vednemesicnik) uses,
and the same one every `SCRIPT__*` repository follows: a persistent `dev` integration branch
that decouples **merging a change** from **releasing one**.

- `dev` is the **default branch** — feature and fix PRs target it.
- `main` is the **production branch**.

## Flow

```
feature/fix ──► dev ──(release)──► main
                 ▲                   │
                 └──(back-merge)─────┘

hotfix ──────────────────────────► main
                                     │
                 dev ◄──(back-merge)─┘
```

- **Feature / fix:** branch off `dev`, PR into `dev`.
- **Release:** PR `dev → main`.
- **Hotfix:** branch off `main`, PR into `main`, then back-merge into `dev`.

## Merge methods

| PR                      | Method                                                           | Head branch         |
| ----------------------- | ---------------------------------------------------------------- | ------------------- |
| feature/fix → `dev`     | squash                                                           | **delete**          |
| release `dev → main`    | **merge commit** — squash would permanently diverge the branches | keep — it is `dev`  |
| hotfix → `main`         | squash                                                           | **delete**          |
| back-merge `main → dev` | **merge commit**                                                 | keep — it is `main` |

```sh
gh pr merge <n> --squash --delete-branch   # feature/fix, and hotfix
gh pr merge <n> --merge                    # release and back-merge: never --delete-branch
```

Dropping `--delete-branch` on the two right-hand rows is not an oversight: their heads are
`dev` and `main` themselves.

### The PR title is the commit subject

On a squash it is the title of the pull request, not the branch's own commits, that ends up
on `dev` — so **a PR title is written as a Conventional Commit**, the same as any commit
here: `feat(issues): the detail lists its artwork groups`. Not a sentence.

The repository's squash title is `PR_TITLE`, so this holds without exception and without
depending on how many commits the branch happens to carry. A well-written commit on the
branch does not rescue a title that reads like prose.

The reason it is worth a heading is that nothing about the merge screen says it, and the
result is only visible afterwards, in `git log`, where it can no longer be fixed. Twenty-two
subjects on `dev` are not Conventional Commits, and each of them looked fine at the time.

Two things now catch it before the merge instead of after: the `pr-title` job in
[ci.yml](../.github/workflows/ci.yml), and `/next-issue`, which reads the subject the squash
actually landed.

**One exception to the squash rule, and it is a judgement call rather than a loophole.** A
long-lived branch whose individual commits are worth keeping — the broadsheet design theme
was 94 of them, each with a written message — is merged with a _merge commit_ instead.
Squashing it would trade the whole history for one line. The rule exists so that a
three-commit fix does not litter `dev`; it is not a reason to discard a month of messages.

## Stacked PRs

One issue too large for a single reviewable diff becomes an ordered chain: each PR targets
the branch below it, so every diff shows only its own work. `#56` ran as three.

**A stacked PR has no CI.** `.github/workflows/ci.yml` triggers on `pull_request` with
`branches: [main, dev]`, and that filter is on the **base**. A PR aimed at a feature branch
never fires it and GitHub reports "no checks reported". Until a child is retargeted, the
push hook is its only gate — so run the four locally on that branch and say so in the PR.

**Merging the parent with `--delete-branch` can close the child instead of retargeting it.**
Deleting a branch that is the base of an open PR closes that PR, and a closed PR whose base
no longer exists cannot be reopened — the work has to come back as a new number. The repo
setting is not the culprit: `delete_branch_on_merge` is off here, so nothing deletes a
branch except that flag.

The order that avoids it, and it is worth following exactly:

```sh
gh pr merge <parent> --squash                 # no --delete-branch
gh pr edit <child> --base dev                 # retarget while the old base still exists
git rebase --onto origin/dev <parent-tip> <child-branch>
git push --force-with-lease origin <child-branch>
git push origin --delete <parent-branch>      # only now
```

`--onto` is the load-bearing part. The parent's commits are one squashed commit on `dev`
now, but the child still carries them as its own ancestors; a plain rebase replays them
against a `dev` that already has their content. `<parent-tip>` is the parent branch's last
commit — everything after it is the child's own work, and that is all that should move.

Retargeting before the delete is what makes the child survive, and it is also what starts
its CI: the base becomes `dev`, so the workflow filter finally matches.

## What this repository does NOT have, and why that matters here

`cz.vednemesicnik`'s model leans on CI. This one has part of it:

- **`ci.yml` runs on every PR into `main` or `dev`** — the PR title, lint and format, on
  Node 26 read from `.nvmrc`. `typecheck`, the suite and `remix doctor` join with the first
  application code, as in `cz.vednemesicnik.billing`.
- **The checks are required.** The repository is public, so the `branch-protection` ruleset
  on `main` and `dev` requires a pull request and the `pr-title`, `lint` and `format` checks,
  and forbids force-pushes and deletion. Repository admins can bypass it, as in
  `cz.vednemesicnik`. When a gate is added to `ci.yml`, add it to the ruleset too.
- **No deploy workflow.** **Merging to `main` deploys nothing** — the app is not deployed
  anywhere yet. It will deploy to Cloudflare Workers from `main`; until then `main` is kept
  meaningful so that the deploy has somewhere to hang.
- **No `sync-dev.yml`.** The back-merge after a release is opened by hand:

  ```sh
  gh pr create --base dev --head main --title "chore: back-merge main into dev"
  ```

  After a release merge, `dev` is behind by exactly that merge commit, so the back-merge is
  trivial — but nothing will remind you. Forgetting it is how the two branches drift.

## Where the gates run, and what each one is for

`lefthook.yaml` runs `format` and `lint` on **commit**, and `format:check` and `lint` on
**push**. `.github/workflows/ci.yml` runs the same on the **pull request**, plus the title.

They are not the same gate twice. The hook is the fast one: it stops a broken commit before it
leaves the machine. But it runs on **the pushing machine**, so it inherits that machine's
problems, and `git push --no-verify` skips it. CI does not depend on anybody's laptop, and on
this public repository it also blocks the merge.
