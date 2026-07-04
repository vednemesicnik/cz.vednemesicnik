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
via the `IMAGE_STORE_PATH` env in `docker/fly/Dockerfile` (`/data/images`). No Sharp runs on the
read path — the resource routes just stream the ready-made files. Image metadata
(`version`, dimensions, LQIP) lives in the DB; the images themselves are on the
volume — SQLite no longer holds image blobs.

The backend is selected by `STORE_DRIVER` — a non-secret toggle in `fly.toml`
`[env]` (`volume` by default, `tigris` for object storage — see below) that governs
every store (images and issue PDFs). Callers are unchanged: both drivers implement
the same `ObjectStore` interface.

### Object storage (Tigris)

Tigris (S3-compatible, integrated with Fly) removes the two volume limitations:
image durability no longer depends on a single machine's volume, and the DB backup
no longer needs to contain images. The resource routes still stream the files (the
app stays on the read path), but a cache hit at Cloudflare's edge keeps origin
traffic rare (URLs are content-versioned + `immutable`).

Set it up once:

1. Create the bucket. This provisions `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`,
   `AWS_REGION`, `AWS_ENDPOINT_URL_S3` and `BUCKET_NAME` as app secrets.
   ```shell
   fly storage create --app cz-vednemesicnik
   ```
   The bucket is shared: images live under the `images/` prefix and issue PDFs under
   `pdfs/` (each store's `keyPrefix`), in the same bucket.
2. Select the driver in `fly.toml` `[env]` so the config stays the single source of
   truth, then deploy:
   ```toml
   # fly.toml
   [env]
     STORE_DRIVER = 'tigris'
   ```
   ```shell
   fly deploy --app cz-vednemesicnik
   ```

   > **Why not `fly secrets set`?** A secret *would* take effect — on Fly, secrets
   > override same-named `[env]` values — but `STORE_DRIVER` is not sensitive,
   > and a secret would silently contradict the visible `[env]` line (it would still
   > read `'volume'` while the app runs on Tigris). Keep the toggle in `[env]` and
   > reserve secrets for real credentials (`AWS_*`, `BUCKET_NAME`, `SESSION_SECRET`, …).

### Migrating issue PDFs to the store (one-off)

Issue PDFs moved out of the SQLite `IssuePDF.blob` column into the `pdfs/` namespace,
the same way images did. New uploads already write only to the store; existing PDFs
are copied over by a one-off, idempotent backfill.

After deploying with `STORE_DRIVER = 'tigris'`, run the backfill once from an
environment that has the production Tigris credentials (`STORE_DRIVER=tigris`,
`AWS_*`, `BUCKET_NAME`) and `DATABASE_URL` pointing at a current copy of the
production SQLite DB (see `_manual-database-backup.md`):

```shell
pnpm backfill:issue-pdfs
```

It reads each row's blob + id and writes the object to `pdfs/<id>.pdf`, skipping any
object that already exists. Verify a few `/archive/<file>.pdf` links open.

Dropping the now-unused `IssuePDF.blob` column and the loader's blob fallback, then
`VACUUM`-ing to reclaim the space, is tracked as a follow-up (issue #108) — do it only
after the backfill is verified.

### Reclaiming space after the blob drop (one-off)

The migration that dropped the legacy in-DB `blob`/`contentType` columns frees a lot
of space inside the SQLite file, but SQLite does not return it to the filesystem
until a `VACUUM`. Run it **once** after that migration has been deployed:

1. SSH into the console.
```shell
fly ssh console --app cz-vednemesicnik
```
2. Compact the database, then exit with `Ctrl`+`D`.
```shell
sqlite3 /data/sqlite.db 'VACUUM;'
```

`VACUUM` cannot run inside the migration (SQLite forbids it in a transaction), which
is why it is a separate manual step.

### Volume sizing

Each image expands to up to 10 variant files (≤5 widths × avif + jpeg) plus an
optional OG crop — more files than the single blob it replaced, but the total is
still small (tens of MB for the current content). With the blobs gone from SQLite the
database is well below its previous size, so the combined footprint on the volume is
**down**. Monitor usage and extend the volume if the image store grows:

```shell
fly volume list --app cz-vednemesicnik
fly volume extend <volume-id> --size 3 --app cz-vednemesicnik
```
