# 0030. An archive issue is its year, order and supplement, and its title is computed, never stored

- Status: Accepted
- Date: 2026-10-20
- Issues: #715, #719

## Context

An archive issue was named from its release date: `get-issue-data.ts` stored the label
„4/říjen 2026“ from the order and the Prague month of `releasedAt`, the edit form read the
order back out of the label, and the year filter derived the year from `releasedAt` row by
row. Design 26c (0y5fzyag, r1lh527v, qjv38ti4) has the editors write four fields instead: the
year, the order in the year, an optional name without the year („podzim“), and an optional
supplement — what was printed separately, with its own name. A supplement is named after
its main issue („Maturitní ples · doplněk k číslu červen 2026“), by the order while that issue
has no name or the viewer can't see it (wo02u3xq).

Production stores `releasedAt` both as epoch milliseconds and as ISO text; every existing
label agreed with the release year, and no year and order repeated (checked before the
migration, 20 Oct 2026).

## Decision

- `Issue` has `year`, `order`, `name?`, `supplement?` and `supplementSlug`, unique on
  `year + order + supplementSlug`. `releasedAt` and `label` are gone.
- `supplementSlug` is `""` for a main issue, never `NULL`: SQLite treats NULLs as distinct in
  a unique index, so a nullable slug would let two main issues 3/2026 exist. A supplement is
  compared by its slug, so „Maturitní ples“ and „maturitní ples“ are the same one.
- The title is computed wherever it is shown (`app/utils/issue/get-issue-title.ts`); a
  supplement's main-issue name is resolved per viewer in
  `app/utils/issue/resolve-issue-titles.server.ts`. Nothing stores it.
- A new PDF is named by year and order (`VDM-2026-4.pdf`, `VDM-2026-2-maturitni-ples.pdf`) and
  renamed only when the number changes; existing names stay.

## Consequences

- A screen, feed or log that names an issue selects `issueTitleSelect` and goes through
  `resolveIssueTitles` with the viewer's visibility, so a reader never learns a draft's name.
- Order is `year desc, order desc, supplementSlug asc`: a supplement stands right after its
  issue. The latest issue on `/links` excludes supplements.
- The editor (#717) keeps the unique key and the occupied-number check at the field
  (design 26d); its prefill and „Použít 4“ build on the same three columns.
- The archive's Rok filter reads the `year` column, which ends the interim source
  (`getIssueYear`) that 0017 named until an issue had a year of its own.
- Decision 0024 keeps its rule for a calendar day; its example, `releasedAt`, no longer
  exists, and nothing in the schema is a calendar day today.
- Consistent with 0006: the issue stays the printed magazine; a supplement is a printed
  issue too, with no relation to the main one beyond year and order.

## Alternatives considered

- **Keep `label` as a stored cache of the title.** A supplement's title depends on another
  row's name and on who is looking, so a stored label would go stale on a rename and would
  leak a draft's name to the web.
- **A nullable `supplementSlug`.** Reads more naturally, but breaks the unique key on SQLite
  (above).
- **Backfill `name` with the old month („říjen“).** Existing issues would show „říjen 2026“
  and lose the order from the title; the issue asks for „4/2026“, and editors can name old
  issues by hand.
- **Rename existing PDFs to the new scheme.** Their addresses are shared; 26c keeps them.
