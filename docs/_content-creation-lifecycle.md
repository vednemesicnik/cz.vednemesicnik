# Content Creation Lifecycle with Roles, Actions, and States

This guide outlines the lifecycle of content items with actions (e.g., create, update, delete, publish, unpublish, archive, restore) and states (`Draft`, `Published`, `Archived`) based on role permissions.

---

## Content States

- **Draft**: Content is in progress and not visible to the public.
- **Published**: Content is finalized and visible to the public.
- **Archived**: Content is no longer active but is stored for reference.

---

## Lifecycle Overview

```plaintext
Draft → Published → Archived → (back to Draft if Restored)
                  ↘ (back to Draft if Unpublished)
```

---

## Role-Based Actions in Each State

| **Role**        | **Action**    | **Draft**                                                           | **Published**                                                        | **Archived**                                                             |
|-----------------|---------------|---------------------------------------------------------------------|----------------------------------------------------------------------|--------------------------------------------------------------------------|
| **Contributor** | **Create**    | ✅ Can create new drafts.                                            | ❌ Cannot directly create published content; must start with a draft. | ❌ Cannot create archived content; archiving happens post-publication.    |
|                 | **Update**    | ✅ Can update their drafts.                                          | ❌ Cannot update published content; insufficient permissions.         | ❌ Cannot update archived content; archived content is locked for edits.  |
|                 | **Delete**    | ✅ Can delete their drafts.                                          | ❌ Published content cannot be deleted directly.                      | ❌ Cannot delete archived content; requires elevated permissions.         |
|                 | **Publish**   | ❌ Cannot publish content; insufficient permissions.                 | ❌ Content must be unpublished first before changes can be made.      | ❌ Archived content cannot be published.                                  |
|                 | **Unpublish** | ❌ Unpublishing does not apply to drafts.                            | ❌ Cannot unpublish content; insufficient permissions.                | ❌ Archived content cannot be unpublished; it must first be restored.     |
|                 | **Archive**   | ❌ Drafts cannot be archived; they are unpublished by default.       | ❌ Cannot archive published content; insufficient permissions.        | ❌ Content is already archived.                                           |
|                 | **Restore**   | ❌ Drafts cannot be restored; they are already in the initial state. | ❌ Published content cannot be restored; it is already active.        | ❌ Cannot restore archived content; insufficient permissions.             |
| **Author**      | **Create**    | ✅ Can create new drafts.                                            | ❌ Cannot directly create published content; must start with a draft. | ❌ Cannot create archived content; archiving happens post-publication.    |
|                 | **Update**    | ✅ Can update their drafts.                                          | ✅ Can update their published content.                                | ❌ Cannot update archived content; archived content is locked for edits.  |
|                 | **Delete**    | ✅ Can delete their drafts.                                          | ❌ Published content cannot be deleted directly.                      | ❌ Cannot delete archived content; requires elevated permissions.         |
|                 | **Publish**   | ✅ Can publish their drafts.                                         | ❌ Published content is already live.                                 | ❌ Archived content cannot be published.                                  |
|                 | **Unpublish** | ❌ Unpublishing does not apply to drafts.                            | ✅ Can unpublish their content, reverting it to draft.                | ❌ Archived content cannot be unpublished; it must first be restored.     |
|                 | **Archive**   | ❌ Drafts cannot be archived; they are unpublished by default.       | ✅ Can archive their content once it is published.                    | ❌ Content is already archived.                                           |
|                 | **Restore**   | ❌ Drafts cannot be restored; they are already in the initial state. | ❌ Published content cannot be restored; it is already active.        | ❌ Cannot restore archived content; insufficient permissions.             |
| **Editor**      | **Create**    | ✅ Can create new drafts.                                            | ✅ Can directly create published content.                             | ❌ Cannot create archived content; archiving happens post-publication.    |
|                 | **Update**    | ✅ Can update any draft.                                             | ✅ Can update any published content.                                  | ✅ Can update archived content; editor permissions override restrictions. |
|                 | **Delete**    | ✅ Can delete any draft.                                             | ❌ Published content cannot be deleted directly.                      | ✅ Can delete archived content; elevated permissions allow this action.   |
|                 | **Publish**   | ✅ Can publish any draft.                                            | ❌ Published content is already live.                                 | ❌ Archived content cannot be published.                                  |
|                 | **Unpublish** | ❌ Unpublishing does not apply to drafts.                            | ✅ Can unpublish any content, reverting it to draft.                  | ❌ Archived content cannot be unpublished; it must first be restored.     |
|                 | **Archive**   | ❌ Drafts cannot be archived; they are unpublished by default.       | ✅ Can archive any published content.                                 | ❌ Content is already archived.                                           |
|                 | **Restore**   | ❌ Drafts cannot be restored; they are already in the initial state. | ❌ Published content cannot be restored; it is already active.        | ✅ Can restore archived content to draft.                                 |

---

## Lifecycle Flow with Actions

```plaintext
Draft (Create, Update, Publish, Delete)
    ↘ (to Published if published)
    ↖ (back to Draft if unpublished)
Published (Update, Unpublish, Archive)
    ↘ (to Archived if archived)
Archived (Restore, Update, Delete [Editor only])
    ↘ (back to Draft if restored)
```
