# 0026. The association is the Owner's author, and only the Coordinator adds it to an article

- Date: 2026-10-16
- Issues: #674, #667

## Context

Design 24j (answers `1pdzkd57` and `mto4s7s7`) lets the Coordinator pick any authors for an
article, *Vedneměsíčník, z. s.* included. Signing a text as the association is an editorial
decision, so the association is offered to nobody else, and "the check holds on the server
too". Contributors and Creators keep their own row and add or remove co-authors.

The schema has no flag for the association. The seed creates it as the Owner's account
(`prisma/data/users.ts`), and 24j notes that "today it is the author of the Owner's account".
There is exactly one Owner ([0003](0003-exactly-one-owner.md)).

## Outcome

- **The association is the author of the Owner's account**, named in one place:
  `ASSOCIATION_AUTHOR_WHERE` (`app/utils/association-author-where.ts`).
- **Only the Coordinator adds it to an article.** A save from anyone else that adds the
  association to the stored authors is refused with 403. The check compares the authors the
  save sends with the **stored** ones ([0015](0015-edits-check-the-stored-record-not-the-form.md),
  in the spirit of [0025](0025-a-save-removes-a-link-only-when-the-editor-sends-it-as-removed.md)),
  so an association the Coordinator added stays on a co-author's save. Who is the Coordinator
  is `canChooseRecordAuthor`, the role level of [0005](0005-review-gate-keys-off-role-level.md).
- Removing the association is not guarded beyond the general rules: any author who may edit
  the article may remove a co-author, and the association is one.

## What follows

- `updateArticle` (`app/routes/administration/articles/article/edit-article/utils/update-article.server.ts`)
  holds the check, and the editor offers the association only to the Coordinator.
- Any other picker that offers authors (category and tag authors, the issue and episode editors
  of 26c and 27d) uses `ASSOCIATION_AUTHOR_WHERE` and the same rule when it is rebuilt.
- Revisit when the association gets an author of its own without an account, or when the
  Owner's account stops being the association's: then the schema needs a flag, and the `where`
  changes in one place.
- The editor and its authors are described in
  [_content-creation-lifecycle.md](../_content-creation-lifecycle.md).

## Turned down

- **An `isAssociation` column on `Author`.** Turned down for now: it needs a migration and a
  seed change for a fact the single Owner already carries, and two places could then disagree.
- **Refusing every save whose authors include the association, unless from the Coordinator.**
  Turned down: a Creator co-authoring with the association could never save the text again.
- **Guarding the association's removal too.** The design says nothing about it; asked of
  design separately if it should be.
