---
name: release-pr
description: Cut a release — open the `dev → main` PR with the release template, say what ships and what the deploy will do, merge it with a merge commit on the user's explicit yes, then watch the deploy and merge the back-merge. Use when `dev` is to go to production.
argument-hint: <theme>
---

# Release PR

Cutting a release means opening a `dev → main` PR. `main` is the only deploy source,
so this PR is the moment production changes. See `docs/_branching-model.md` for the
full branching model; this reference is the agent checklist.

## Create the PR

Use the named, opt-in template — it fills the **body** only, so set the title yourself:

```bash
gh pr create --base main --head dev --template release.md \
  --title "release: $(date +%F) — <theme>"
```

- Template: `.github/PULL_REQUEST_TEMPLATE/release.md`. It is a **named opt-in**
  template that overrides the default when passed with `--template`. GitHub prefills the
  default template (`.github/pull_request_template.md`, for feature/fix → `dev`) on every
  manually opened PR; `release.md` and `hotfix.md` are the named opt-in overrides. Keep
  `release.md` named — never rename it to the repo-root default.
- Title convention: `release: <date> — <theme>` (e.g.
  `release: 2026-07-18 — admin tables & lists rollout`).

## Fill in the body

- **What ships** — one bullet per shipped PR/change with `#refs`; group related PRs.
- **Deploy expectation** — does the release include a migration of a served application's
  database (the web's `apps/web/prisma/migrations/**`)? No migration → the `Pre-migration
  database backup` step is **skipped**. Has migration → the backup step **runs**; call it out.
  One release ships every application in the repository, so name each one it changes.

## Merge method — critical

Merge with a **merge commit**, never squash. Squashing `dev → main` rewrites the
commits and permanently diverges the two branches. (feature/fix → `dev` and
hotfix → `main` use squash; release and back-merge use merge commit.)

## After the merge

The merge to `main` is production, so it needs the user's explicit words ("merge it"); a
question or a soft "probably fine" is not one.

1. **Watch the deploy** (`deploy.yml`): every check workflow runs again, then the backup step
   when migrations ship, `flyctl deploy` and the `/health` smoke test on the Fly origin. Never
   start a manual backup over `fly ssh`; the pipeline takes it.
2. **Check production lightly**: the pages, sign-in, images and PDFs from the stores, the
   console. A probe stays small (no large uploads against production).
3. **Merge the back-merge.** `sync-dev.yml` opens `chore: back-merge main into dev`. Once its
   checks are green, merge it with a merge commit in the same turn, then confirm that `main`
   still exists (`git ls-remote --heads origin main`) and that `dev` is not behind it. The
   release is not done while the back-merge is open.
