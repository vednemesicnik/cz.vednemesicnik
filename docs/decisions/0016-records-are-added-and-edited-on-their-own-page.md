# 0016. Records are added and edited on their own page, not in a dialog

- Status: Accepted
- Date: 2026-10-14
- Issues: #640

## Context

Design 25c, 25f and 30a put the add and edit forms of every "Záznam" (category, tag, author, user)
in a dialog. The routes `/new` and `/{id}/edit` rendered the parent (the list or the detail)
with the dialog over it. #640 built it that way for categories and tags. Closing the dialog then
needed its own history handling, so that Back did not reopen it and an edit started in the list
returned there.

Whether a form is a page or a dialog is not a layout question. It decides what has an address,
how routes nest, what Back does and what the server renders on its own. Those are product and
architecture calls. A design answer had made it, and the code had followed.

## Decision

Adding and editing a category, a tag, an author or a user is its own page at `…/new` and
`…/{id}/edit`, with a title and breadcrumbs. It is not a dialog over the parent. A dialog is for
confirmations and narrow actions: state transitions (07), bulk actions, the publication date, and
the profile in Settings (29b), which is a personal setting rather than a record.

Whether something is a page or a dialog, and what has an address, is decided by product and
architecture. The design project decides the UX within that (design question 8gnyv4wm redrew 25c
as a page).

How the app returns and reports after saving is the app's. The form submits through a fetcher,
so errors stay at the fields. On success the browser shows the toast and goes back to the page
that opened the form, or to the record's parent from a shared link. There is no toast carried in
the session.

## Consequences

- Authors and users (28c, 28f) follow the same shape when they are rebuilt.
  `utils/create-admin-record-section.ts` gives a section its `new` and `edit` pages and the
  redirects from the old `add-…` and `edit-…` addresses.
- A future design answer that puts a record's form in a dialog, or moves a page into one, comes
  back to product first. Choosing a page or a dialog is not part of a design answer.
- The return to the opener uses one link state, today in
  `app/routes/administration/articles/utils/return-to-opener-state.ts`. The second section to use
  it moves it to `app/utils/` rather than adding another mechanism.

## Alternatives considered

- **Dialog over the parent (design 25c before 8gnyv4wm).** It kept the list visible, but it nested
  the form route under the list and the detail. It also needed history handling to close: a
  replace left the list in history twice, and Back reopened the dialog. A form with its own
  address is a page.
- **Toast carried in the session after a redirect (design 30c before 8gnyv4wm).** The app has no
  flash messages, and a fetcher already keeps a refresh from repeating the action. Adding a
  session flash for this alone was not worth a second mechanism.
