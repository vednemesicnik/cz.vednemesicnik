# 0017. Every administration list with filters has saved filters, and Stav filters by queue

- Date: 2026-10-14
- Issues: #647

## Context

The administration had two generations of list filters. The article list had the filter block
of design 22a and 22d: several values per filter, Stav by queue, saved filters. The other seven
lists (categories, tags, archive, podcasts, episodes, authors, users) still had a select that
filtered one `ContentState` on submit. Drawings 25a–28a had also dropped saved filters from the
small lists.

Design answered on 14 Oct 2026 (question qv31cp5h) that every list takes the article list's
filter block. Product decided the same day that saved filters stay. Their value is not the
number of rows but the **default filter**: a Coordinator who sets *Ke schválení* as the default
opens every list on the work that waits.

## Outcome

- **Every administration list with filters has saved filters**, whatever its size. A list
  without filters has only the search, and so no saved filters and no *Zrušit filtry*. The
  users list (28d) is one such list, so the `users` value left `FilterTable`, and its stored
  rows were deleted by migration `20261014200000_retire_users_saved_filters`.
- **Stav filters by queue on every content list**, not by data state: `draft` (unsubmitted),
  `pending`, `approved`, `published`, `archived`, and for a Contributor `submitted` (Odeslané)
  in place of `pending` and `approved`. The queues rest on the submission flags of
  [0013](0013-content-is-submitted-only-the-coordinator-approves-and-publishes.md) and
  the approver level of [0005](0005-review-gate-keys-off-role-level.md)
  (`app/utils/build-content-queue-where.ts`).
- **Every filter takes several values**, as repeated params, any of them matching. A saved
  filter stores the filters and the search, never the page or the sort.
- **A default saved filter applies only to a bare list address.** Any filter, the search, the
  sort, the page or `?filter=none` in the address keeps it out of the way.
- The bar is one set of shared components in `app/components/` (`FilterBar` and its parts,
  `FilterMenu`, `SavedFiltersMenu`), following [0010](0010-one-component-per-role.md).

## What follows

- A new administration list with filters gets saved filters: a `FilterTable` value and a schema
  in `ADMIN_LIST_FILTER_SCHEMAS` (`app/utils/admin-list-filters.ts`). A list without filters
  gets neither.
- No topic document in `docs/` describes the list filters yet; the current state is the
  registry in `app/utils/admin-list-filters.ts` and the parts in `app/components/filter-bar`.
- A new content type's list filters Stav by queue through `buildContentQueueWhere` and counts
  the queues with `countContentQueues`. The Coordinator's pending count comes from the same
  counts.
- Saved filters of the episode list belong to the list, not to one podcast: the stored query
  carries no podcast, so a default applies on every podcast's page.
- A stored `state=draft` from before #647 now means unsubmitted drafts only.
- The archive's Rok is the release year in the editorial timezone (`getIssueYear`) only until
  the issue redesign gives an issue a year of its own (26a). That is the interim source, not a
  rule.

## Turned down

- **Pills for lists with a single filter.** Design turned them down (qv31cp5h): one bar would
  need two filter shapes, and a list that gains a second filter would change shape.
- **No saved filters on small lists**, as 25a–28a drew. Turned down by product: the default
  filter is worth as much on a list of seven categories as on the article list.
