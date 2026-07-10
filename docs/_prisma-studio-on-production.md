# Prisma Studio on production

For advanced, ad-hoc work with the production database in a GUI, run Prisma Studio
**directly on the Fly machine** and tunnel to it locally. Everything Studio needs —
the `prisma` CLI, `prisma/schema.prisma`, `prisma.config.ts`, and `DATABASE_URL` —
already ships in the production image, so this requires **no application changes**.

This is deliberately *not* embedded in the administration UI: Studio runs only while
you run it and is reachable only through your authenticated Fly WireGuard tunnel, so
there is no standing raw-SQL endpoint in production. Once you stop it, the capability
is gone.

> **Warning:** this is the live production database with no undo. Take a
> [manual backup](_manual-database-backup.md) before making any writes, and know the
> [restore procedure](_manual-database-restore.md). Concurrent access next to the
> running app is safe (the database runs in WAL journal mode), but every edit is
> instant on production.

## Prerequisites

An authenticated `flyctl` with a fresh SSH certificate in your agent (valid 24h;
same setup as the [backup doc](_manual-database-backup.md#setup-do-this-once-per-session)):

```shell
fly ssh issue --agent -o <your-org-slug>
```

## 1. Start Studio on the machine (leave running)

```shell
fly ssh console --app cz-vednemesicnik --pty -C \
  "sh -c 'cd /app && HOST=0.0.0.0 pnpm prisma:studio --port 5555 --browser none'"
```

- `--browser none` — there is no browser on the server to open.
- `HOST=0.0.0.0` — Prisma 7's `prisma studio` has no `--hostname` flag; its server
  binds to `process.env.HOST` and defaults to localhost-only, which `fly proxy`
  cannot reach. The image already sets `HOST=0.0.0.0`, but keep it explicit so the
  command doesn't depend on that.
- Port 5555 is **not** publicly exposed — `fly.toml` only routes port 8080 through
  the public `http_service`. Anything else is reachable solely over the org's
  private 6PN/WireGuard network, which is exactly what `fly proxy` uses.

Studio confirms with `Prisma Studio is running at: http://localhost:5555` (the URL
refers to the machine, not your laptop — that's what the tunnel is for).

## 2. Open the tunnel (second terminal, leave running)

```shell
fly proxy 5555:5555 --app cz-vednemesicnik
```

Then open <http://localhost:5555> in your browser.

## 3. Clean up

`Ctrl+C` in both terminals — first the proxy, then the `fly ssh console` session
(which terminates Studio on the machine). Nothing stays listening afterwards;
re-running the proxy and getting a connection refusal is the confirmation.

## Troubleshooting

- **Connection refused through the proxy** — Studio isn't running on the machine, or
  it bound to localhost (the `HOST=0.0.0.0` prefix was dropped from the command).
- **`fly ssh` authentication errors** — re-issue the certificate:
  `fly ssh issue --agent -o <your-org-slug>` (org slug from `fly orgs list`).
