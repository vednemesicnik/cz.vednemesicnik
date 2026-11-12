# 0082. A web list page past the last redirects to the last page

- Date: 2026-11-12
- Issues: #1048, #512, #541

## Context

Design 11 (2u868pc9, 28 Sep 2026) had a list page past the last (`/articles?page=99`, a category,
a tag) return a 404, built in #512 and #514. Design 30i (n3wa2ld4) then had `‹ Články` lead back
to the list page the reader left, and a page that no longer exists open the last page with rows.
The server can't tell that return from a typed address or a bookmark: the record and list
addresses carry no state (log 0081). Log 0081 kept the 404 as a noted departure from 30i. Design
settled the conflict in `fhhx3q8l` (new note 11a, 30i extended).

## Outcome

- `/articles`, a category and a tag past their last page redirect (302) to the last page, through
  `buildLastPageRedirect`, as the administration has done since #541. Page 1 is the bare address,
  so an empty category or tag lands on its empty state. There is no message: the summary and the
  pagination say where the reader is.
- An invalid number (`?page=abc`, `?page=0`) still opens page 1. A category or tag that doesn't
  exist is still a 404 (30f).
- The page-past-last 404 data (`NotFoundPageData`, `parseNotFoundPageData`) and its branch in the
  website boundary are gone.

## What follows

- One address has one behaviour on the website and in the administration. A new paginated list
  redirects past its last page the same way.
- It is 302, not 301, because the last page moves as articles are added. The canonical address of
  a list has no `?page`, and the sitemap lists no `?page` address and no category or tag page, so
  crawlers lose nothing.

## Turned down

- **Keeping the 404 (0081).** Readers following the site's own `‹ Články` would end on „Tuhle
  stránku jsme nenašli“.
- **A 404 for typed addresses and a redirect for returns.** The server can't tell them apart.
