# Branching model

Publikace lives in `cz.vednemesicnik` as `apps/publikace` (cz.vednemesicnik#1077) and follows the repository's
branching model: [docs/\_branching-model.md](../../../docs/_branching-model.md). Work goes to
`dev` by squash, `dev` goes to `main` by a merge commit in a release PR, and every push to `main`
deploys. One release covers every application in the repository.

**Versions.** Publikace's own `v0.x` tags and `release.yml` ended with the move. A per-app
version (tags such as `publikace-v…`) is a later change. Until then
[scripts/release-version.ts](../scripts/release-version.ts) is kept for it, and the old workflow
can be read back with `git show b50d8787^2:apps/publikace/.github/workflows/release.yml`.

**Checks.** [publikace.yml](../../../.github/workflows/publikace.yml) runs `publikace-lint`,
`publikace-format`, `publikace-typecheck`, `publikace-test` and `publikace-doctor` on a PR that
touches Publikace, and on every deploy. The repository's `pr-title.yml` checks the PR title.
The root [lefthook.yaml](../../../lefthook.yaml) runs format and lint on commit, and format,
lint, typecheck, the suite and doctor on push, when the files are Publikace's.
