<!-- Release PR: dev → main. See docs/_branching-model.md -->

## Summary

<!-- One line: the theme of this release. -->

## What ships

<!-- One bullet per shipped PR/change with #refs; group related PRs. -->
-

## Versions

<!-- One line per semver application this release gives a version, as `- <app>-vX.Y.Z`:
     the next patch, minor or major after its newest tag. The `release-version` check lists
     what each changed application would get, and blocks a missing or wrong one. Date-style
     applications (the web) are tagged by the merge day and need no line. See
     docs/_branching-model.md § Versions. -->

## Gates

<!-- Unreleased work hidden in production: the gates still on dev, and the ones this release
     adds or removes, per application. "None" when there are none. See
     docs/_branching-model.md § Unreleased work behind a gate. -->

## Deploy expectation

<!-- Does this release include a Prisma migration (apps/web/prisma/migrations/**)?
     - No migration  → the `Pre-migration database backup` step is SKIPPED.
     - Has migration → the backup step RUNS; call it out here. -->
No Prisma migration in this release, so the `Pre-migration database backup` step
should be **skipped**.

## Merge method

**Merge commit** (per `docs/_branching-model.md`). Squashing a `dev → main`
release would permanently diverge the branches — do not squash.
