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
- [ ] Prisma migration (`apps/web/prisma/migrations/**`): none / included — call it out

<!-- A PR that touches apps/publikace: tick what applies, delete what does not. -->
- [ ] `pnpm publikace:lint` and `pnpm publikace:format:check` pass. `oxfmt` formats Markdown,
      which the pre-commit hook does not glob, so run `pnpm publikace:format` after a docs change
- [ ] Publikace's database stays the source of truth: nothing is read back from the Registr or
      an Evidence sheet, a change reaches them only through the record queue after the database,
      and an API change the Apps Script jobs call is versioned
- [ ] A screen that changed matches its drawing in the design canvas (file and anchor, e.g.
      `12b`), or the PR says why it departs from it

## Merge method

**Squash** (per `docs/_branching-model.md`).
