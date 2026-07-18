<!-- Default template, for feature/fix → dev. Hotfix → main: use --template hotfix.md.
     See docs/_branching-model.md -->

## Summary

<!-- One line: what this PR does. -->

## Changes

<!-- One bullet per notable change. -->

Closes #NNN

## Checks

<!-- Confirm before requesting review. -->
- [ ] `pnpm app:typecheck` passes
- [ ] `pnpm test` passes
- [ ] Prisma migration (`prisma/migrations/**`): none / included — call it out

## Merge method

**Squash** (per `docs/_branching-model.md`).
