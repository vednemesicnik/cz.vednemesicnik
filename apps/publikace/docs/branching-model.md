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
- **Release:** PR `dev → main`, titled with the version it ships: `chore(release): v0.4.0`.
- **Hotfix:** branch off `main`, PR into `main`, then back-merge into `dev`. It takes the next
  patch version by itself.

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

## Versions

Every merge into `main` is a version, and the version is a tag on the merge commit:
`v0.4.0`. Nothing else carries it — `package.json` has no `version`, because bumping it would
take a PR into `dev` before every release.

- **A release names its version in the PR title**, `chore(release): v0.4.0`, and it has to be
  the next patch, minor or major after the newest tag. The first one is `v0.1.0`.
- **A hotfix is the next patch**, without asking: `v0.4.0` → `v0.4.1`.
- **Below 1.0.0 until the app runs on Fly.io.** A major of 1 is refused while the repository has
  no `fly.toml`, so `v1.0.0` is the release that first reaches production, and it is cut in the
  same release that brings the deploy.
- **From `v1.0.0` on, each version is also a release on
  [GitHub Releases](https://github.com/vednemesicnik/cz.vednemesicnik.publikace/releases)**,
  with notes generated from the PRs since the previous tag. The `0.x` versions are tags only:
  the page lists what reached production, and nothing below 1.0.0 did.

Which part to raise follows semver: below 1.0.0 a minor for a release that adds something and a
patch for one that only fixes; from 1.0.0 on a major for a release that breaks what the
`SCRIPT__Publication__*` jobs or a shared link rely on.

[scripts/release-version.ts](../scripts/release-version.ts) holds the rule, and it runs twice:
as the `release-version` check in [ci.yml](../.github/workflows/ci.yml), so a wrong title blocks
the merge, and in [release.yml](../.github/workflows/release.yml) after the merge, which tags the
commit and, from 1.0.0, publishes the release. Retitling the PR re-runs the check.

**The tags are fixed once made.** The `release-tags` ruleset forbids updating or deleting a `v*`
tag, and the repository has immutable releases on, so a published release keeps its tag and its
notes. Repository admins can bypass the ruleset; a mistaken tag is better followed by the next
version than moved.

**If `release.yml` fails, the merge is on `main` without a version.** Fix the cause and tag the
merge commit by hand with the version the check printed:

```sh
git tag -a v0.4.0 -m "v0.4.0 (#<n>)" <merge-commit> && git push origin refs/tags/v0.4.0
gh release create v0.4.0 --verify-tag --generate-notes --notes-start-tag <previous>  # from 1.0.0
```

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

- **`ci.yml` runs on every PR into `main` or `dev`** — the PR title, the release version, lint,
  format, typecheck, the suite and `remix doctor`, on Node 26 read from `.nvmrc`.
- **The checks are required.** The repository is public, so the `branch-protection` ruleset
  on `main` and `dev` requires a pull request and the `pr-title`, `release-version`, `lint`, `format`, `typecheck`, `test` and `doctor` checks,
  and forbids force-pushes and deletion. Repository admins can bypass it, as in
  `cz.vednemesicnik`. When a gate is added to `ci.yml`, add it to the ruleset too.
- **No deploy workflow.** **Merging to `main` deploys nothing** — the app is not deployed
  anywhere yet. It will deploy to Fly.io from `main`; until then `main` is kept
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
