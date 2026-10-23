# Author Roles and Permissions

This document describes access rights and actions available for different roles in the system.

## Roles Overview

| **Role**        | **Level** | **Description**                                                                                      |
|-----------------|-----------|------------------------------------------------------------------------------------------------------|
| **Contributor** | 3         | Content creator with limited access to their own drafts.                                             |
| **Creator**     | 2         | Content creator with extended access to their own drafts and published content.                      |
| **Coordinator** | 1         | Content manager with full access to all drafts, published content, and archived content.             |

### Role Level Hierarchy

The **level** field expresses a role's authority rank (lower number = higher authority):

- **Level 1 (Coordinator)**: Highest authority - full access to all content in all states
- **Level 2 (Creator)**: Mid-level authority - access to own content across states
- **Level 3 (Contributor)**: Entry level - limited to own draft content

`level` drives role ordering/display (sorting, assignable-role bounds) and, on the content
axis, identifies the **approver** for the publish-review gate (see below). Content CRUD
access itself is decided by the permission catalog (the table below), not by comparing
levels.

## Review Policy: the approver level

Two independent concepts govern the review workflow; do not conflate them:

- **`review` permission** — "this role **may approve**." Granted only to the Coordinator
  (#590 for articles, #627 for the rest); the Creator's pre-review is gone.
- **Approver level** — role levels are inverted (lower number = higher authority), so an
  approver is any role with `level <= APPROVER_ROLE_LEVEL` — currently only Coordinator
  (level 1). Such a role publishes without review, and *its* review unlocks publishing for
  content authored by lower roles (higher level numbers). The threshold constant lives in
  `app/utils/permissions/author/review-policy.ts`.

Consequences:

- Only the Coordinator publishes, and publishing is the approval: a Coordinator may publish
  a Contributor's or Creator's draft directly, submitted or not (design 07c, 07d).
- If any author is at the approver level (e.g. a Coordinator co-author on a multi-author
  article), publishing is allowed without a review. Single-author content (tags, categories,
  podcasts, episodes, links, issues) has exactly one author, so the rule reduces to "that
  author's role".
- A Coordinator can publish their own content without any review.

The helpers `canPublishWithoutReview` / `needsReviewToPublish` in
`app/utils/permissions/author/review-policy.ts` encode this and are used by every content
detail loader and `publish-*` action. If the gate ever needs to become configurable, it
belongs in the permission catalog (a future `approve` action), not on the role.

### An article's authors

An article always has at least one author. With `update` on own content only, a Contributor
or Creator must stay among the authors they save, so they add and remove co-authors but never
themselves. The Coordinator, with `update` on any content, picks any authors, without
themselves too. Only the Coordinator adds the association, *Vedneměsíčník, z. s.* (the Owner's
author); one already on the article stays on anyone's save (design 24j, log
[0026](./work-log/0026-the-association-is-the-owners-author-and-only-the-coordinator-adds-it.md)).

## Permissions Overview

| **Role**        | **Action** | **Access** | **State**                  | 📝 Article | 📂 Article Category | 🏷️ Article Tag | 🎙️ Podcast | 📻 Podcast Episode | 🗞 Issue |
|-----------------|------------|------------|----------------------------|------------|---------------------|-----------------|-------------|--------------------|----------|
| **Contributor** | View       | Own        | Draft, Published, Archived | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅        |
|                 | Create     | Own        | Draft                      | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅        |
|                 | Update     | Own        | Draft                      | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅        |
|                 | Delete     | Own        | Draft                      | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅        |
| **Creator**     | View       | Any        | Draft, Published           | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅        |
|                 | View       | Own        | Archived                   | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅        |
|                 | Create     | Own        | Draft                      | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅        |
|                 | Update     | Own        | Draft                      | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅        |
|                 | Delete     | Own        | Draft                      | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅        |
|                 | Publish    | Own        | Draft                      | ❌          | ❌                   | ❌               | ❌           | ❌                  | ❌        |
|                 | Retract    | Own        | Published                  | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅        |
|                 | Archive    | Own        | Published                  | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅        |
|                 | Review     | Any        | Draft                      | ❌          | ❌                   | ❌               | ❌           | ❌                  | ❌        |
| **Coordinator** | View       | Any        | Draft, Published, Archived | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅        |
|                 | Create     | Any        | Draft                      | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅        |
|                 | Update     | Any        | Draft                      | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅        |
|                 | Delete     | Any        | Draft, Archived            | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅        |
|                 | Publish    | Any        | Draft                      | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅        |
|                 | Retract    | Any        | Published                  | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅        |
|                 | Archive    | Any        | Published                  | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅        |
|                 | Restore    | Any        | Archived                   | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅        |
|                 | Review     | Any        | Draft                      | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅        |

