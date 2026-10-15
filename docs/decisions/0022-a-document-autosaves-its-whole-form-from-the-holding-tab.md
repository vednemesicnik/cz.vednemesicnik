# 0022. A Document autosaves its whole form from the holding tab, one save at a time

- Status: Accepted
- Date: 2026-10-15
- Issues: #670, #667

## Context

The article editor is the first *Dokument* (guideline *Ukládání a potvrzení*, design 24e). It
saves by itself, about a second after typing, at once on leaving a field and on the save
shortcut. One line under the heading says where it stands, and there is no dialog of its own
when leaving. The issue (26c) and episode (27d) editors will follow the same pattern.

The edit hold (decisions [0019](0019-the-edit-lock-lives-on-the-content-row.md) and
[0021](0021-an-edit-hold-belongs-to-a-page-load-and-never-moves-updated-at.md)) already says who
may save. Five more things had to be settled:

- what one save carries;
- what happens to saves that overlap;
- what a save retried after a dropped connection does when the first attempt had landed;
- what a save does to the hold;
- how the last keystrokes reach the server when the page goes away. A normal request dies with
  the page, and a separate hold release can arrive before the save it should follow.

## Decision

- **A save sends the whole form**, not a diff, to an action-only route that answers JSON. The
  route takes it only from the tab holding the edit, checked in the save's own conditional
  write (0019). A draft saves incomplete. The schema refuses nothing a draft may lack, and
  completeness is checked on submit and publish (23h).
- **One save is on its way at a time.** Changes made meanwhile go with the next save. The
  editor marks a change only after the person has touched the form, so the form reading empty
  while it waits for the hold is no change.
- **A repeated save is harmless.** Anything a save creates carries an id made in the browser
  (an article's new image is a cuid2). The server stores an id once and refuses an id that
  belongs to another record. A file goes out until a save confirms it, and then not again.
- **A save keeps the hold.** Only the save sent while the page goes away also ends it. That
  save goes out as one `keepalive` request instead of the plain release, so the two cannot
  race. Without a save waiting, the release goes as before.
- **A part that cannot save is left out, and the rest saves.** For the article this is a taken
  address (24d): the old address stays, and the answer offers a free one.
- **Leaving sends what waits first.** The browser's own dialog asks only when the changes
  cannot go out: offline, after a refused save, or when what waits is too big for `keepalive`
  (a file, or over about 60 KB). A navigation inside the app in that state becomes a full page
  load, so the same dialog asks. The editor has no leave dialog of its own.

The client side is `app/hooks/use-autosave.ts`, the article's route is
`app/routes/administration/articles/article/save-article/`.

## Consequences

- The issue and episode editors use `useAutosave` and a save route of the same shape, with
  their own ids for what a save creates.
- `updatedAt` moves with every save, as 0021 expects, and the save line reads it. The editor
  hands each save's `updatedAt` to `useEditHold` (`acknowledgeSave`), so taking the hold back
  after an expiry compares against this tab's own last save (24i).
- Every save is announced, so lists and details that show the article revalidate about once a
  second while someone types. Revisit this if that becomes a load problem.
- The per-image saves of #673 replace the gallery part of the whole-form save. The browser-made
  ids carry over.
- The lifecycle is described in [_content-creation-lifecycle.md](../_content-creation-lifecycle.md).

## Alternatives considered

- **Sending only the changed fields.** Smaller requests, but a lost or reordered save would
  leave the server with a mix of states. With one save at a time and the whole form, the last
  save is the state.
- **Server-made image ids returned with the answer.** A retry after a save that landed but
  whose answer was lost would store the image twice.
- **Releasing the hold in its own `keepalive` request next to the leave save.** Both leave at
  once. If the release lands first, the save is refused, because its tab no longer holds the
  edit.
- **An own leave dialog**, as the old editor had. The design drops it (24e): leaving loses
  nothing that could still go out.
