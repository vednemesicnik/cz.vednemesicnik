# 0052. Every content list reloads only the rows on screen, so a live change never moves a row

- Date: 2026-10-29
- Issues: #752, #748, #751

## Context

[0035](0035-every-administration-page-is-live.md) made every administration page live and put
the article list's 22f row on every content list. #748 planned the five other lists (issues,
podcasts, episodes on a podcast's page, categories, tags) as a plain revalidation of the page,
and the 22f row on top of it in #752.

Design answered #751 on 29 Oct 2026 (xkg6rdz4): no list is an exception, and a row never moves
on its own. A foreign rename of a category, a new year or order of an issue, a renumbered
episode or a row that left the state filter moves only at the next load. A plain revalidation
re-sorts the page and drops rows that left the filter, so it cannot keep that rule.

## Outcome

- **Every content list reloads exactly the rows on screen** on a live event, in their order, as
  the article list already did. `useLiveRows` (`app/hooks/use-live-rows.ts`) loads the index
  route through a fetcher with `?pinned=<ids>`. The loader answers that with those rows only,
  under the permission clause, and with no redirect and no toast (`parsePinnedRowIds`,
  `app/utils/pinned-rows/`).
- **#748's plain revalidation is not built.** #752 delivers the lists live and with the 22f row
  together.
- **On a podcast's page the header follows in the same load as its episode rows.** The
  breadcrumb and the page title come from the podcast layout. A change of the podcast also
  revalidates the page with the index route left out (`layout-only-revalidation.ts`), so its
  rows stay put.
- **Podcast and episode rows show the edit hold** like issue and article rows: who edits it,
  ahead of the live change and the fact, and the held row's actions wait (xkg6rdz4, 27a, 27b).

## What follows

- A new content list goes live with `useLiveRows` and a pinned branch in its loader. Without
  the branch, the live load gets a whole page and the rows move.
- The pinned branch skips every redirect and the admin-notice cookie: a fetcher response that
  read the cookie would use up the toast meant for the page.
- The pinned ids come from the browser, so each branch keeps the list's permission clause. On
  the category and tag lists the second query has none: its ids must come from the first one.
- One's own action, a filter, the sort, paging and navigation still load the list whole. New
  rows appear only then (22f).
- An episode event names no podcast, so a podcast's page loads its rows on any episode event.
  Revisit that if the administration grows to many podcasts.

## Turned down

- **Plain revalidation first (#748), the row on top later.** It ships behaviour this issue
  replaces at once, and it moves rows, which design ruled out.
- **Keeping stale rows on the client after a plain revalidation.** A row that left the filter
  would keep its old state line and actions, which act on a state that is gone.
- **The podcast page's index route opting out of every plain revalidation.** It would also skip
  the reload after a change to one's own account
  ([0042](0042-an-account-event-is-a-bare-hint-and-a-session-reloads-on-its-own-account.md)),
  so only the podcast's own revalidation leaves the page out.
