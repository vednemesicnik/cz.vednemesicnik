<!-- Release PR: dev → main. See docs/_branching-model.md -->

## Summary

<!-- One line: the theme of this release. -->

## What ships

<!-- One bullet per shipped PR/change with #refs; group related PRs. -->
-

## Deploy expectation

<!-- Does this release include a Prisma migration (prisma/migrations/**)?
     - No migration  → the `Pre-migration database backup` step is SKIPPED.
     - Has migration → the backup step RUNS; call it out here. -->
No Prisma migration in this release, so the `Pre-migration database backup` step
should be **skipped**.

## Merge method

**Merge commit** (per `docs/_branching-model.md`). Squashing a `dev → main`
release would permanently diverge the branches — do not squash.
