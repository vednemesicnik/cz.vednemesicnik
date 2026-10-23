# 0031. An archive issue is published without choosing a date

- Date: 2026-10-20
- Issues: #716, #719, PR #731

## Context

An article's *Publikovat…* and *Schválit a publikovat…* open a dialog that picks the publish
date (*Dnes*, *Původní datum*, *Jiný den*), because the website orders articles by
`publishedAt` and the Coordinator publishes an edition's texts in the order they should stand
(0006, 0013, design 07d). Design 26e asks the same of an archive issue: „Schválit a
publikovat… a u schváleného Publikovat… jsou jako u článku (23b)“.

The archive does not order by date. Since 0030 an issue is its year, order and supplement, and
both the public `/archive` and the administration list order by `year desc, order desc,
supplementSlug asc`. An issue's `publishedAt` orders nothing a reader sees. The issue's
state handlers (`archive/issue/_index/utils/content-state-handlers.server.ts`) never had
`allowBackdating`: publishing keeps the first `publishedAt`, or sets the moment of publishing.

## Outcome

An archive issue's *Publikovat…* and *Schválit a publikovat…* open a confirmation without a
date (`archive/issue/_index/components/issue-state-dialog`). The server sets `publishedAt` as it
does today, and the issue has no *Změnit datum publikace…*.

## What follows

- `publishedAt` on an issue is a record of when it went public: the detail's fact line and the
  history show it, and nothing orders by it. A later change that orders issues by it has to
  revisit this record first.
- The editor (#717), the submit checks (#718) and any bulk publish of issues keep the dialog
  without a date. `getIssueHeaderActions` passes `canChangePublishedAt: false`.
- The dialog's sentence „Číslo bude publikováno v archivu na webu.“ (copy 5k0gp8ve) holds only
  while an issue without both its cover and its PDF can't be published (26e, #718).
- Design 26e's „jako u článku“ is met in everything but the date; the difference goes to the
  design project with `/ask-design tidy`.

## Turned down

- **The article's dialog with the date fieldset.** It would let the Coordinator set a date that
  changes nothing on the web, and backdating needs a server path (`allowBackdating`) that would
  exist only to fill the history.
- **Publishing at once, without a dialog.** Turned down because 07c gives a dialog to every
  action that changes what readers see.
