# 0093. The host reports Publikace's errors to the web's Sentry, and only those no retry mends

- Date: 2026-11-27
- Issues: #1098

## Context

Since #1082 Publikace runs in the host's process beside the web (log
[0092](0092-the-host-serves-publikace-from-its-prefixed-variables-and-only-its-start-fails-alone.md)).
The web's errors reach Sentry through `instrument.server.ts`, which initialises one
`@sentry/react-router` client for the process and scrubs every event with
`scrub-sentry-event.ts`, already cutting a Publikace link's key out of `/l/{key}/…`. Publikace
catches every error itself (`createPublikace`'s `fetch` turns one into a 500, the record queue
retries) and wrote each to `console.error`, so a failing Publikace showed only in `fly logs`.
Nothing under `apps/publikace/app/` reads `process.env`, so it could not find the DSN on its own.

## Outcome

The host hands `createPublikace` a second argument, `{ reportError }`
(`server/start-publikace.ts`, `server/report-publikace-error.ts`): Sentry's `captureException`
with the tags `app: publikace` and the `area` Publikace names. The web's events carry
`app: web` from `initialScope`. Publikace calls `reportError` beside the log line where no retry
or person in the app mends the error: a 500 (`request`), a record written unsuccessfully three
times in a row, once (`record`), a record pass that threw, the startup cleanup, the membership
service refusing the app's own request (`auth`), a Drive token that does not decrypt (`drive`), a
database write that should not fail (`data`). The host reports a refused or failed start
(`startup`). Outages of Drive, Google and the Mailer stay log-only. Without the host the reporter
is a no-op.

## What follows

- A new place in Publikace that logs an error asks one question: would anybody act on it from
  Sentry? A configuration or a code bug yes; a service that was down for a minute no, since the
  screens and the jobs' history already say so.
- Sentry has no release for Publikace yet; #1102 brings the version.
- [apps/publikace/docs/architecture.md](../../apps/publikace/docs/architecture.md) § The stack and
  where it runs describes the current state.

## Turned down

- **Publikace's own Sentry client.** A second `@sentry/*` copy in one process would initialise a
  second client with its own hooks and need the DSN through Publikace's record; the one client and
  its scrubber are already there.
- **Every logged line to Sentry.** The 55 `logDriveFailure` lines are mostly Drive or Sheets not
  answering for a moment, and every retry of a failing record would be an event every pass.
