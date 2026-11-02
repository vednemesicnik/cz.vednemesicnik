# 0060. Editorial-board applications are a tab, one standalone project writes the sheet, and `Stav` is what the web shows

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

Applications are a tab of the same spreadsheet, `Přihlášky`. On `Kontakty` a `Stav` column replaces the
`Aktivní` checkbox: the web shows a person whose `Stav` is `V redakci`.
`SCRIPT__Editorial_Board__Membership`, standalone under the web's app account, is the only project that
writes to the spreadsheet. `SCRIPT__Editorial_Board__Contacts` answers only the read, with the same address
and secret.

The reasons for two projects are that writing code is released again and again while a public page
depends on the read, that the read sends nothing while the writes send to outside addresses (log
0037), and that one `doPost` would have to carry a plain secret and a signed envelope.

The reason for one flag: a checkbox beside a `Stav` stores one fact twice. A trigger had to keep the two in
step, and it healed towards publication, because a ticked box won. So a departure that died half-way could
leave a person on the web, and a `Stav` picked by hand went back. With one column any mismatch hides the
person, and a departure is one value.

`Stav` claims no reason. An empty `Poslední potvrzení` means none on record, so the backfill leaves it
empty: a run date would claim a confirmation nobody made.

## What follows

- What the split does not do: the caller and the account are the same, and "the only project that
  writes" is a convention in code that Google does not enforce. So a version is named before the setup's
  first run, and the read answers `server_error` when people are on the sheet and nobody is published. An
  exact match fails closed, and a renamed value would otherwise overwrite the app's snapshot with an empty
  board.
- A standalone project takes `LockService.getScriptLock()`, because `getDocumentLock()` returns `null`
  there. No lock spans projects, which is one more reason for a single writer. The writes in #388 share
  the lock with the trigger.
- Rows no longer move on an edit: `Kontakty` is sorted by name only, by a nightly job (#391), and not by
  the acceptance flow either, because an edit waiting for the lock would then write to the neighbour. So the
  trigger can trust the event's row. It acts on one changed `Stav` cell, writing the date when the cell
  becomes `V redakci`.
- A paste or a fill across rows writes no date, because Google gives no old value for a range. That costs at
  most one extra question in September; a date nobody earned would skip someone for a year.
- When the trigger does not run, the web is still right, so correctness does not rest on it. Google documents
  that users of a standalone script need view access to the script file for triggers to run properly. New
  projects here are readable by anyone in the domain with the link, and the sheet cannot be shared outside
  the domain, so every editor has that access: on a copy, an edit from a domain account that had never opened
  the project fired the trigger. So the project stays readable by the domain, not "shared with nobody" as log
  0059 has it, and no secret goes in code. Script Properties did not show for a reader, on one look.
- The move has an order, in that project's README: the old trigger goes before the setup, because its sort
  could move rows under the backfill. `Aktivní` is deleted by hand only after the read has moved and the
  response has matched, because until then it is the way back.
- A hand change of one `Stav` cell clears `Dotaz odeslán`, and the ladder of #392 acts only on `V redakci`,
  so nobody set out by hand is mailed or removed.
- The spreadsheet's structure is described in `docs/_editorial-board-google-sheet.md`, and the scripts
  around it in `docs/_apps-script-web-apps.md`.

## Turned down

- **`Aktivní` as the published flag with a synchronised `Stav`.** This was built first and tried on a copy.
  It kept the read unchanged and one click for the chief editors, but see the reason above. Nobody has
  tried the dropdown with the chief editors, so that is the first thing to check if this comes back. A real
  need for "in the editorial board, not on the web" would call for two independent columns, not this.
- **A hidden helper column for sorting active people first.** Nobody needs that order.
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
