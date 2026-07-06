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

## Sign-in secrets

Magic-link sign-in needs the Google Apps Script web app credentials (see the
`SCRIPT__Auth__Magic_Link` repo). `GAS_MAGIC_LINK_SECRET` must equal the script's
`SHARED_SECRET` property.

```shell
fly secrets set GAS_MAGIC_LINK_URL="https://script.google.com/macros/s/.../exec" GAS_MAGIC_LINK_SECRET="…" --app cz-vednemesicnik
```

### Break-glass password (`ALLOW_PASSWORD_SIGN_IN`)

Password sign-in is a last-resort emergency path, disabled by default. It's a Fly
secret (not `fly.toml`) so it can be flipped with a restart instead of a redeploy.
Any value other than `true` — including unset — is disabled.

```shell
# Enable (e.g. magic-link/GAS is down and you need in)
fly secrets set ALLOW_PASSWORD_SIGN_IN=true --app cz-vednemesicnik

# Disable
fly secrets unset ALLOW_PASSWORD_SIGN_IN --app cz-vednemesicnik
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

### Managing the Tigris bucket over `fly ssh`

The production image ships an `object-store` CLI for ad-hoc bucket operations — no
one-off scripts. It is a self-contained TypeScript file run via Node 24 native type
stripping, reusing the already-bundled `@aws-sdk/client-s3`; it reads the same
`AWS_*` / `BUCKET_NAME` secrets the app uses, so no extra setup is needed.

```shell
fly ssh console --app cz-vednemesicnik
```

```shell
object-store ls                     # list every object in the bucket
object-store ls images/             # list only the images namespace
object-store ls pdfs/               # list only the issue-PDF namespace
object-store stat images/ab/<id>/v1/960.avif   # metadata for one object
object-store put ./cover.avif images/ab/<id>/v1/960.avif   # upload a file
object-store rm images/ab/<id>/v1/960.avif      # delete one object
object-store rm images/ab/<id>/                 # delete a whole "directory" (recursive!)
object-store --help
```

> **Caution:** a key ending in `/` deletes **recursively** — `object-store rm images/`
> would wipe every image variant. Double-check the prefix before running `rm`.

### Issue PDFs in the store

Issue PDFs live in the `pdfs/` namespace of the object store, the same way images do —
uploads write only to the store and are served from it. The legacy `IssuePDF.blob`
SQLite column, a one-off backfill, and the loader's blob fallback existed only to move
the historical PDFs across; all three were removed once the migration was verified in
production (issue #108).

### Reclaiming space after the blob drop (one-off)

The migration that dropped the legacy in-DB `IssuePDF.blob` column frees a lot of space
inside the SQLite file, but SQLite does not return it to the filesystem until a
`VACUUM`. Run it **once** after that migration has been deployed:

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
