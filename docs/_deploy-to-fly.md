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

The backend is selected by `IMAGE_STORE_DRIVER` — a non-secret toggle in `fly.toml`
`[env]` (`volume` by default, `tigris` for object storage — see below). Callers are
unchanged: both drivers implement the same `ImageStore` interface.

### Object storage (Tigris)

Tigris (S3-compatible, integrated with Fly) removes the two volume limitations:
image durability no longer depends on a single machine's volume, and the DB backup
no longer needs to contain images. The resource routes still stream the files (the
app stays on the read path), but a cache hit at Cloudflare's edge keeps origin
traffic rare (URLs are content-versioned + `immutable`).

Set it up once and migrate:

1. Create the bucket. This provisions `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`,
   `AWS_REGION`, `AWS_ENDPOINT_URL_S3` and `BUCKET_NAME` as app secrets.
   ```shell
   fly storage create --app cz-vednemesicnik
   ```
2. Copy the existing variants from the volume into the bucket **before** switching
   the driver (safe two-phase rollout — the volume keeps serving until you flip).
   Run it from the app machine so the bytes ride Fly's fast egress to the bucket
   (not the slow WireGuard tunnel):
   ```shell
   fly ssh console --app cz-vednemesicnik
   pnpm images:migrate:tigris:built
   ```
   `images:migrate:tigris:built` runs `node build/migrate-tigris.mjs` — the migration
   script pre-bundled into the image by `pnpm app:build` (via `vite.migrate.config.ts`).
   No `aws` CLI and no `tsx`/`app/` source are needed in the container: the app code it
   imports is bundled in, only `node_modules` (`@aws-sdk/client-s3`, `dotenv`) stay
   external. It walks `/data/images` and PUTs each file under the `images/` namespace
   (`images/<relative path>`, matching the app's `keyPrefix`), skipping objects that
   already exist so it is safe to re-run.

   The bucket is shared: images live under the `images/` prefix, leaving room for
   sibling namespaces (e.g. `pdfs/` for issue PDFs) in the same bucket.

   Alternatively, if you have the `aws` CLI available, `aws s3 sync /data/images
   "s3://$BUCKET_NAME/images/" --endpoint-url "$AWS_ENDPOINT_URL_S3"` does the same
   (relative paths map 1:1 onto store keys under `images/`, `sync` is idempotent).
   Object-level cache metadata is not needed either way: the app serves images through
   `/resources/*` (behind Cloudflare) and sets `Cache-Control` on the response itself,
   so the stored object's own headers are never used.
3. Flip the driver and redeploy. Set it in `fly.toml` `[env]` so the config stays
   the single source of truth, then deploy:
   ```toml
   # fly.toml
   [env]
     IMAGE_STORE_DRIVER = 'tigris'
   ```
   ```shell
   fly deploy --app cz-vednemesicnik
   ```
   Verify images still serve, then the `/data/images` volume directory can be
   reclaimed.

   > **Why not `fly secrets set`?** A secret *would* take effect — on Fly, secrets
   > override same-named `[env]` values — but `IMAGE_STORE_DRIVER` is not sensitive,
   > and a secret would silently contradict the visible `[env]` line (it would still
   > read `'volume'` while the app runs on Tigris). Keep the toggle in `[env]` and
   > reserve secrets for real credentials (`AWS_*`, `BUCKET_NAME`, `SESSION_SECRET`, …).

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
