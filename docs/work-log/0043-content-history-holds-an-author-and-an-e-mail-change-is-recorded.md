# 0043. Content history holds an author like an approval, and an e-mail change is recorded without an address

- Date: 2026-10-25
- Issues: #810

## Context

The delete guard from #767 (`app/utils/author-references/get-author-delete-block.ts`) held an
author by its content, its approvals and its account. Content history was missing from that
list. `ContentLog.actor` is `onDelete: SetNull`, so deleting an author would blank its name
from every Historie line it stood on. Approvals hold an author only until the content goes
back to draft, when they are cleared. A member who left, whose account was deleted and whose
bylines were reassigned, could be deleted, and their name would vanish from the history of
other people's work. 07f says Historie has names because the log records them.

An administrator's change of an account's sign-in e-mail redirects where sign-in links go. It
left no record: only a best-effort notice to the old address (#770), and after the save the
app no longer knows that address.

While planning, one premise turned out false: that deleting content leaves its history rows
behind. Every content delete and both empty-draft sweeps call `deleteContentLog`, as they
have since history was added (#608).

## Outcome

- **An author who is the actor of any `ContentLog` row cannot be deleted.** It is counted
  as `_count.contentLogs` in `AUTHOR_REFERENCES_SELECT`, through the existing
  `Author.contentLogs` relation. A deleted content takes its history with it, so these rows
  are the history of content that exists.
- **The 28g dialog gives approvals and history one sentence** (copy 2zn4atua). Only *Zavřít*;
  neither record can be changed or removed.
- **Who stays deletable:** a guest without an account or a duplicate author. Neither ever
  signed in, so neither appears in history. Deleting an author exists to undo those mistakes.
- **An e-mail change writes `user_email_changed`** with actor, target and time and **no
  address**. AuditLog outlives the account, so an address in it would stay after the person
  has left. 28e Historie shows it as *Přihlašovací e-mail změněn · {jméno}*.

## What follows

- A history row left behind by a failed `deleteContentLog` (logged, never thrown) would still
  hold its author. Cleaning those rows up is a separate job, if it is ever needed.
- A new kind of record that names an author through a `SetNull` link raises the same
  question as history: does the delete guard count it?
- A new audit event that would carry personal data gets the same treatment: record who
  acted on which account, and leave the data out.
- See `docs/_audit-logging.md`.

## Turned down

- **Counting history only for content that still exists, per entity type.** `ContentLog`
  names its content by `entity` + `entityId` with no relation, so the check would need one
  query per type. It is unnecessary, because a content delete already removes its history.
- **An `author_deleted` audit event.** A deletable author stands on nothing, no screen would
  read the row, and the only argument was symmetry with `user_deleted`.
- **Keeping the old and new addresses in the e-mail record.** Turned down for the
  personal-data reason above; who changed it and when is what the reader of 28e needs.