## Role Descriptions

### **Contributor**
- Can view their own content in Draft and Published states (Published is view-only).
- Can **view their own Archived content** (read-only) — archiving withdraws content
  from circulation, it does not hide it from its own author.
- Can create, update, and delete their own drafts (Draft is the only editable state).
- **Cannot publish, retract, archive, or restore content** - publishing and restoring are the Coordinator's; a Creator retracts and archives only their own.
- **Cannot review content**.

### **Creator**
- Can **view any Draft and Published content** from all authors (broad visibility for editorial oversight).
- Can **view their own Archived content** (read-only) — but **not** other authors' archived
  content; the archive stays a Coordinator zone.
- Can create, update, and delete their own drafts.
- Can retract and archive **their own content only**.
- **Submits for review, like a Contributor** — neither approves nor publishes any content,
  not even their own (#590, #627). See [Submission](#submission).

### **Coordinator**
- Full access to any content (own or others') in Draft, Published, and Archived states.
- Can create, update, and delete any content in Draft and Archived states.
- Can publish, retract, and archive any content from any author.
- Can restore archived content to draft state.
- **The only one who approves and publishes.** Approves submitted content (Schválit) and
  publishes it, or publishes a draft directly — publishing is the approval.
- **The only one who takes over someone else's edit of an article** (Převzít úpravu, design 24g),
  logged as *Převzata úprava*.

## The edit hold (articles)

Built in #669 (design 07g, logs 0019 and 0021). One browser tab of one person edits a
draft at a time. While someone else holds it, nobody else edits it or changes its state;
only the Coordinator may take the edit over. Anyone may move their own edit from another tab
to this one, without a log. One's own hold never blocks one's own actions, except a delete,
which waits for one's own editor in another tab too (log 0036).

Reviews are recorded as `Review` rows (a reviewer plus a `ReviewState`); there is no
`reviewed` boolean field on content.

## Submission

Built for articles in #590 and for tags, categories, issues, podcasts and episodes in #627
(design 07a–07d). The three content states stay; a submission is a flag on a draft
(`submittedAt`, `submittedById` on each content model):

- **Odeslat ke schválení** — any author of an unsubmitted draft, when no author is at the
  approver level. An article is checked for completeness first (design 23h, the perex
  included); the other types' forms still require every field.
- **Čeká na schválení** — submitted, no approving review. Only these drafts are the
  dashboard's queue. **Schváleno** — submitted with a Coordinator review.
- While submitted, the content is **locked for its authors**: no editing or deleting until
  they take it back. The Coordinator may correct it, and the approval stays.
- **Vzít zpět do konceptu** (an author) and **Vrátit k úpravám** (the Coordinator) clear the
  submission and delete the reviews. Every state change (publish, retract, archive, restore)
  also clears the submission.
- The rules live in `app/utils/permissions/author/submission/`, the transitions in
  `app/utils/content-state/create-submission-handlers.server.ts`.

## Decided for the redesign (not implemented yet)

Decided on 28 Sep 2026 (design questions `dj753f0j`, `gbsczekj`); the sections above describe
today's code. In the target model:

- **Only the Coordinator approves and only the Coordinator publishes.** The Creator loses
  `review` on others' drafts and `publish` on own drafts; its path ends at submitting for
  approval, like the Contributor's. Done (#590, #627).
- **Approving is its own action**, separate from publishing, so the Coordinator can approve
  texts ahead and publish them later in the order they should appear on the web.
- `needsReviewToPublish` gating goes away, since only the Coordinator can publish at all.
  The approval stays an explicit step recorded as a `Review` (**Approve**, or **Approve and
  publish** in one go); a Coordinator may also publish a never-submitted draft directly.

The full lifecycle is in
[_content-creation-lifecycle.md](./_content-creation-lifecycle.md#decided-for-the-redesign-not-implemented-yet).
