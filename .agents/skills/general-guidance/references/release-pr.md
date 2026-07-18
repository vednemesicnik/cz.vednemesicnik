# Release PR — Project Conventions

Cutting a release means opening a `dev → main` PR. `main` is the only deploy source,
so this PR is the moment production changes. See `docs/_branching-model.md` for the
full branching model; this reference is the agent checklist.

## Create the PR

Use the named, opt-in template — it fills the **body** only, so set the title yourself:

```bash
gh pr create --base main --head dev --template release.md \
  --title "release: $(date +%F) — <theme>"
```

- Template: `.github/PULL_REQUEST_TEMPLATE/release.md`. It is opt-in (named), so
  feature/fix PRs targeting `dev` stay template-free — never move it to a repo-root
  `PULL_REQUEST_TEMPLATE.md`, which would apply to every PR.
- Title convention: `release: <date> — <theme>` (e.g.
  `release: 2026-07-18 — admin tables & lists rollout`).

## Fill in the body

- **What ships** — one bullet per shipped PR/change with `#refs`; group related PRs.
- **Deploy expectation** — does the release include a Prisma migration
  (`prisma/migrations/**`)? No migration → the `Pre-migration database backup` step is
  **skipped**. Has migration → the backup step **runs**; call it out.

## Merge method — critical

Merge with a **merge commit**, never squash. Squashing `dev → main` rewrites the
commits and permanently diverges the two branches. (feature/fix → `dev` and
hotfix → `main` use squash; release and back-merge use merge commit.)
