# 0086. The web lives in apps/web, and the repository root is the host

- Date: 2026-11-26
- Issues: #1071, #1063

## Context

#1063 makes this repository a pnpm workspace with one package per application, so that the host
server of [0084](0084-a-remix-3-server-in-front-of-the-web-routes-each-host-to-its-application.md)
can import Publikace beside the web. The web filled the root: its source, Prisma, Storybook and
Vite configs, and the one `package.json` the host shared with it. The earlier plan left the web at
the root and put only Publikace in `apps/`. Libor decided on 26 Nov 2026 that the web moves first,
in a release of its own, so that a production failure after it can only be the move.

## Outcome

**The web is the workspace package `web` in `apps/web`; the root is the host and what the
deployment shares.** The root keeps `server.ts`, `server/`, `instrument.server.ts`, `docker/`,
`fly.toml`, CI, the agent setup, one lockfile, one `biome.json` and one `lefthook.yaml`. The
root's scripts keep their names and forward to the web (`pnpm --filter web …`), so CI jobs, hooks
and the entrypoint run the same commands. `app:typecheck` and `test` run the web's, then the
host's own `tsc` and `vitest`.

**The host depends on the web's `react-router` and `@sentry/react-router` at the same versions.**
pnpm then links one copy for both, so the process loads one React Router and one Sentry client.

**The image mirrors the repository under `/srv`** (`/srv/server.ts`, `/srv/apps/web`), not `/app`,
where the web would have sat in `/app/apps/web`. Its build stage copies only `apps/web`, so a
change elsewhere doesn't rebuild the web.

**The web never relies on the host's working directory.** The statutes PDF is read from
`DOCUMENTS_PATH`, which `server.ts` sets to `apps/web/documents`. The dev server, Prisma and the
web's scripts run with `apps/web` as their working directory, so the local `.env` and `data/` sit
in `apps/web`.

**Docs and scripts sit with what they describe.** Deploy, backups, restore, branching and this
log stay in `docs/`, and the scripts the deployment runs (backups, entrypoints, Docker shortcuts)
stay in `scripts/`. What describes or works on the web went to `apps/web/docs` and
`apps/web/scripts`, the object-store CLI included, because it imports the web's AWS SDK.

## What follows

- Publikace joins as `apps/publikace` with its history. The host imports it as it imports the
  web's build, and the Dockerfile copies it in a stage of its own.
- The pre-migration backup in `deploy.yml` watches `apps/web/prisma/migrations/**`. A second
  application's migrations need a filter line of their own.
- Paths in the skills and rules (`app/…`, `prisma/…`) are relative to `apps/web`
  ([AGENTS.md](../../AGENTS.md) § Repository Layout) until the agent setup is split per
  application.

## Turned down

- **Keep the web at the root and add only `apps/publikace`.** The web's root files would have
  had to exclude `apps/**` one by one, and the move would have come later anyway, mixed into a
  bigger change.
- **Keep `/app` as the image root.** Libor's call: `/app/apps/web` reads as a typo.
- **Set `DOCUMENTS_PATH` in the Dockerfile.** A local `pnpm app:start` from the root then
  answered 404 for the statutes. The host knows where the web lives, so it sets the path.
- **Move the instrument into `apps/web`** to keep Sentry off the root's dependencies. It is the
  process's instrument, loaded before any application, so it belongs to the host.
