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
- **Versions** — one line `- <app>-vX.Y.Z` per semver application whose folder the release
  changes: the next patch, minor or major after its newest tag (`git tag --list 'publikace-v*'`).
  The web is tagged by date and needs no line. Publikace has no tag until the release that has
  the host serve it (#1082), which names `- publikace-v1.0.0`; before that, name nothing for
  it. Once the PR is open, read the `release-version` check's summary: it lists the tag every
  changed application will get, and fails on a missing or wrong version. Fix the body, never
  the check. When the app's **Issue weighing** names a milestone for the version, the release
  names it only once the milestone has no open issue left
  (`gh issue list --milestone "<title>" --state open`); one still open is either weighed down out
  of it or the version waits.
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
3. **Check the tags.** `release.yml` tags the merge commit for each changed application and
   publishes its Release: `gh release list --limit 5` shows them next to the run's summary. A
   failed or cancelled run is re-run from the Actions page
   ([docs/\_branching-model.md](../../../docs/_branching-model.md) § Versions). Close the
   milestone of each version the release named, looked up by its title:
   `gh api 'repos/{owner}/{repo}/milestones?state=open' --jq '.[] | select(.title == "<title>") | .number'`,
   then `gh api -X PATCH repos/{owner}/{repo}/milestones/<number> -f state=closed`.
4. **Merge the back-merge.** `sync-dev.yml` opens `chore: back-merge main into dev`. Once its
   checks are green, merge it with a merge commit in the same turn, then confirm that `main`
   still exists (`git ls-remote --heads origin main`) and that `dev` is not behind it. The
   release is not done while the back-merge is open.
