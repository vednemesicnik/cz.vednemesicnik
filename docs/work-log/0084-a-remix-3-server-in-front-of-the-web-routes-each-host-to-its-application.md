# 0084. A Remix 3 server in front of the web routes each host to its application

- Date: 2026-11-22
- Issues: #1062, #1063

## Context

`react-router-serve` started the web (`app:start`), so the Fly app `cz-vednemesicnik` could serve
one application. Publikace, a Remix 3 app, is to run on `publikace.vednemesicnik.cz` on the same
machine rather than a machine of its own (#1063). React Router's `createRequestHandler` and a
Remix 3 router are both a function from `Request` to `Response`, so one Node server can pick
between them by host.

Side by side in Docker, 1 GB and one CPU each, over a copy of the same data, the old and the new
server were compared path by path (`scripts/compare-servers.sh`). That comparison found what
`react-router-serve` did implicitly: it set `NODE_ENV` to `production` when unset, Express added
`charset=utf-8` to every text response, and `compression` sent Brotli at quality 4 where Node's
default is 11. It also showed that the stop signal never reached the server: the entrypoint is a
`sh` script, and neither `sh` nor `pnpm` passes the signal on, so the container was killed.

## Outcome

**`server.ts` on Remix 3's packages is the production process.** In order, it compresses (Brotli at
quality 4), answers 404 to a host no application serves, serves `build/client` (`/assets` immutable
for a year, the rest revalidating), logs the request, then hands it to the React Router build. The
build is imported before the port opens, so the environment check still fails the boot. It depends
on the five `@remix-run/*` packages it imports rather than the `remix` umbrella, which would bring
the CLI, the test runner and every database adapter into the image (about 43 MB).

Beyond the headers above, the comparison left differences in static files only: they now carry
`X-Content-Type-Options: nosniff`, and a 304 lacks the `Cache-Control` and `Vary` that Express
repeated on it; browsers and Cloudflare keep those from the stored response.

**The web's hosts are `vednemesicnik.cz`, `www.vednemesicnik.cz`, `cz-vednemesicnik.fly.dev` and
the local ones** (`localhost`, `127.0.0.1`, `[::1]`, `*.localhost`). `/health` passes on every host,
because Fly's check calls the machine over its private network and its documentation doesn't say
which `Host` that carries.

**The request URL is built as before:** the protocol is the connection's (`http:` behind Fly) and
the host is the `Host` header. `trustProxy` stays off, since it would believe `X-Forwarded-Host` and
`X-Forwarded-For` from anyone who calls the origin directly (log 0058).

**The access log has the pathname without the query.** Sign-in and enrolment links carry their
token in the query. Log 0066 let it reach the Fly log knowingly and named a custom server as the
reason to take it out; this is that change.

**The entrypoint `exec`s `node`**, not `pnpm`, so SIGTERM reaches the server. It closes idle
connections and exits once open requests finish, or after 4 seconds, since the administration's
event stream never ends by itself.

## What follows

- Publikace joins as one more host in `server/` once the repository is a monorepo (#1063). Its
  hostname comes before the `*.localhost` rule, so `publikace.localhost` reaches Publikace locally.
- Turning the protocol to `https:` would let `allowedActionOrigins` in `react-router.config.ts` go;
  it is left for its own change, since it changes `request.url` for the whole web.
- Brotli at a higher quality, or precompressed assets, would be a reason to revisit the
  compression setting; today it matches what Express sent.

## Turned down

- **Two processes behind a small proxy**, which would keep a crash of one application from taking
  the other down: a second Node runtime on a 1 GB machine that Sharp already strains, and supervision
  to maintain. The applications are built as `Request → Response` functions, so a later split
  needs no change to them.
- **Fly `[processes]`**: each process group gets a machine of its own, which is the cost this avoids.
- **Brotli at Node's default quality**: quality 11 compresses each JavaScript file anew on every
  request on one shared CPU.
