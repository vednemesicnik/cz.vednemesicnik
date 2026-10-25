# 0032. A new archive issue is a draft with the next free number, and its number saves as one

- Date: 2026-10-20
- Issues: #717, #719
- Later: 0034

## Context

Design 26c and 26d replace the archive's add and edit forms with an editor, drawn the same way
as the article's. *Nové číslo* creates a draft and opens it (r1lh527v). The fields save as they
change (24e) under the edit hold (24g), and an empty draft disappears again. The year and the
order are prefilled: the year with this one, the order with the next free one in that year. A
taken year, order and supplement is refused at the field, and the other fields stay saved
(qjv38ti4). Design 26e lists the year and the order among what a draft may still lack when it
is submitted („Chybí rok, pořadí v roce, obálka a PDF.“).

[0019](0019-the-edit-lock-lives-on-the-content-row.md) to
[0023](0023-a-lost-edit-hold-turns-the-editor-read-only.md) built the hold, the empty draft and
autosave for the article and left the issue to its own redesign.
[0030](0030-an-archive-issue-is-year-order-and-supplement-and-its-title-is-computed.md) made the
issue its year, order and supplement, with the unique key `year + order + supplementSlug`, and
stored both as required columns.

## Outcome

- **The issue adopts 0019–0023.** `Issue` has the hold columns and `firstContentAt`. It uses
  `createEditHoldHandlers`, a `save` route of the article's shape and the shared hold dialogs.
- ***Nové číslo* stores this year and the next free order at creation.** The next free order is
  the year's highest main-issue order plus one. Empty drafts are deleted first, so they don't
  hold a number: one whose hold expired, and one never held for as long as a hold lasts (a
  double click, an abandoned redirect), unlike the article's day. A save that meets an empty
  draft holding its number sweeps too, never the issue being saved.
- **The first save or upload ends the empty draft.** Autosave sends only after the editor
  touched the form, so any save is content. Until then the draft is in no list, count or
  preview, and it is deleted when its hold is released.
- **A draft may lack its year and order.** Both columns are nullable. Submitting and publishing
  require them (26e, #718). A title that can't be put together says what is missing.
- **The year, order and supplement save as one.** If one of them can't be read, or another
  issue has the number, the stored three stay and the rest of the form saves. The answer names
  the issue that has the number and, for a main issue, a free order.
- **The routes keep their names.** `add-issue` is the POST that creates the draft, and
  `edit-issue` is the editor, not the drawn `…/edit`. They follow the same scheme as the
  article's routes.

## What follows

- 0030 still holds: the unique key, the computed title, `supplementSlug` as `""` for a main
  issue (never `NULL`), and the PDF naming. Only its year and order may be empty in a draft.
  NULLs don't collide in SQLite's unique index, so the key guards only issues with both. A draft
  without a number holds none, and submitting requires both (26e).
- The pattern is the article's: the draft created on click of
  [0020](0020-a-new-article-is-a-draft-created-on-click.md), and the part left out while the rest
  saves of [0022](0022-a-document-autosaves-its-whole-form-from-the-holding-tab.md).
- Code that reads `year` or `order` handles `null`: the title helpers name what is missing, and
  the PDF is renamed only with a full number. Until #718, a draft without a year can still be
  published, so the next release waits for #718.
- The closing sentence „Změna roku / pořadí / doplňku se neuložila.“ names the field the editor
  changed last. Only the editor knows which field that is; the server returns the taken number.
- Uploads (#711) also set `firstContentAt`, because a draft with a file is not empty.
- Revisit this entry if an issue's number has to save field by field, for example once a
  supplement links to its main issue.
- The lifecycle is described in [_content-creation-lifecycle.md](../_content-creation-lifecycle.md).

## Turned down

- **Prefill only in the form.** An untouched prefill would never save. Saving it at once would
  end the empty draft before the editor did anything.
- **Store no number at creation.** The draft would open without the prefill 26c draws, and the
  next free order would have to be computed again on every open.
- **Save the year, order and supplement field by field.** A half-changed number can collide, or
  name an issue that does not exist.
- **Keep the year and order required.** The draft would refuse a cleared field, which 0022
  rules out, and 26e checks them at submit.
