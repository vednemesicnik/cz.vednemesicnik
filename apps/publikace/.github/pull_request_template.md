<!-- Default template, for feature/fix → dev.
     Release dev → main: --template release.md. Hotfix → main: --template hotfix.md.
     See docs/branching-model.md -->

## Summary

<!-- One line: what this PR does. -->

## Changes

<!-- One bullet per notable change. Say why, not just what. -->

## Checks

<!-- lefthook's pre-push already runs format and lint — so the boxes below are the things it
     cannot check. Tick what applies; delete what does not. -->

- [ ] `pnpm lint` and `pnpm format:check` pass locally. CI runs them again on this PR, so
      the box is about catching it before the round trip — not about being believed
- [ ] Google Drive stays the source of truth: anything the app shows from the Registr or an
      Evidence is read from the cache, and anything it changes is written to the sheet first
- [ ] **No real data.** Authors, providers, e-mail addresses, Drive IDs, folder links and
      shared-link keys are fictional; `priklad.cz` is the convention. This repository is public
- [ ] Czech in anything a user reads, English in code, identifiers, URL paths and commit messages
- [ ] `pnpm format` was run if any Markdown changed — `oxfmt` formats it, the pre-commit
      hook does not glob it, and `format:check` fails on push instead
- [ ] A screen that changed matches its drawing in the design canvas (file and anchor, e.g.
      `12b`), or the PR says why it departs from it

## Merge method

**Squash** (per [docs/branching-model.md](../docs/branching-model.md)).
