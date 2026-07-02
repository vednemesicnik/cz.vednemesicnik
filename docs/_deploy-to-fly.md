# Deploy to Fly.io

## How to deploy to Fly.io

1. Create a new app on Fly.io specified by the `fly.toml` file. Do not deploy the app yet.
```shell
fly launch --no-deploy
```
2. Create a new volume for the persistent data storage. (region: Frankfurt, size: 1GB)
```shell
fly volume create data --count 1 --region fra --size 1 --app cz-vednemesicnik
```
3. Set secrets for the app.
```shell
fly secrets set SESSION_SECRET=$(openssl rand -hex 32) HONEYPOT_SECRET=$(openssl rand -hex 32) --app cz-vednemesicnik
```
4. Deploy the app.
```shell
fly deploy
```

## Image store

Pre-generated image variants are served as static files from `/data/images` on the
mounted volume (the same volume as the SQLite database). The root directory is set
via `IMAGE_STORE_PATH` in `fly.toml` (default `/data/images`). No Sharp runs on the
read path — the resource routes just stream the ready-made files.

### One-time backfill (migrating existing in-DB image blobs)

The move from in-DB `blob` columns to the on-disk store is a two-phase migration.
The schema change that adds the nullable store fields ships and applies
automatically (`prisma migrate deploy` in the entrypoint). After that first deploy,
run the backfill **once** to generate the variant files and fill the new columns.

The backfill is bundled into the app build (`build/migrate-images.mjs`, produced by
`pnpm app:build`) so it runs with plain `node` inside the container — no `tsx` or
`app/` source needed. Reads `DATABASE_URL` and `IMAGE_STORE_PATH` from the container
environment (both already set on Fly).

1. SSH into the console.
```shell
fly ssh console --app cz-vednemesicnik
```
2. Run the bundled backfill (idempotent — safe to re-run).
```shell
node build/migrate-images.mjs
```
3. Verify images serve correctly from the volume (open a few pages, check
   `/resources/*` responses), then exit with `Ctrl`+`D`.

Only **after** verifying serving works should the second-phase migration that makes
the store fields required and drops the legacy `blob`/`contentType` columns (plus a
`VACUUM` to reclaim the space) be applied.

> On a dev machine (with dev deps) the same backfill can be run from TypeScript
> directly via `pnpm images:migrate` — handy for local testing against a copy of the
> production database.

### Volume sizing

Each image expands to up to 10 variant files (≤5 widths × avif + jpeg) plus an
optional OG crop — more files than the single blob it replaces, but the total is
still small (tens of MB for the current content). Dropping the blobs from SQLite in
the second phase shrinks the database well below its previous size, so the combined
footprint on the volume goes **down**. Monitor usage and extend the volume if the
image store grows:

```shell
fly volume list --app cz-vednemesicnik
fly volume extend <volume-id> --size 3 --app cz-vednemesicnik
```
