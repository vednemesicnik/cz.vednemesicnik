# Content Creation Lifecycle with Roles, Actions, and States

This guide outlines the lifecycle of content items with actions (e.g., create, update, delete, publish, retract, archive, restore) and states (`Draft`, `Published`, `Archived`) based on role permissions.

---

## States

- **Draft**: Content is in progress and not visible to the public.
- **Published**: Content is finalized and visible to the public.
- **Archived**: Content is no longer active but is stored for reference.

---

## Lifecycle Flow

```plaintext
Draft → Published → Archived
            ↓           ↓
         Retract     Restore
            ↓           ↓
          Draft ←──────┘
```

---

## Role-Based Default Actions in Each State

Matches the seeded permission catalog (`prisma/data/author-roles.ts`); the full matrix is in
[_author-roles-and-permissions.md](./_author-roles-and-permissions.md).

| **Role**        | **Action** | **Draft**                 | **Published**                     | **Archived**                       |
|-----------------|------------|---------------------------|-----------------------------------|------------------------------------|
| **Contributor** | **View**   | ✅ Own drafts.             | ✅ Own published content.          | ✅ Own archived content.            |
|                 | **Create** | ✅ Own drafts.             | -                                 | -                                  |
|                 | **Update** | ✅ Own drafts.             | ❌ Published content is read-only. | ❌ Archived content is read-only.   |
|                 | **Delete** | ✅ Own drafts.             | ❌ Cannot delete published content.| ❌ Cannot delete archived content.  |
| **Creator**     | **View**   | ✅ Any draft.              | ✅ Any published content.          | ✅ Own archived content only.       |
|                 | **Create** | ✅ Own drafts.             | -                                 | -                                  |
|                 | **Update** | ✅ Own drafts.             | ❌ Published content is read-only. | ❌ Archived content is read-only.   |
|                 | **Delete** | ✅ Own drafts.             | ❌ Cannot delete published content.| ❌ Cannot delete archived content.  |
| **Coordinator** | **View**   | ✅ Any draft.              | ✅ Any published content.          | ✅ Any archived content.            |
|                 | **Create** | ✅ Any draft.              | -                                 | -                                  |
|                 | **Update** | ✅ Any draft.              | ❌ Published content is read-only. | ❌ Archived content is read-only.   |
|                 | **Delete** | ✅ Any draft.              | ❌ Cannot delete published content.| ✅ Any archived content.            |

Nobody edits published or archived content in place: it is retracted (or restored) to a draft
first.

---

## Role-Based Advanced Actions in Each State

| **Role**        | **Action**  | **Draft**                                                           | **Published**                                          | **Archived**                                          |
|-----------------|-------------|---------------------------------------------------------------------|--------------------------------------------------------|-------------------------------------------------------|
| **Contributor** | **Publish** | ❌ Do not have permission to publish drafts.                         | - Publishing does not apply to published content.      | - Publishing does not apply to archived content.      | 
|                 | **Retract** | - Retracting does not apply to drafts.                              | ❌ Do not have permission to retract published content. | - Retracting does not apply to archived content.      |
|                 | **Archive** | - Archiving does not apply to drafts.                               | ❌ Do not have permission to archive published content. | - Archiving does not apply to archived content.       |
|                 | **Restore** | - Restoring does not apply to drafts.                               | - Restoring does not apply to published content.       | ❌ Do not have permission to restore archived content. |
| **Creator**     | **Publish** | ✅ Can publish own drafts.                                           | - Publishing does not apply to published content.      | - Publishing does not apply to archived content.      |
|                 | **Retract** | - Retracting does not apply to drafts.                              | ✅ Can retract own published content.                   | - Retracting does not apply to archived content.      |
|                 | **Archive** | - Archiving does not apply to drafts.                               | ✅ Can archive own published content.                   | - Archiving does not apply to archived content.       |
|                 | **Restore** | - Restoring does not apply to drafts.                               | - Restoring does not apply to published content.       | ❌ Do not have permission to restore archived content. |
| **Coordinator** | **Publish** | ✅ Can publish any draft.                                            | - Publishing does not apply to published content.      | - Publishing does not apply to archived content.      |
|                 | **Retract** | - Retracting does not apply to drafts.                              | ✅ Can retract any published content.                   | - Retracting does not apply to archived content.      |
|                 | **Archive** | - Archiving does not apply to drafts.                               | ✅ Can archive any published content.                   | - Archiving does not apply to archived content.       |
|                 | **Restore** | - Restoring does not apply to drafts.                               | - Restoring does not apply to published content.       | ✅ Can restore any archived content.                   |

