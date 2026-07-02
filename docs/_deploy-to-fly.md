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
read path — the resource routes just stream the ready-made files. Image metadata
(`version`, dimensions, LQIP) lives in the DB; the images themselves are on the
volume — SQLite no longer holds image blobs.

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
