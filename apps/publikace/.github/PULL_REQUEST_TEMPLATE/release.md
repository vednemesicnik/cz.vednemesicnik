<!-- Release PR: dev → main. See docs/branching-model.md
     Title it with the version it ships: `chore(release): v0.4.0` — the next patch, minor or
     major after the newest tag. The `release-version` check says which ones are allowed. -->

## Summary

<!-- One line: the theme of this release. -->

## What ships

<!-- One bullet per shipped PR/change with #refs; group related ones. -->

-

## Deploy expectation

**Nothing deploys.** This repository has no deploy workflow and the app is not running
anywhere yet, so merging to `main` moves a branch pointer and no more. `main` is kept
meaningful now so that a deploy has somewhere to hang later; when it does, this section
becomes the place to say what the release expects of it.

Say out loud while that is still true:

- [ ] **Nothing in this release writes to the real Drive.** Until the app is deployed, every
      run uses a test shared drive, a test Registr and a test Mailer. A setting that points at the real ones
      would create real folders and send real e-mails to authors

## After merge

`release.yml` tags the merge commit with the version in the title. From `v1.0.0` on it also
publishes the release on the GitHub Releases page; below that the tag is the whole record.
Check that the tag is there:

```sh
git ls-remote --tags origin 'refs/tags/v*'
```

There is no `sync-dev.yml` here, so **open the back-merge by hand**:

```sh
gh pr create --base dev --head main --title "chore: back-merge main into dev"
```

`dev` is behind by exactly this release's merge commit, so it is trivial — and nothing will
remind you. Forgetting it is how the branches drift.

## Merge method

**Merge commit** (per [docs/branching-model.md](../../docs/branching-model.md)). Squashing a
`dev → main` release would permanently diverge the branches — do not squash.
