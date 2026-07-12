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

| **Role**        | **Action** | **Draft**                | **Published**                       | **Archived**                      |
|-----------------|------------|--------------------------|-------------------------------------|-----------------------------------|
| **Contributor** | **View**   | ✅ Can view own drafts.   | ❌ Cannot view published content.    | ❌ Cannot view archived content.   |
|                 | **Create** | ✅ Can create own drafts. | ❌ Cannot create published content.  | ❌ Cannot create archived content. |
|                 | **Update** | ✅ Can update own drafts. | ❌ Cannot update published content.  | ❌ Cannot update archived content. |
|                 | **Delete** | ✅ Can delete own drafts. | ❌ Cannot delete published content.  | ❌ Cannot delete archived content. |
| **Creator**     | **View**   | ✅ Can view own drafts.   | ✅ Can view own published content.   | ❌ Cannot view archived content.   |
|                 | **Create** | ✅ Can create own drafts. | ❌ Cannot create published content.  | ❌ Cannot create archived content. |
|                 | **Update** | ✅ Can update own drafts. | ✅ Can update own published content. | ❌ Cannot update archived content. |
|                 | **Delete** | ✅ Can delete own drafts. | ❌ Cannot delete published content.  | ❌ Cannot delete archived content. |
| **Coordinator** | **View**   | ✅ Can view any draft.    | ✅ Can view any published content.   | ✅ Can view any archived content.  |
|                 | **Create** | ✅ Can create any draft.  | ✅ Can create any published content. | ❌ Cannot create archived content. |
|                 | **Update** | ✅ Can update any draft.  | ✅ Can update any published content. | ✅ Can update archived content.    |
|                 | **Delete** | ✅ Can delete any draft.  | ❌ Cannot delete published content.  | ✅ Can delete archived content.    |

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

**Published**: Can be viewed, updated, retracted, archived.

**Archived**: Can be viewed, updated, deleted and restored.

---

## Publish Gating: Review Requirement

Publishing a draft is additionally gated by the review policy. A draft cannot move
`Draft → Published` while **every** author's role is below the approver level
(`APPROVER_ROLE_LEVEL`, currently level 1 = Coordinator — so Contributor and Creator are
below it) **and** no **approving review** exists — a `Review` from a reviewer whose role is
at the approver level (currently only Coordinator). If any author is at the approver level
(e.g. a Coordinator co-author on a multi-author article), no review is required.
Single-author content has one author, so the rule reduces to that author's role.

- A Creator may submit a review (the `review` permission), but it is a **pre-review** that
  helps the Coordinator; it does not satisfy the requirement. A Coordinator review still
  has the final say.
- A Coordinator publishing their own draft needs no review (it is at the approver level).

The requirement is enforced both in the detail loaders (disabling the publish button, via
`needsReviewToPublish`) and in the `publish-*` actions (server-side guard). See
`app/utils/permissions/author/review-policy.ts` and
[_author-roles-and-permissions.md](./_author-roles-and-permissions.md).
