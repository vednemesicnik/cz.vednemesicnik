# 0085. Requests carry the protocol of BASE_URL, and the action origin allowlist is gone

- Date: 2026-11-22
- Issues: #406, PR #407

## Context

The Fly proxy speaks plain HTTP to the machine, so the request URL started `http://` while
browsers send `Origin: https://vednemesicnik.cz`. React Router's action origin check compares the
whole origin, scheme included, and refused every action until `allowedActionOrigins:
['vednemesicnik.cz']` went into `react-router.config.ts` (#406, #407). Log 0084 kept the
connection's protocol and named turning it to `https:` as a change of its own, since it changes
the request URL for the whole web.

## Outcome

`server.ts` passes `createRequestListener` the protocol of `BASE_URL`: `https:` on Fly,
`http:` locally. The host is still the `Host` header. React Router's origin check matches without
help, so `allowedActionOrigins` is gone. Redirects built from the request URL, such as the
trailing slash in `app/root.tsx`, now point to `https://`.

## What follows

- `BASE_URL` must use the protocol clients use. A production build run with an `https:`
  `BASE_URL` but reached over plain HTTP refuses every action.
- The origin check is now per host. A POST to `cz-vednemesicnik.fly.dev` with its own origin
  passes. One with `Origin: https://vednemesicnik.cz` is refused, which the allowlist let
  through before.
- When Publikace joins the host (#1063), its requests get the same protocol.

## Turned down

- **`trustProxy`.** It would take the protocol from `X-Forwarded-Proto`, but it also believes
  `X-Forwarded-Host` and `X-Forwarded-For` from anyone who calls the origin directly (log 0058).
- **A separate `PUBLIC_PROTOCOL` variable.** `BASE_URL` already names the public protocol, and
  the build's environment check requires it.
