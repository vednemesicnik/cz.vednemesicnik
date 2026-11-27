# 0092. The host serves Publikace from its prefixed variables, and only its start fails alone

- Date: 2026-11-27
- Issues: #1082, #1097, #1098

## Context

Publikace ran only on a laptop, through `apps/publikace/server.ts`, so the Apps Script jobs could
not reach its API and the proofreaders could not sign in. Log
[0084](0084-a-remix-3-server-in-front-of-the-web-routes-each-host-to-its-application.md) put a
Remix 3 server in front of the web so that a second application could share the Fly app
`cz-vednemesicnik`. Log [0087](0087-publikace-joins-as-apps-publikace-with-its-history-and-its-own-tools.md)
moved Publikace into `apps/publikace` and left its image, its backup and its migrations filter
for this work. `createPublikace(environment)` already owned no process and rejected a bad
configuration with nothing left open.

The facts the shape rests on:

- one Fly app has one namespace of secrets, and the web already reads `SESSION_SECRET`,
  `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`;
- Cloudflare's protection of the zone answers datacenter addresses with 403, which the
  GitHub runners showed, and the jobs call from Google's;
- Publikace's sources carry JSX, which Node's type stripping cannot run, and the root does not
  depend on the `remix` package (0084);
- the web's production peak over the last two weeks was 471 MB of the 965 MB the VM has; in
  Docker on one CPU and 1 GB, the host used 346 MB with the web alone and 448 MB with Publikace
  started and its assets compiled.

## Outcome

**Every Publikace variable is `PUBLIKACE_<name>`, and the host hands it over without the
prefix** (`server/publikace-environment.ts`). Publikace gets that record and the host's own
`NODE_ENV`, nothing else of the process, and a `PUBLIKACE_NODE_ENV` is dropped. On Fly
(`FLY_APP_NAME` set) anything but `production` is refused, which closes the host's half of
review finding S-01. The app's own fallbacks are #1097.

**What is not secret is an `ENV` line of the image, the rest a `fly secrets` entry.** The origin,
the domain, the database path and the app's account are fixed facts of this deployment, so they
sit in `docker/fly/Dockerfile` beside the web's `DATABASE_URL`, and `fly.toml` stays as it was.
The Drive IDs, the service URLs, the first administrator and every secret are `fly secrets`,
because the repository is public.

**The host loads Publikace through Publikace's own loader and starts it after its port opens.**
`loadModule` from `remix/node-tsx/load-module`, resolved from `apps/publikace`, transforms only
Publikace's module graph. Requests for `publikace.vednemesicnik.cz` and `publikace.localhost`
go to Publikace before the web's compression, static files and logger, since Publikace has its
own. They wait for its start. A refused or rejected start is logged once, and those hosts answer
503 while the web serves on (`server/start-publikace.ts`). A structural type in `server/`
describes `createPublikace`, and a test under Publikace's typecheck holds the export to it.

**Only the start is isolated.** Once running, Publikace shares the web's event loop: a long
synchronous step slows both, and an uncaught exception ends both. Log 0084 chose one process,
and this keeps that choice.

**Shutdown stops Publikace beside the server**, not after it, since the administration's event
stream holds the server's `close` open until the grace period ends.

**Publikace's database is `/data/publikace.sqlite`, backed up with the web's.**
`scripts/backup-database.sh` copies both in one run, Publikace's under
`db/publikace-backup-<timestamp>`. A machine without the variable, or whose Publikace never
started, skips it with a line, so a Publikace problem never blocks the web's backup. The
pre-migration backup in `deploy.yml` also runs when `apps/publikace/db/migrations/**` changes.

**Its DNS record is DNS only, not proxied.** Fly holds its certificate. The deploy's second smoke
test asks `/sign-in` on that certificate through the Fly origin (`--connect-to`).

**The VM stays at 1 GB.** The measured addition leaves a peak of about 575 MB.

**Publikace's Brotli runs at quality 4**, as the host's does.

**The Sentry scrubber cuts a shared link's key** out of a `/l/{key}/…` path. Publikace's caught
errors still reach only the Fly log (#1098).

**Drive is split into production and a test drive.** Production is a new shared drive
_Publikace_ with the Registr in its root. The test drive _Publikace (test)_ stays for the local
round trip, and `publikace.app@` belongs to these two drives and no other. There is no test
Registr: a local app writes the real one only while production holds no issue. Each write puts
the app's whole list there from one database, so two databases would replace each other's rows.

## What follows

- Libor's steps before the release: the shared drive, the OAuth redirect URIs, the DNS record,
  the certificate and the staged secrets. After it: connect `publikace.app@`, then
  `setupTriggers` in each job ([docs/\_deploy-to-fly.md](../_deploy-to-fly.md) § Publikace).
- A billing app or a third application joins the same way: its own hosts, its own prefix and its
  own start, never `process.env` handed over whole.
- Reasons to revisit:
  - an uncaught exception in Publikace taking the web down in production, which argues for
    two processes;
  - a memory peak past about 870 MB;
  - Node removing `module.register()`, which `loadModule` uses and Node 26 already warns about.

## Turned down

- **Prefixing only the names that collide today.** A web variable added later, such as a
  `MAIL_SEND_URL` of its own, would then collide silently.
- **Publikace's non-secret values in `fly.toml [env]`.** The web keeps its fixed values in the
  image and only toggles such as `STORE_DRIVER` in `fly.toml`. With one Fly app and no staging,
  `[env]` gains nothing.
- **A proxied record with a WAF rule skipping `/api/v1`.** Bot Fight Mode cannot be skipped by a
  custom rule, and a missed rule fails silently at a job's first run.
- **Registering `remix/node-tsx` for the whole process.** Every `.ts` file loaded later would be
  transformed, beside Sentry's own module hooks.
- **Renaming the test shared drive to _Publikace_.** It holds test folders the empty production
  database knows nothing of, and links the tests sent out. It would also end the test drive the
  round trip needs.
- **A missing Publikace database failing the backup.** It would hide nothing, since Publikace
  creates the file at the path the backup reads. It would let a Publikace that never started
  block every deploy of the web.
