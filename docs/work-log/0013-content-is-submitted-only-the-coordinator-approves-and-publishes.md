# 0013. Every content type is submitted for review; only the Coordinator approves and publishes

- Date: 2026-09-28
- Issues: #590, #627

## Context

The dashboard used to count every draft by a lower-role author as waiting for approval, so a
text still being written looked the same as a finished one. A Creator could publish their own
content once a Coordinator had approved it, and could pre-review other authors' drafts. The
redesign needs the Coordinator to approve texts as they come and publish them later in the order
they should stand on the web (#243), which a Creator publishing on their own would break.

The design project decided it on 27–28 Sep 2026 (`dj753f0j`, `gbsczekj`, document 07) and drew it
for every content type: 25c (categories), 25e (tags), 26e (issues), 27c, 27h and 27i (podcasts
and episodes). #590 built it for articles, #627 for the rest.

## Outcome

An author marks a finished draft with **Odeslat ke schválení**. Submission is a flag on the
draft (`submittedAt`, `submittedById` on every content model), not a content state; the states
stay `draft`, `published` and `archived`. Waiting means submitted with no approving review.

Only the Coordinator approves (`review`) and publishes (`publish`), on every content type. The
Creator submits like the Contributor; their remaining extra rights are seeing others' drafts and
retracting or archiving their own published content.

## What follows

- A new content type gets the submission columns, a `createSubmissionHandlers` config and the
  shared action flags (`get-content-action-flags.server.ts`); the Creator gets no `publish` or
  `review` grant on it.
- Submitted content is locked for its authors and can't be deleted until they take it back. A
  Coordinator's correction keeps the approval; taking back or returning it deletes the approval.
- The Coordinator may publish a never-submitted draft directly: publishing is the approval.
- Approval reads a submitted text: the server refuses Schválit on an unsubmitted draft.
- Drafts are not marked as submitted when the columns arrive (#590, #627). An approval given
  under the old flow stays on its draft, so such a draft shows as Schváleno as soon as its
  author submits it.
- The review gate from [0005](0005-review-gate-keys-off-role-level.md) stays as a server-side
  guard.
- The current state is described in
  [_author-roles-and-permissions.md](../_author-roles-and-permissions.md#submission).

## Turned down

- **Pending as a fourth content state** — rejected: an approved text waiting for its order is
  still a draft, and every state query would grow a case (`gbsczekj`).
- **Keep the Creator's own publishing after approval** — rejected: it takes the order on the web
  away from the Coordinator.
