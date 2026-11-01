# 0058. The client's address from Cloudflare is believed only with our zone's secret

- Date: 2026-11-01

## Context

`getClientIp` read `Fly-Client-IP`, and every rate limit, `AuthLog` and `AuditLog` use it. Fly
documents that header as the address it accepted the connection from, and production sits behind
Cloudflare.

Measured on production on 1 November 2026, as a read-only count that printed no address: 51 of 51
`AuthLog` rows, 12 distinct addresses, were in Cloudflare's published ranges and none outside.
`AuditLog` had no rows. So the limits counted per Cloudflare edge: unrelated people shared a
bucket, an attacker could spread across edges, and "per IP" in log 0057 was untrue in production.

Two POSTs to the origin with different spoofed `Fly-Client-IP` values landed in one bucket
(`RateLimit-Remaining` 9, then 8), so the value a client sends doesn't count.

## Outcome

`getClientIp` returns `CF-Connecting-IP` only when the request carries `X-Origin-Secret` equal to
`CLOUDFLARE_ORIGIN_SECRET`. A Cloudflare Transform Rule on the hostnames Fly serves adds that header.
Anything else falls back to `Fly-Client-IP`: a direct hit on the origin counts under its own address,
and a broken rule counts per edge, as before. In production it never falls back to a value the sender
chose.

The limiter counts an IPv6 address as its /64, since one household or phone holds the whole /64. That
applies to the fallback too, so IPv6 edges in one /64 share a bucket while a rule is broken. The logs
keep the full address.

`AuditLog` rows stay for good, but their `ipAddress` is cleared after 90 days, the window `AuthLog`
already has. Until now the column would have held edge addresses; from here it holds personal data,
and nothing in the app reads it.

## What follows

- Setup and rotation are in `docs/_deploy-to-fly.md`. The secret is required at boot in production,
  so it has to be on Fly before the release: a silent fallback was worse than a loud deploy failure.
- Whether the rule's header and `CF-Connecting-IP` arrive could only be proven after the release, by
  repeating the count on new rows.
- Rows written before the release hold edge addresses and look like any other. `AuthLog` ages out
  within 90 days.
- Database backups keep `AuthLog` and `AuditLog` for 2 years (`docs/_manual-database-backup.md`), so
  real addresses outlive the 90 days there. Accepted for now, as backups exist to restore everything;
  a reason to revisit if the backups' retention is ever reviewed.
- Another Cloudflare account's Worker reaching our zone gets the rule's header, but Cloudflare fixes
  `CF-Connecting-IP` on a cross-zone subrequest, so all of them share one bucket. A Worker on our own
  zone could set the address through `x-real-ip`: adding one would change this design.
- A shared school network behind one address, or one /64, shares a limit. That is a reason to revisit
  the numbers if real people hit it, not this mechanism.
- Closing the direct origin is still open, and would need the smoke test in `deploy.yml` to move.
  This does not depend on it.

## Turned down

- **Validating the connecting address against Cloudflare's ranges**, the first design: refuted before
  it shipped. For a Worker's subrequest to a zone outside Cloudflare, which `fly.dev` is, Cloudflare's
  header reference says the Worker can alter `CF-Connecting-IP`. Any Cloudflare account could have had
  a new bucket per request and written forged addresses into the logs, which is worse than counting
  per edge. Whether a Worker's `fetch()` leaves from the published ranges is not documented; this was
  read from the docs, not tested.
- **Ignoring requests with `CF-Worker`**: the docs don't say a Worker cannot remove it.
- **Authenticated Origin Pulls**: Fly terminates TLS, so the app cannot see the client certificate.
- **Cloudflare Tunnel**: a new moving part on a one-machine app, for a problem one header solves.
