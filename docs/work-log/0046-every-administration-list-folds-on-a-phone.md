# 0046. Every administration list folds on a phone; folding is no longer an option

- Date: 2026-10-26
- Issues: #824, PR #825

## Context

0044 made folding an opt-in, `foldsOnPhone` on `AdminTable`, `ListHeader` and
`AdminBulkActionsBar`. The podcast and episode lists still used their pre-redesign rows and
would have folded into nothing. #824 redrew them per 27a and 27b (PR #825) and then folded
them per 32c and 32d, so every table the administration has is now a list that folds.

## Outcome

- **`AdminTable`, `ListHeader` and `AdminBulkActionsBar` always fold below 768 px.** The
  `foldsOnPhone` prop is gone. The table always carries `data-folds-on-phone`, which the parts
  read.
- **Podcasts (32c):** the cover beside the name, the state with its fact, and on the third
  line the episodes with the noun the missing column header gave them (`11 epizod na webu`,
  `žádné epizody na webu`, myx395rj). After that comes what is in progress, amber while
  something waits, or the latest date, and *obálka zatím chybí* last. The address goes.
- **Episodes (32d):** the number before the title, the state with its fact, and the
  platforms or *odkazy zatím chybí* on the third line. There is no publish date, and „⋯“
  holds the row action first.
- *Nový podcast* and *Nová epizoda* wait in `ListActionBar`. The podcast page's header hides
  *Nová epizoda* below 768 px and keeps „⋯“ and *Zobrazit na webu*.

## What follows

- A new table either composes the admin-table parts or shows only its name on a phone,
  since a cell that is no part leaves. A table that should scroll sideways instead needs
  the opt-out reintroduced, deliberately.
- On the podcast page the filters sit beside the Epizody heading in their own row, not as
  the table's sibling. The page pulls the folded list up to 6 px under them itself, which
  `FilterCell` does elsewhere (`podcasts/podcast/_index/_styles.module.css`).
- The podcast header's phone form is not drawn (32d leaves it open). Today it is the
  desktop header narrowed.

## Turned down

- **Keeping the opt-in with every list setting it.** A prop every caller sets to `true` says
  nothing, and a new list that forgot it would scroll sideways on a phone.
