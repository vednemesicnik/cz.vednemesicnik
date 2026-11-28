# 0097. Publikace keys every row by a CUID

- Date: 2026-11-28
- Issues: #1125, vednemesicnik/SCRIPT__Publication__Article_Comments#9

## Context

Every Publikace table numbered its rows with `id INTEGER PRIMARY KEY` (1, 2, 3, …), and those
numbers reached the addresses behind the sign-in (`/issues/{name}/articles/{id}`,
`/review/batches/{id}`) and the payloads of the Apps Script API. They protected nothing on their
own: who may act is decided by the sign-in and the role, and a shared link's pages are reached
by its 12-character key. The owner did not want counted ids all the same, and wanted the same kind
the web gets from Prisma's `cuid()`. Production held no issue yet (28 Nov 2026), so the change
had almost no data to carry.

## Outcome

**A row's id is a CUID**, `id TEXT PRIMARY KEY NOT NULL`, which the app makes with `newRowId()`
(`@paralleldrive/cuid2`, `apps/publikace/app/data/row-id.server.ts`) and passes in every
`INSERT`. A reference is `TEXT`. An id read from an address, a form or a job's payload passes
`isRowId()` (24 characters, `^[a-z][0-9a-z]+$`) or is refused like an unknown one.
`20261211120000_cuid_row_ids` rebuilds every table that has an id or refers to one.

- **A table of one row** (`drive_account`, `proofreaders`, `record_rewrites`) keeps
  `id INTEGER PRIMARY KEY CHECK (id = 1)`: the `1` names the only row and counts nothing.
- **Rows already there get their ids from SQL**: `c` and 23 random hex digits, the same shape,
  because a migration is SQL and SQLite cannot run cuid2. `isRowId()` accepts both.
- **The order of writing is `ORDER BY rowid`**, never the id, since a CUID says nothing about
  when its row was written. The migration copies the rows in their old id order, so the order
  stays. A sort in memory breaks its last tie with `compareIds()` (string order).
- **The Registr's record mark** has an empty `issue_id` instead of `0`.

`apps/publikace/docs/migrations.md` § Writing the SQL holds the convention.

## What follows

The API's ids are strings now. Every script treats them as opaque except Article_Comments,
which sorted article ids by subtraction for the Mailer's key. That fix
(SCRIPT__Publication__Article_Comments#9) is deployed before the release that carries this, so
no job has to change at the deploy. A new table copies the pattern: a CUID id passed by the
app, `TEXT` references, `rowid` for order. A reason to revisit would be a need for an id that
sorts by time, which cuid2 deliberately does not.

## Turned down

- **Ids as a SQL `DEFAULT`** (`'c' || hex(randomblob(…))`, no dependency, no change to the
  inserts): the owner wanted real CUIDs from the library the web already uses, and an `INSERT`
  that forgets the id fails loudly instead of being filled in.
- **Keeping the integers**: an id never guarded anything, so they were safe, but the owner did
  not want ids that count the rows, and changing them while production was empty cost almost
  nothing.
- **A random key beside the integer, used only in addresses**: two ids for one row, and the
  counted one still in every payload.
