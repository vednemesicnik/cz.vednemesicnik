# 0006. The archive `Issue` is the printed magazine only

- Status: Accepted
- Date: 2026-07-14
- Issues: #243

## Context

Articles of one magazine edition are published together, and the editorial has to stay on
top of the listing. Grouping web articles under the archive's `Issue` looked like a way to
model an edition.

## Decision

`Issue` is the printed magazine — a PDF with a cover in the archive. It is a separate domain
from web articles; they share only the word „číslo“. There is no `Article ↔ Issue` relation.
The website stays a blog ordered by `publishedAt`, and an edition's order is kept by
publishing the editorial last or backdating (#243).

## Consequences

- Grouping web articles by edition uses tags, or a dedicated entity if a public per-edition
  page is ever wanted — never `Issue`.

## Alternatives considered

- `Article ↔ Issue` relation with a per-issue position — rejected: it conflates two products.
- A `position` field on articles — rejected in #243.
