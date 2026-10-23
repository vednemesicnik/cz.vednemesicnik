# 0015. Content edits check the stored record, never the form

- Date: 2026-10-14
- Issues: PR #641

## Context

The article, category and tag edits built their permission target from the form. The authors came from `authorIds` / `authorId`, and the state from a hidden `state` field. `withAuthorPermission` then checked `update` against those values.

A Contributor could post their own author id and `state=draft` to another author's article, category or tag, published ones included. That passed the check, so they could edit the record and take it over. The article edit also wrote the form's `state` into the article and its PageSEO, so an edit could move a published article back to draft.

The issue edit was already safe (`app/routes/administration/archive/issue/edit-issue/_action.ts`): it loads the stored issue, checks it, and then checks the newly chosen author.

## Outcome

A content edit checks the `update` permission against the **stored** record: its authors, its state and its submission. It then checks the authors the edit sets, using the stored state. Nothing the form sends decides the permission target. An edit never writes the content state; the state belongs to the state transitions (`content-state-handlers.server.ts`).

## What follows

- Every edit action follows this order: build the permission context, load the stored record, and answer 404 when it is missing or the author may not view it (design 30e, as the detail loaders do). Then check `update` against it, apply the submission lock, and check `update` for the new authors. The issue edit and `updateArticle`, `updateCategory` and `updateTag` after PR #641 follow it, except that the last three still answer 403 for a record the author may not view.
- Edit forms carry no `state` field. A new edit form that needs the state reads it in its loader for display only.
- Still open, deferred on purpose:
  - **The check-to-write race:** a publish or a submission between the check and the write still lets an edit already in flight land. Categories and tags get a conditional write in #640. Articles get the edit lock of the editor redesign (design 24, 07g).
  - **The 403 for a record the author may not view:** categories and tags move to 404 in #640, articles with the editor redesign.
- See `docs/_author-roles-and-permissions.md` and `docs/_content-creation-lifecycle.md`.

## Turned down

- **Keep the hidden `state` field and compare it with the stored one on the server.** Turned down: the target would still start from the form, and a missing comparison in the next edit would reopen the hole.
- **A conditional write as the only guard.** Turned down: it closes the race, not the forged target. It is added on top, as above.
