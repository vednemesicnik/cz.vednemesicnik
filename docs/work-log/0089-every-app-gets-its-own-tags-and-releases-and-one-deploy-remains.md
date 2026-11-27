# 0089. Every app gets its own tags and Releases, and one deploy remains

- Date: 2026-11-27
- Issues: #1093

## Context

One release PR (`dev → main`) and one deploy ship every application in the repository
([0086](0086-the-web-lives-in-apps-web-and-the-repository-root-is-the-host.md),
[0087](0087-publikace-joins-as-apps-publikace-with-its-history-and-its-own-tools.md)), and
nothing recorded which version of which application went out. Publikace's own release
machinery came along in the import but ran nowhere: `release.yml` had been removed and
`scripts/release-version.ts`, which read the version from a title like
`chore(release): v0.4.0`, was kept for later. Neither repository had a tag. Libor decided on
26 Nov 2026 that one deploy stays and every application gets its own tags and GitHub
Releases. Publikace keeps semver and the web uses dates, a new application picks its own
style, and Publikace's first version is `publikace-v1.0.0`, when the host first serves it
(#1082).

## Outcome

**After every merge into `main`, each application whose folder changed gets a tag
`<app>-<version>` on the merge commit and a Release with the commits that touched it.** The
decision is made by one root script, `scripts/release-version.ts`, which holds each
application's style. It runs twice: before the merge as the `release-version` check, and after
it in `release.yml`, so the two cannot disagree.

- **The web** is tagged by the day of the merge in Prague, `web-2026-11-27`. A second tag the
  same day gets `-2`.
- **Publikace** is tagged by semver. A release names the version under `## Versions` in its
  body, `- publikace-v1.1.0`, and it has to be the next patch, minor or major. A hotfix takes
  the next patch. The first version is always `v1.0.0` and must be named. Until a release names
  it, Publikace stays untagged, even though its folder changes.

**Publikace's two-job split is kept.** A read-only job checks out the merge commit and decides.
A job with write access never checks anything out: it re-validates each tag and writes the tag
and the Release through the API. A failed or cancelled run is re-run, and a tag that is already
on the merge commit counts as done.

## What follows

- [docs/\_branching-model.md](../_branching-model.md) § Versions describes it. A new
  application adds its style to `RELEASE_STYLES`, and the check fails on every PR until it
  does.
- Work in progress of one application stays off `dev`. A release takes everything that is on
  `dev`, and with it the other application's next tag.
- `release-version` is a required check of the `branch-protection` ruleset (added 27 Nov
  2026), so a red gate blocks the merge into `main` and `dev`.
- Reasons to revisit:
  - releases so frequent that the one pending run per concurrency group loses tags;
  - an application that needs its version at runtime (Sentry releases, a version shown in the
    app);
  - separate deploys per application.

## Turned down

- **The version in the release title**, as Publikace had it. One title serves every
  application, and the dated `release:` title was already in use.
- **The version in `package.json`.** Every release that changed Publikace would need a bump PR
  into `dev` first, and the file could drift from the tags.
- **Versions derived from Conventional Commit types.** The first version, `1.0.0`, is a product
  milestone rather than a commit type, and Publikace's versions were always chosen by hand.
- **`0.x` tags until #1082.** The issue makes `publikace-v1.0.0` the first version.
- **A mechanical check that the host serves Publikace.** It would have to grep host code that
  does not exist yet, and naming the first version by hand is deliberate enough.
- **GitHub's generated notes.** `--generate-notes` cannot limit the notes to one folder.
