# 0034. A new archive issue starts without a number, and the editor offers the next free one

- Status: Accepted
- Date: 2026-10-21

## Context

Decision [0032](0032-a-new-archive-issue-is-a-draft-with-the-next-free-number.md) had
*Nové číslo* store this year and the year's next free order at creation, as design 26c draws
the prefill. A stored prefill is a number nobody confirmed. When it is wrong, it saves and
stays until someone notices it: December's issue created in January gets the new year, and an
older issue entered later gets this year's next order. Leaving the fields empty costs nothing in
safety, because submitting and publishing require the year and the order (26e, #718). It costs
two typed fields in the common case, the next issue of the year.

The product decided on 21 Oct 2026 to keep the convenience without storing anything unconfirmed.
This record replaces 0032 and carries over what of it still holds.

## Decision

- **The issue adopts 0019–0023**, as 0032 had it. `Issue` has the hold columns and
  `firstContentAt`. It uses `createEditHoldHandlers`, a `save` route of the article's shape and
  the shared hold dialogs.
- ***Nové číslo* creates a draft without a year or an order.** Empty drafts are deleted first:
  one whose hold expired, and one never held for as long as a hold lasts (a double click, an
  abandoned redirect).
- **The editor offers the next free number, and a click confirms it.** For an empty number it
  offers this year in Prague and that year's next free order, the highest main-issue order
  plus one (`getIssueNumberSuggestion`). For a typed year it offers that year's next free order,
  and for an order typed alone this year. A supplement gets no offer, because it takes its
  issue's order. The click fills the fields and saves at once. Nothing else fills the number.
- **The first save or upload ends the empty draft.** Autosave sends only after the editor
  touched the form, so any save is content. Until then the draft is in no list, count or
  preview, and it is deleted when its hold is released.
- **A draft may lack its year and order.** Both columns are nullable. Submitting and publishing
  require them (26e, #718). A title that can't be put together says what is missing.
- **The year, order and supplement save as one.** If one of them can't be read, or another
  issue has the number, the stored three stay and the rest of the form saves. The answer names
  the issue that has the number and, for a main issue, a free order (26d).
- **The routes keep their names.** `add-issue` is the POST that creates the draft, and
  `edit-issue` is the editor.

## Consequences

- An empty draft holds no number, so a save no longer sweeps one that holds its number, and
  `deleteStaleEmptyIssueDrafts` has no `excludeId`.
- An order the offer set in the open editor follows a later change of the year, as one set by
  the year did under 0032. A typed order stays, and so does one loaded from an earlier save:
  the editor cannot tell whether it was typed.
- 0030 still holds: the unique key, the computed title, `supplementSlug` as `""` for a main
  issue, and the PDF naming. Its note that the editor's prefill builds on the three columns now
  means the offer. 0033 applies more often: a PDF uploaded to a new issue has no name until the
  number is confirmed.
- This year is the calendar year in Prague, read when the editor loads (0024).
- Design redrew 26c for it (whv8lr2m): the offer stands on a line under the year and the order
  that is always there, with an intro and a *Použít …* button. 26d's *Použít N* for a taken
  number shares that line. The wording is the copywriter's (k5m0j1ag, drawn in exxdkjaq).
- Revisit if issues are ever created in bulk or imported, where the offer cannot be clicked.
- The lifecycle is described in [_content-creation-lifecycle.md](../_content-creation-lifecycle.md).

## Alternatives considered

- **Store the prefill at creation**, as 0032 did. It saves a number nobody confirmed.
- **Prefill only in the form.** An untouched prefill would never save, and the form would look
  filled while the issue has no number.
- **Empty fields without an offer.** Safe, but every issue then needs both fields typed, and the
  next free order has to be looked up by hand.
- **Fill the order as soon as a year is typed.** The same unconfirmed value, one step later.
