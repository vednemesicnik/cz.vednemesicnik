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

- **`review` permission** — "this role **may submit** a review." Granted to Creator and
  Coordinator (see the permission table). A Creator's review is a **pre-review that
  assists the Coordinator**: the Creator vets the content so the Coordinator doesn't have
  to go through everything and only needs to confirm it.
- **Approver level** — role levels are inverted (lower number = higher authority), so an
  approver is any role with `level <= APPROVER_ROLE_LEVEL` — currently only Coordinator
  (level 1). Such a role publishes without review, and *its* review unlocks publishing for
  content authored by lower roles (higher level numbers). The threshold constant lives in
  `app/utils/permissions/author/review-policy.ts`.

Consequences:

- Content cannot be published while **every** author's role is below the approver level and
  no approver-level review exists. In practice: a Contributor/Creator draft needs a
  **Coordinator** review first; a Creator's own pre-review does **not** unlock publishing —
  the Coordinator still has the final say.
- If any author is at the approver level (e.g. a Coordinator co-author on a multi-author
  article), publishing is allowed without a review. Single-author content (tags, categories,
  podcasts, episodes, links, issues) has exactly one author, so the rule reduces to "that
  author's role".
- A Coordinator can publish their own content without any review.

The helpers `canPublishWithoutReview` / `needsReviewToPublish` in
`app/utils/permissions/author/review-policy.ts` encode this and are used by every content
detail loader and `publish-*` action. If the gate ever needs to become configurable, it
belongs in the permission catalog (a future `approve` action), not on the role.

## Permissions Overview

| **Role**        | **Action** | **Access** | **State**                  | 📝 Article | 📂 Article Category | 🏷️ Article Tag | 🎙️ Podcast | 📻 Podcast Episode | 🔗 Podcast Episode Link | 🗞 Issue |
|-----------------|------------|------------|----------------------------|------------|---------------------|-----------------|-------------|--------------------|-------------------------|----------|
| **Contributor** | View       | Own        | Draft, Published, Archived | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        |
|                 | Create     | Own        | Draft                      | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        |
|                 | Update     | Own        | Draft                      | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        |
|                 | Delete     | Own        | Draft                      | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        |
| **Creator**     | View       | Any        | Draft, Published           | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        |
|                 | View       | Own        | Archived                   | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        |
|                 | Create     | Own        | Draft                      | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        |
|                 | Update     | Own        | Draft                      | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        |
|                 | Delete     | Own        | Draft                      | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        |
|                 | Publish    | Own        | Draft                      | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        |
|                 | Retract    | Own        | Published                  | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        |
|                 | Archive    | Own        | Published                  | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        |
|                 | Review     | Any        | Draft                      | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        |
| **Coordinator** | View       | Any        | Draft, Published, Archived | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        |
|                 | Create     | Any        | Draft                      | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        |
|                 | Update     | Any        | Draft                      | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        |
|                 | Delete     | Any        | Draft, Archived            | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        |
|                 | Publish    | Any        | Draft                      | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        |
|                 | Retract    | Any        | Published                  | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        |
|                 | Archive    | Any        | Published                  | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        |
|                 | Restore    | Any        | Archived                   | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        |
|                 | Review     | Any        | Draft                      | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        |

## Role Descriptions

### **Contributor**
- Can view and manage their own content in Draft and Published states.
- Can **view their own Archived content** (read-only) — archiving withdraws content
  from circulation, it does not hide it from its own author.
- Can create, update, and delete their own drafts.
- **Cannot publish, retract, archive, or restore content** - these actions require Creator or Coordinator intervention.
- **Cannot review content**.

### **Creator**
- Can **view any Draft and Published content** from all authors (broad visibility for editorial oversight).
- Can **view their own Archived content** (read-only) — but **not** other authors' archived
  content; the archive stays a Coordinator zone.
- Can create, update, and delete their own drafts.
- Can publish, retract, and archive **their own content only**.
- **Can submit reviews** (the `review` permission) — a pre-review that helps the Coordinator,
  who then only needs to confirm it.
- **Publishing own content requires review**: because Creator (level 2) is below the
  approver level, a Creator can only publish their own draft once an approving **Coordinator**
  review exists. A Creator's own review does not satisfy this.
- **Cannot publish Contributor content** — only helps the Coordinator by pre-reviewing it.

### **Coordinator**
- Full access to any content (own or others') in Draft, Published, and Archived states.
- Can create, update, and delete any content in Draft and Archived states.
- Can publish, retract, and archive any content from any author.
- Can restore archived content to draft state.
- **Can review any content.** Because Coordinator is at the approver level (level 1), a
  Coordinator review is the one that unlocks publishing for Contributor/Creator content.
- **No review requirement for own content**: can publish their own content without review.
- **Final publishing authority**: publishes Contributor and Creator content once reviewed.

Reviews are recorded as `Review` rows (a reviewer plus a `ReviewState`); there is no
`reviewed` boolean field on content.
