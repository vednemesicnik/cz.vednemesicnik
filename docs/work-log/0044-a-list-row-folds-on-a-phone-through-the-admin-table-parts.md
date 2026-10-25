# 0044. A list row folds on a phone through the admin-table parts, and the phone rows keep the 24 px page gutter

- Date: 2026-10-25
- Issues: #818
- Later: 0045

## Context

Below 768 px only the article list had a mobile form (22g), built in its route: its own grid,
its own phone menu and its own sticky *Nový článek* bar. Design drew the rest of the lists in
`32 Seznamy administrace na mobilu` (k7d1vqm1, wording myx395rj, copy sa53xexi). It asked for
one shared row in `app/components/admin/admin-table/` instead of a copy per list, and one
shared sticky bar.

Two premises in the answer did not hold. It quotes `padding: 14px 16px` "as in the article
row", but that row uses `14px 24px`: the app's phone page gutter (`AdminPage`, the article
tabs). The drawings use 16 px on every phone page, and the app has used 24 px since #538. 22g
also draws its titles at 16 px, while the app drew them at 14 px.

## Outcome

- **The folded row is made of admin-table parts:** `TableImageCell`, `TableNameCell` (with
  `TableRowLink`, `TableNameAddress`, `TableNameNote`), `TableStateCell`, `TableDetailsCell`
  (with `TableDetailsLine`) and `TableActionsCell` (with `TableRowActions` and
  `TableRowMenu`). Each part's cell carries `data-phone-part`.
- **`AdminTable foldsOnPhone` folds a table below 768 px.** It drops the header, runs the
  rows edge to edge and lays each row out as a grid of its parts. A cell that is not a part
  is hidden, which takes care of the checkbox, dates and the columns the details repeat. From
  768 px the parts render as the cells they were, so the desktop table does not change.
- **`ListHeader foldsOnPhone` and `AdminBulkActionsBar foldsOnPhone`** hide the header's main
  action and the selection bar below 768 px. The action moves to the shared **`ListActionBar`**,
  rendered only where the header renders it.
- **Phone rows keep the page's 24 px gutter,** so their text lines up with the filters. The
  row name is 16 px, as 22g and 32 draw it, the article list included.
- Categories, tags, the archive, authors, users and articles fold. Podcasts and episodes do
  not.

## What follows

- `foldsOnPhone` is an opt-in only because podcasts and episodes share these components and
  wait for their desktop lists (27a, 27b) before 32c and 32d. Once they fold, the prop can go
  and folding becomes the default.
- Moving every phone page to the drawn 16 px gutter is one change, made in `AdminPage`, the
  article tabs, the folding table's `-24px` bleed with its row padding and the year
  heading's padding, and `ListActionBar`.
- The parts style themselves for the phone only inside a table that sets `foldsOnPhone`
  (`data-folds-on-phone`), so a list can compose them before it folds.
- A new list row composes the parts and writes no phone CSS of its own.

## Turned down

- **A copy of the 22g phone rules per list.** Six copies of the same grid would drift, as the
  `.link` rule had already been copied five times.
- **Rows at 16 px inside a 24 px page.** Their text would sit 8 px left of the filters above
  them.
