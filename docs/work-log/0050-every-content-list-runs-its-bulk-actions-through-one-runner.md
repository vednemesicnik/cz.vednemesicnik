# 0050. Every content list runs its bulk actions through one runner over the state handlers

- Date: 2026-10-29
- Issues: #772

## Context

Only the article list had the 22c selection bar: *Publikovat…*, *Archivovat…* and *Smazat…*,
run by `run-bulk-article-action.server.ts`. The other five content lists (categories, tags,
issues, podcasts, the episodes of a podcast) could only bulk delete, and ticked only rows the
signed-in author could delete. Nobody deletes published content, so a selection of published
issues could do nothing. Design ji6n8th3 gave every list the 22c bar, with *Stáhnout
z publikace…* and *Obnovit jako koncept…* added. Each of the six entities already had publish,
retract, archive, restore and delete in its `content-state-handlers.server.ts`.

## Outcome

- **One runner, one adapter per list.** `runBulkContentAction`
  (`app/utils/bulk-action/`) loads the selected rows, derives each row's bulk actions from fresh
  permission flags through the list's own row actions, skips a row held by someone else (any
  hold for a delete, [0036](0036-a-delete-waits-for-every-open-editor.md)), and calls the
  entity's handler. A row that changed, is held, or turns out incomplete is skipped and counted,
  never partly applied. The adapter names the entity, its handlers, how its rows load, its row
  actions and how it dates a publish.
- **The bulk actions follow the row (07c).** `getBulkActions` takes any list's row actions:
  publish (the Coordinator's only, approving a pending row), retract, archive, restore, delete.
  No state has more than two, so the bar never needs „⋯“.
- **A bulk publish orders by entity.** Articles keep the dialog's drag order and date choice
  (22c). Episodes will go by number with the date choice (27b). Podcasts go in list order
  (27a), and categories, tags and issues need no order. A record published before keeps its
  date (fge4es3p).
- **The server's moment is not a backdate.** `publish` takes `orderedAt` beside `publishedAt`.
  `publishedAt` is the user's chosen day, honoured only where the entity allows backdating and
  only for an approver. `orderedAt` is the moment the runner picked to keep the order, a second
  apart; it applies only to content never published, so the podcast, which has no publish-date
  UI, can be spaced without opening backdating.
- **The words are the list's.** `BulkNoun` (`app/config/bulk-noun-config.ts`) holds each list's
  forms: the count as subject and as object („1 epizodu právě někdo upravuje“), the bar's
  all-held and all-incomplete sentences, the publish dialog's predicates, the Creator's
  retract sentence and what each action does (copy p256liqr, 0farrwua). The toast, the confirm
  dialog and the bar read them; no list writes its own Czech for the shared parts.

## What follows

- Each remaining list is one PR: its loader gives every row `bulkActions` (replacing
  `deletableIds`), its action reads the form with `readBulkActionForm` and runs its adapter, and
  its noun is added to `bulk-noun-config.ts`. Per-row counts in the taxonomy and podcast dialogs
  (25g, 27a) and the podcast retract toast's second sentence are additions to the noun or the
  dialog, not to the runner.
- The publish dialog is a different root per shape, not a variant: articles keep their ordered
  dialog route-local, the other lists get a plain one, and the episodes one that orders by
  number.
- The lifecycle is described in [_content-creation-lifecycle.md](../_content-creation-lifecycle.md).

## Turned down

- **Folding the bulk dialogs into #732** (one confirm dialog for a single record's state
  change). A bulk dialog carries a count, a list up to five, skip sentences and, publishing, a
  date choice; one record's dialog carries its title. Joining them would hold up both. #732 can
  reuse the bulk dialog's shell once it lands.
- **Turning on backdating for podcasts** to space a bulk publish. It would accept a client date
  on a per-item publish that has no date choice.
