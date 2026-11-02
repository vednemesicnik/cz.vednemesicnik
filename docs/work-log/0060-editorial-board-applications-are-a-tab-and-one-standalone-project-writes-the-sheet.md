# 0060. Editorial-board applications are a tab, and one standalone project writes the sheet

- Date: 2026-11-02
- Issues: #385, #386

## Context

The epic for self-service membership of the editorial board needs a lifecycle that the `Aktivní`
checkbox on `Kontakty` cannot express, and applications that do not sit in the directory of people
who are in the editorial board.

The epic's first version put the writes into the bound `SCRIPT__Editorial_Board__Contacts`. Its second
split them out, because editors of the sheet reach a bound project's code and script properties. Log
0059 then moved Contacts out of the sheet, which removed that reason, so one project against two was
weighed again.

## Outcome

Applications are a tab of the same spreadsheet, `Přihlášky`, and `Kontakty` gets a `Stav` beside
`Aktivní`. `SCRIPT__Editorial_Board__Membership`, standalone under the web's app account, is the only
project that writes to the spreadsheet, the edit trigger with the sort included.
`SCRIPT__Editorial_Board__Contacts` answers only the read, with the same address and secret.

The reasons for two projects are that writing code is released again and again while a public page
depends on the read, that the read sends nothing while the writes send to outside addresses (log
0037), and that one `doPost` would have to carry a plain secret and a signed envelope.

`Stav` claims no reason, and the web goes by `Aktivní` alone. An empty `Poslední potvrzení` means none
on record, so the backfill leaves it empty: a run date would claim a confirmation nobody made.

## What follows

- What the split does not do: the caller and the account are the same, and "the only project that
  writes" is a convention in code that Google does not enforce. A bug that unticks everyone still
  reaches the web, because the read answers `ok: true` with empty members and overwrites the snapshot.
  So `setupSpreadsheet()` compares the number of ticked members before and after, and a version is
  named before its first run.
- A standalone project takes `LockService.getScriptLock()`, because `getDocumentLock()` returns `null`
  there. No lock spans projects, which is one more reason for a single writer. The writes in #388 share
  the lock with the trigger.
- The trigger takes no row number from the edit event and puts `Stav` right across the sheet on every
  edit of `Kontakty`. It writes the date only when the edit's columns include `Aktivní`, and only on a
  row that has just become `V redakci`. So a `Stav` changed by hand on a ticked row goes back with no
  date, because a date there would keep the person out of a later re-confirmation for a confirmation
  nobody made. The issue's rule that an edit wholly in `Aktivní` refreshes the date of its rows was
  dropped: after a concurrent sort it could stamp somebody else's row. Quickly unticking and ticking a
  row can leave the date as it was, and nothing was confirmed by that.
- The old trigger is deleted before the setup runs on the spreadsheet in use, because its sort could
  move rows under the backfill and no lock spans two projects.
- The spreadsheet's structure is described in `docs/_editorial-board-google-sheet.md`, and the scripts
  around it in `docs/_apps-script-web-apps.md`.

## Turned down

- **One project for the read and the writes.** Its cost is the reasons above. It would save a
  repository, a release path and a few repeated column labels.
- **Everything in Contacts now, split at #388.** That only postpones moving the trigger and does it
  twice.
- **`spreadsheets.readonly` on Contacts.** The documentation of `SpreadsheetApp.openById` lists only the
  full scope, so it would be an experiment on what a public page reads. The project runs no code that
  writes and nobody else can run it.
- **Applications in their own spreadsheet.** The same people read both tabs, the `Role` list is needed on
  both, and a transfer inside one file cannot stop halfway between two files.
- **Building a spreadsheet from scratch in the new project.** There is one, and it recovers from its
  version history; the old code stays in git.
