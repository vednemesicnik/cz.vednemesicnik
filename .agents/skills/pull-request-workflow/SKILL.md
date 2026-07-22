---
name: pull-request-workflow
description: |
  End-to-end pull-request lifecycle for this repo: branch, open the PR, run the
  Copilot review loop to completion, and merge with the right method.

  Trigger for:
  - Opening a pull request for a finished feature or fix branch
  - Requesting or re-requesting a Copilot review, or acting on its findings
  - Resolving review threads and driving a PR to a clean, mergeable state

  DO NOT trigger for:
  - Work-in-progress commits not yet up for review
  - The pre-PR diff self-review checklist itself — that is the
    `self-review-before-pr` rule (run it first, then follow this skill)
  - Branching/merge-method policy details — those live in
    `docs/_branching-model.md`; this skill only summarizes and links them
---

# Pull Request Workflow

The steps below assume the change is committed on a branch and the
`self-review-before-pr` rule has already been run. Author every PR/issue title and
body in **English**; write review-thread replies in the **language of the thread**.

## 1. Branch & commit

- Branch off `dev`, kebab-case, **with the issue number**: `feat/290-format-dates`.
- Every commit is a **Conventional Commit** — including review fix-ups
  (`fix:`, `refactor:`, `docs:`, `style:`, …), never `Address review: …`.
- Review fixes are **normal append-only commits**. Never `--force`, `reset`, or
  amend already-pushed history.
- No AI/Claude attribution or co-author lines.

## 2. Open the PR

```sh
gh pr create --base dev --head <branch> \
  --title "feat: …" --assignee "@me" \
  --body "Closes #<issue>. …"
```

- Target `dev` (features/fixes). Body: context, changes, verification; every claim
  must match the code.
- `gh` comments post **under your own account** — never @-mention or refer to the
  repo owner in the third person in a PR/issue comment.

## 3. Copilot review loop

Copilot **does not run automatically** — request it explicitly (and again after
each round):

```sh
gh api repos/<owner>/<repo>/pulls/<n>/requested_reviewers \
  -X POST -f "reviewers[]=copilot-pull-request-reviewer[bot]"
```

For **each** review round:

1. **Address** every finding.
2. **Generalize across the whole diff.** Copilot flags only a *subset* of a
   repeating pattern — `grep` the diff for the same construct and fix **all**
   occurrences in the same commit, or you waste a round re-fixing the ones it
   flags next time.
3. **Commit** (Conventional, append-only) and `git push`.
4. **Reply** to each thread, referencing the fixing commit sha.
5. **Resolve** each thread:
   ```sh
   gh api graphql -f query='mutation { resolveReviewThread(input: {threadId: "<id>"}) { thread { isResolved } } }'
   ```
6. **Re-request** Copilot (step's command above).
7. **Verify** before declaring clean — resolve *all* open threads and confirm zero
   remain. Fetch the max page (100) and assert the result isn't truncated, so the
   count can't silently undercount on a large PR:
   ```sh
   gh api graphql -f query='{ repository(owner:"<owner>",name:"<repo>"){ pullRequest(number:<n>){ reviewThreads(first:100){ totalCount pageInfo { hasNextPage } nodes { isResolved } } } } }' \
     --jq '.data.repository.pullRequest.reviewThreads
           | if .pageInfo.hasNextPage then "PAGINATE: >100 threads (\(.totalCount))"
             else "unresolved=\([.nodes[] | select(.isResolved==false)] | length)" end'
   ```

Copilot's login is `copilot-pull-request-reviewer[bot]` in REST but appears as
`copilot-pull-request-reviewer` in GraphQL author fields — filter accordingly.
The loop is done when a pass returns **no new comments** and unresolved == 0, with
CI green (`gh pr checks <n>`).

## 4. Merge method

Method matters — see `docs/_branching-model.md`. Summary:

| PR | Method |
| --- | --- |
| feature / fix → `dev` | **squash** |
| release `dev → main` | **merge commit** (squash would diverge the branches) |
| hotfix → `main` | squash |
| back-merge `main → dev` | **merge commit** |
