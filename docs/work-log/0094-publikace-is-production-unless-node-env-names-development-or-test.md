# 0094. Publikace is production unless NODE_ENV names development or test

- Date: 2026-11-27
- Issues: #1097

## Context

Review finding S-01 (`apps/publikace/docs/review-2026-11-24.md`) found that every safe default
in `apps/publikace/app/auth/environment.server.ts` depended on `NODE_ENV === 'production'` in the
record `createPublikace` is handed. Without that value the app started on its development
fallbacks: a public session secret, a fixed Drive key, any token audience on `/api/v1` and
session cookies without `Secure`. Nothing was refused and nothing was logged. Log
[0092](0092-the-host-serves-publikace-from-its-prefixed-variables-and-only-its-start-fails-alone.md)
closed the host's half: on Fly the host refuses to start Publikace unless `NODE_ENV` is
`production`. The app itself still trusted whatever record it got, from any other host, script
or harness.

## Outcome

**`isProduction()` is true unless `NODE_ENV` is `development` or `test`.** An unset, empty or
misspelt value is production, so a record that forgets it meets the startup refusals of
`checkConfiguration` instead of the fallbacks. `app:dev` and `app:fake` set `development` and
`remix test` sets `test`, so they work as before. The asset server follows the same rule, and so
does the fake app's guard. `apps/publikace/docs/security.md` § Startup and configuration
describes the current state.

## What follows

- The only way into the development fallbacks is to ask for them by name. A host that sets
  `NODE_ENV=development` on a public machine still gets them: the host's guard covers Fly, and
  nothing else does.
- Publikace's release gate (log
  [0090](0090-semver-versions-are-milestones-and-unreleased-work-reaches-dev-behind-a-gate.md)),
  `isUnreleased()`, reads the same rule, so unreleased work is hidden wherever the guards are on.
- A reason to revisit: Publikace runs somewhere other than this host, on a machine where a wrong
  `NODE_ENV` is a real risk. A check of the machine would then be needed, not of the value.

## Turned down

- **Refusing the fallbacks whenever `APP_ORIGIN` is not a local origin**, the review's second
  direction. In development `APP_ORIGIN` falls back to `http://localhost:44100` when it is unset,
  so a remote host with `NODE_ENV=development` and no origin would pass the check anyway. It
  would also refuse a local tunnel used to try the Google sign-in from a phone. The value names
  the intent; guessing it from a hostname list adds a rule that can be wrong both ways.
