# Branching model

Publikace lives in `cz.vednemesicnik` as `apps/publikace` (cz.vednemesicnik#1077) and follows the repository's
branching model: [docs/\_branching-model.md](../../../docs/_branching-model.md). Work goes to
`dev` by squash, `dev` goes to `main` by a merge commit in a release PR, and every push to `main`
deploys. One release covers every application in the repository.

**Versions.** Publikace keeps semver, as tags `publikace-vX.Y.Z` and GitHub Releases that the
repository's `release.yml` makes after a merge into `main` that changed `apps/publikace/`
([docs/\_branching-model.md § Versions](../../../docs/_branching-model.md#versions)). A release
names the version under `## Versions` in its body; a hotfix gets the next patch. Publikace has
no tag yet: its first is `publikace-v1.0.0`, named in the release that has the host serve
`publikace.vednemesicnik.cz` (#1082). Its former `release.yml` ended with the move.

**Checks.** [publikace.yml](../../../.github/workflows/publikace.yml) runs `publikace-lint`,
`publikace-format`, `publikace-typecheck`, `publikace-test` and `publikace-doctor` on a PR that
touches Publikace, and on every deploy. The repository's `pr-title.yml` checks the PR title.
The root [lefthook.yaml](../../../lefthook.yaml) runs format and lint on commit, and format,
lint, typecheck, the suite and doctor on push, when the files are Publikace's.
