# 0051. The dashboard is the lists' rows in one queue, and only the Coordinator has a queue

- Date: 2026-10-29
- Issues: #875, PR #876, PR #877

## Context

`/administration` showed stat cards, emoji section tiles and up to five pending items per type
with no actions. Design 21 (1abvbw7k, x24ele6l, gl703egt) replaces it with what concerns the
signed-in person now:

- the Coordinator gets one approval queue across six types, *K publikaci* and their own drafts;
- an author gets *Rozepsané* and *Odeslané*.

The old pending queries let anyone with a higher role see lower roles' submissions, so a Creator
got a queue too. Only the Coordinator approves (gbsczekj).

The row data (permission flags, edit hold, row actions, fact line, dialog fields) was computed
inline in six list loaders. The actions ran inline in three list rows.

## Outcome

- **The dashboard reuses the lists' rows.**
  - Each type has a select and a pure mapper: `ARTICLE_ROW_SELECT` + `getArticleRow`, and so on
    for issue, taxonomy, podcast and episode (#876).
  - Each type's actions run through a hook with its dialogs (#877).
  - The lists and the dashboard call the same functions. A dashboard row is the list row with
    the type in place of the author.
- **Only `roleLevel <= APPROVER_ROLE_LEVEL` gets the queue and *K publikaci*.** *Rozepsané* and
  *Odeslané* add an explicit own condition on top of the permission `where`. Without it the
  Coordinator and the Creator would see others' drafts there.
- **The row action comes from the row, not the section** (`getDashboardRowActions`). The
  section only says which action it promotes. A record someone else edits therefore has no
  *Schválit*.
- **The queue is live as a list (22f, gl703egt).**
  - A change elsewhere reloads the sections and the rows on screen. Each row stays in place with
    its new state; a row taken back stays until the next load.
  - A newly submitted row joins at the end, tinted.
  - The count is what waits now.
- ***Publikovat v pořadí…* opens the article list oldest first** with navigation state
  (`PUBLISH_APPROVED_STATE`). Every approved article on the page is selected and the 22c dialog
  is open, so more than 20 means the oldest 20. The state is cleared at once, so a reload does
  not reopen it.
- **Approved episodes have no list of their own.** *Zobrazit schválené* goes to their podcast's
  page when they all belong to one podcast, and to the podcast list otherwise.

## What follows

- A new content type joins the dashboard with its row select and mapper, its action hook, and an
  entry in `DASHBOARD_TYPES`.
- **The 22f announcement is one hook,** `useLiveChanges` (`app/hooks/`): the tint, „změna …“,
  the hold and one's own change. The article list and the dashboard both call it, as log 0035
  asks. #752 (the 22f row on every list) can use it, with the dashboard's live composition
  (`compose-live-section.ts`) as the pattern for rows that leave a section.

## Turned down

- **Separate dashboard queries per type.** A second copy of the permission and action logic
  would drift from the lists.
- **A row button forced by the section.** It offers *Schválit* on a held record, and the server
  refuses it.
- **Silent revalidation of the queue.** A row approved or taken back elsewhere vanishes and the
  rows under it jump, leaving the neighbour's *Schválit* under the pointer (gl703egt).
