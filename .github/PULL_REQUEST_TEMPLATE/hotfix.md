<!-- Hotfix PR: → main. Merging DEPLOYS TO PRODUCTION. See docs/_branching-model.md -->

## What broke

<!-- One line: the production problem this fixes. -->

## Fix

<!-- What the fix does. -->
-

## Deploy expectation

<!-- Does this hotfix include a Prisma migration (prisma/migrations/**)?
     - No migration  → the `Pre-migration database backup` step is SKIPPED.
     - Has migration → the backup step RUNS; call it out here. -->
No Prisma migration in this hotfix, so the `Pre-migration database backup` step
should be **skipped**.

<!-- After merge, the push to `main` triggers `sync-dev.yml`, which opens a
     back-merge PR `main → dev`. Merge it (merge commit) to carry the fix into dev. -->

## Merge method

**Squash** (per `docs/_branching-model.md`).
