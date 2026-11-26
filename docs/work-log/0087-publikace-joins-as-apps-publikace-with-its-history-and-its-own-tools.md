# 0087. Publikace joins as apps/publikace, with its history and its own tools

- Date: 2026-11-26
- Issues: #1077, #1063, #1075

## Context

Publikace was built and finished in its own repository, vednemesicnik/cz.vednemesicnik.publikace:
a Remix 3 app on `node:sqlite` with 107 commits, linted by oxlint, formatted by oxfmt and tested
by `remix test`. To serve it, the host of
[0084](0084-a-remix-3-server-in-front-of-the-web-routes-each-host-to-its-application.md) has to
import it, so it moved into this workspace. The web had already moved out of the root
([0086](0086-the-web-lives-in-apps-web-and-the-repository-root-is-the-host.md)), and its CI
jobs had already been named for it (#1075).

## Outcome

**Publikace's history is rewritten into `apps/publikace` and merged, not squashed.**
`git filter-repo --to-subdirectory-filter` moved every commit under the folder, so `git log` and
`git blame` work on its files without `--follow`. A bare `#N` in its commit messages now reads
`vednemesicnik/cz.vednemesicnik.publikace#N`. Otherwise it would point at the web's issue with
the same number. The import PR lands as a merge commit.

**One workspace, two toolchains.** There is one lockfile and one pnpm version (12.18.0, the
newer of the two), and Publikace's esbuild override now covers the workspace. Each application
keeps its own tools:
- Biome skips `apps/publikace` (`biome.json`), and Publikace keeps its oxlint, oxfmt and
  `tsconfig.json`.
- One root `lefthook.yaml` runs each application's commands on its own files.
- `publikace.yml` holds the `publikace-*` checks, gated on its files and called from
  `deploy.yml`.

**lefthook's install script is refused repository-wide.** The root `postinstall` runs
`lefthook install`, which is Publikace's arrangement: an install script is somebody else's code,
and lefthook's binary needs none.

**One release for the repository.** Publikace's `v0.x` tags and `release.yml` end with the move,
and its PR and release templates give way to the repository's. `scripts/release-version.ts`
stays for a later per-app version.

## What follows

- The image still carries only the host and the web. Serving Publikace
  (vednemesicnik/cz.vednemesicnik.publikace#79) adds its manifest to the install stages and its
  folder to the final stage. Its database also needs a backup and a migrations line in the
  deploy filter.
- Publikace's skills, rules, agents and `skills-lock.json` still sit in `apps/publikace`; merging
  them with the root's is the next change.
- The merged lockfile resolved a few of Publikace's transitive packages to versions the
  workspace already had, among them `@remix-run/*` patches and `oxc-resolver`. A failure that
  appears in Publikace only after the move starts there.

## Turned down

- **`git subtree add`.** It keeps the old paths in history, so a file's log needs `--follow`,
  and the bare `#N` would point at the web's issues.
- **One linter for both.** The applications chose their tools for their stacks, and
  `branch-protection` already requires each application's own checks.
