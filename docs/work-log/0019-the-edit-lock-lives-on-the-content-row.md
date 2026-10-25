# 0019. The edit lock lives on the content row, and the article has it first

- Date: 2026-10-15
- Issues: #667

## Context

The design makes the article editor a *Dokument* (design 24, guideline *Ukládání a potvrzení*):
it saves about a second after typing, and only one browser tab edits a draft or a submitted
article at a time (07g, 24g–24i). The lock is renewed about every 30 seconds and expires after
about two minutes without a signal. Only the Coordinator may take it over. While it is held,
the actions that change the state wait. The same pattern is drawn for the archive issue editor
(26c) and the podcast episode editor (27d).

Today there is no lock. `updateArticle` checks the stored article and then writes it, so a
publish or a submission between the two still lets an edit land.
[0015](0015-edits-check-the-stored-record-not-the-form.md) leaves that race to this lock. The
category and tag edits close it with one conditional write whose `where` repeats the stored
state (`app/routes/administration/articles/categories/utils/update-category.server.ts`).

The repository has three shapes for data shared by every content type. Submission is columns
on each model (0013). `Review` is one table with a nullable foreign key per type, each
cascading. `ContentLog` is one table with no foreign key, and its rows are deleted by hand.

## Outcome

The edit lock is columns on the content row: the holding author, the holding tab, when it was
taken and when it expires. A lock is free when it has no holder or its expiry has passed. Time
decides, because a crashed browser never releases it.

Every save checks that it still holds an unexpired lock in the same conditional write that
saves it. Every state transition checks that the record is not held by someone else in the
same way. The logic to take, renew, release and take over the lock is shared and works for any
content type.

The article gets it first, in the editor redesign. The issue and the episode take it in their
own redesigns (26, 27), with their own columns.

## What follows

- The lock is not the submission lock. `isLockedBySubmission` and the docs' "locked for its
  authors" mean a submitted text. The new names say "held by an editor" (for example
  `heldBy…`, `editSession`), never `isLocked…`.
- The state handlers (`app/utils/content-state/create-content-state-handlers.server.ts`) run
  each type's own write, so the "not held by someone else" condition goes into that write, not
  into a check in front of it.
- Expiry sends no event. A lock change that is an act (taken, taken over, released) is a
  content event under [0012](0012-live-events-carry-the-actor-name-to-every-session.md):
  the holder is its actor, and nothing else is added. The line „upravuje …“ comes from the
  loaders, which read the expiry, and the client checks again when the expiry passes.
- History writes one *Upraveno* per lock session and the takeover as its own event (07f). The
  update utilities therefore stop logging every save.
- Deleting a record takes its lock with it. No table holds orphaned locks.
- Revisit this entry if a content type needs more than one holder, or a history of past locks.
  Neither fits on the row.
- The current lifecycle is in [_content-creation-lifecycle.md](../_content-creation-lifecycle.md).

## Turned down

- **One `EditLock` table keyed by entity and id, like `ContentLog`.** Checking the lock and
  writing the record would be two statements and would reopen the race of 0015, unless every
  autosave ran in a transaction. Deleting a record would leave its lock row behind.
- **One table with a foreign key per type, like `Review`.** It cascades, but a save still reads
  one table and writes another.
- **Build the article, issue and episode editors at once.** The pattern is the same, but the
  issue and the episode are separate redesigns with their own fields and files. Building them
  now would be symmetry, not need.
