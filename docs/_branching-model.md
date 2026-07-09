# Branching Model

The repository uses a persistent `dev` integration branch to decouple **merging a
feature** from **deploying to production**. Merges to `main` deploy; merges to `dev`
do not.

- `dev` is the **default branch** — feature, fix, and Dependabot PRs target it
  automatically.
- `main` is the **production branch** and the only deploy source.

## Flow

```
feature/fix ──► dev ──(release)──► main ──► deploy
                 ▲                   │
                 └──(back-merge)─────┘

hotfix ──────────────────────────► main ──► deploy
                                     │
                 dev ◄──(back-merge)─┘
```

- **Feature / fix:** branch off `dev`, PR back into `dev`. No deploy.
- **Release:** PR `dev → main`. This is the only moment a deploy happens.
- **Hotfix:** branch off `main`, PR directly into `main` (deploys), then back-merge
  into `dev`.

## Merge methods

The merge method matters: squashing a `dev → main` release would rewrite the commits
and permanently diverge the two branches.

| PR | Method |
| --- | --- |
| feature/fix → `dev` | squash |
| release `dev → main` | **merge commit** — squash would permanently diverge the branches |
| hotfix → `main` | squash |
| back-merge `main → dev` | **merge commit** |

## Automated back-merge

`.github/workflows/sync-dev.yml` runs on every push to `main`. If `dev` is behind, it
opens a single PR `main → dev`; merging it stays a manual decision (merge commit).

After every release merge (`dev → main` merge commit) `dev` is behind by exactly that
merge commit, so the workflow opens a trivially mergeable back-merge PR. Merge it (merge
commit) to keep the histories converged.

The workflow uses a fine-grained PAT (`BACKMERGE_TOKEN`), not the default
`GITHUB_TOKEN`: PRs created with the workflow token do not trigger `pull_request`
workflows, so the required CI checks would sit as "expected" forever and block the
merge. The token is scoped to this repo with **Contents: read** and **Pull requests:
read & write**.

## Hotfix procedure

1. Branch off `main` (e.g. `fix/123-...`).
2. PR into `main`, squash merge. This deploys.
3. The push to `main` triggers `sync-dev.yml`, which opens a back-merge PR `main → dev`.
   Merge it (merge commit) to carry the fix back into `dev`.