---


## State with Actions

**Draft**: Can be viewed, created, updated, deleted and published.

**Published**: Can be viewed, retracted and archived. It is not edited in place.

**Archived**: Can be viewed, deleted (Coordinator) and restored (Coordinator). It is not edited in place.

---

## Publish Gating: Review Requirement

Publishing a draft is additionally gated by the review policy. Role levels are inverted
(lower number = higher authority). A draft cannot move `Draft → Published` while **every**
author's role is outside the approver level — i.e. `level > APPROVER_ROLE_LEVEL` (with
`APPROVER_ROLE_LEVEL = 1` = Coordinator, that means Creator and Contributor) — **and** no
**approving review** exists (a `Review` from a reviewer with `level <= APPROVER_ROLE_LEVEL`,
currently only Coordinator). If any author is at the approver level (`level <=
APPROVER_ROLE_LEVEL`, e.g. a Coordinator co-author on a multi-author article), no review is
required. Single-author content has one author, so the rule reduces to that author's role.

- A Creator may submit a review (the `review` permission), but it is a **pre-review** that
  helps the Coordinator; it does not satisfy the requirement. A Coordinator review still
  has the final say.
- A Coordinator publishing their own draft needs no review (it is at the approver level).

The requirement is enforced both in the detail loaders (disabling the publish button, via
`needsReviewToPublish`) and in the `publish-*` actions (server-side guard). See
`app/utils/permissions/author/review-policy.ts` and
[_author-roles-and-permissions.md](./_author-roles-and-permissions.md).

---

## Decided for the redesign (not implemented yet)

Decided on 28 Sep 2026 in the design project (`07 Stavy a akce obsahu`, questions `dj753f0j`
and `gbsczekj`, see [_design-project.md](./_design-project.md)). Everything above still
describes today's code; this is the target.

- **Submitted for approval is a flag, not a state.** `ContentState` stays
  `draft` · `published` · `archived`. The author submits a finished draft
  (**Odeslat ke schválení**), which sets `submittedAt`. The UI shows it as
  *Čeká na schválení*; a submitted draft with an approving review shows as *Schváleno*.
- **Approving and publishing are two steps, both Coordinator-only.** On a submitted draft the
  Coordinator either **approves** it (stays off the web, recorded as a `Review`) or **approves
  and publishes** it in one step. An approved draft then has **Publikovat**. A Coordinator may
  still publish a draft that was never submitted.
- **Approving first exists for ordering on the web.** The web sorts by `publishedAt`
  (descending) and an edition's order comes from it (#243), so the Coordinator approves texts
  as they come and publishes them later, in the order they should stand.
- **Taking back wipes the approval.** The author's **Vzít zpět** and the Coordinator's
  **Vrátit k úpravám** return the item to an unsubmitted draft and delete its reviews.
  A Coordinator's own small fix of an approved text keeps the approval.
- **Bulk publish gives every item its own time**, in the order the confirmation dialog shows
  (top = newest): the top item gets the moment of confirmation, each next one second earlier.
- **Changing the publish date takes a time as well** (Coordinator only, never in the future),
  so a forgotten article can be placed between two already published ones.
- **Creators neither approve nor publish** — not even their own content. Their `review`
  permission on others' drafts goes away.
