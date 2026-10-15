# 0024. Dates are UTC instants shown in Prague time, with `Date` and `Intl` until Temporal is Baseline

- Status: Accepted
- Date: 2026-10-15

## Context

Adopting the JavaScript `Temporal` API in place of `Date` was proposed. The server runs
Node 26, which has `Temporal`, and TypeScript 7 types it under `--lib ESNext`. Safari does
not have it yet, and the administration is used from Safari.

The application mostly formats dates. `Intl` with `timeZone: 'Europe/Prague'` does that in
`app/utils/format-date.ts`, `format-numeric-date.ts`, `format-time.ts`, `get-issue-year.ts`
and `get-issue-data.ts`. Durations are millisecond constants. A chosen wall-clock time is
turned into an instant only in the browser, in the publish and change-date dialogs
(`app/utils/get-moment-on-day.ts`, `article-change-date-dialog`,
`admin-publish-date-dialog`). Prisma returns `Date` and React Router loaders serialize
`Date`, so a `Temporal` value would be converted back at every boundary.

## Decision

Dates stay `Date`, formatted with `Intl`.

- **A moment** (`publishedAt`, `createdAt`, a log entry) is stored as a UTC instant. The
  browser turns the wall-clock time the editor chose into that instant and sends it as an
  ISO string with `Z` (`toISOString()`). The server never reads a wall-clock string without
  a zone as a moment.
- **A calendar day** with no time of day (an archive issue's `releasedAt`) is sent as
  `YYYY-MM-DD` and stored as UTC midnight of that day.
- **Every date the application shows** is formatted in `Europe/Prague`, on the server and in
  the browser alike, so both render the same day.

## Consequences

- A new date input follows one of the two shapes above: a moment converted in the browser,
  or a calendar day as `YYYY-MM-DD`. A new date display formats in `Europe/Prague`, never
  through `toISOString()` or the process's own zone.
- The browser converts in its own zone, so an editor outside Czechia picks a time in their
  zone and sees it back in Prague time. The editorial team works in Czechia; this is
  accepted.
- No `Temporal` polyfill is added. Revisit when `Temporal` is Baseline (Safari ships it):
  then a wall-clock time can be read in `Europe/Prague` on either side, and the zone gap
  above closes.

## Alternatives considered

- **`Temporal` now with `@js-temporal/polyfill`.** A polyfill for every administration page
  in Safari, for the two or three helpers that convert a wall-clock time. Nothing in the
  application is wrong for lack of `Temporal`.
- **`Temporal` on the server only.** The server never converts a wall-clock time (the browser
  does), so it would replace working `Intl` formatting and give two date APIs to keep apart.
- **A date library** (`date-fns`, Luxon). Same work as the polyfill, and it would have to be
  removed again once `Temporal` is Baseline.
