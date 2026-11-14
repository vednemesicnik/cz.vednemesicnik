<!-- Hotfix PR: → main, branched off main. See docs/branching-model.md -->

## What broke

<!-- One line: the problem this fixes, and where it was seen. -->

## Fix

<!-- What the fix does, and why this shape rather than the obvious one. -->

## Why this is a hotfix

<!-- Hotfixes skip `dev`, so they skip whatever else is sitting there. Say why this could
     not wait for the next release — the answer is usually that `dev` holds something not
     ready to ship. Nothing deploys from `main` yet, so today that reason is rarer than it
     will be later. -->

## Checks

- [ ] `pnpm test`, `pnpm typecheck` and `pnpm lint` pass locally, on Node 26. CI checks
      this PR as well
- [ ] Branched off `main`, not off `dev`
- [ ] **Migration**: none / a new one. A hotfix migration lands ahead of anything still
      waiting in `dev`, so check it does not collide with one queued there

## After merge

**Open the back-merge by hand** — there is no `sync-dev.yml` in this repository:

```sh
gh pr create --base dev --head main --title "chore: back-merge main into dev"
```

Without it the fix lives only on `main` and the next release quietly reverts it.

## Merge method

**Squash** (per [docs/branching-model.md](../../docs/branching-model.md)).
