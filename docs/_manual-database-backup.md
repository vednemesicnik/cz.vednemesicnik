# Manual database backup

Next to the automatic snapshots, taken by Fly.io every 24 hours, stored for 5 days, it could be useful to manually back up the database to a local machine or another cloud storage. 
SQLite database is a single file, so it is easy to copy it to another location.

> **Important:** binary image data no longer lives in the database.
> - **Volume driver (`STORE_DRIVER=volume`):** pre-generated variants are files
>   under `/data/images` on the same Fly volume and are the only copy of the image
>   data, so a database backup alone is **not** complete — back up the image store as
>   well (see [Backing up the image store](#backing-up-the-image-store-volume-driver)).
> - **Tigris driver (`STORE_DRIVER=tigris`):** the bucket provides image
>   durability, so a database backup does not need to include images
>   (see [After migrating to Tigris](#after-migrating-to-tigris)).

Both backups below stream out over a **raw `ssh` session tunnelled through `fly
proxy`**. This is a clean binary channel over a stable TCP tunnel — unlike streaming
through `fly ssh console`, where CLI noise (for example the harmless `Metrics token
unavailable` warning) shares the connection and a brief tunnel hiccup can silently
truncate the output.

> **Why not `fly ssh sftp get`?** SFTP runs over an extra protocol layer on top of the
> WireGuard tunnel and is painfully slow. Streaming straight to stdout over raw `ssh`
> bypasses that layer.

## Setup (do this once per session)

### 1. Issue an SSH certificate into your agent (valid 24h)

`fly ssh issue` works at the **organization** level, so it takes an org slug, not
`--app`. Run `fly orgs list` to find the slug.

```shell
fly ssh issue --agent -o <your-org-slug>
```

The default `--username` is `root,fly`, so connecting as `root` below just works.

### 2. Open the proxy (leave running in one terminal)

```shell
fly proxy 10022:22 --app cz-vednemesicnik
```

All streaming commands below run in a **second** terminal while the proxy stays up.
The `-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null` flags skip host-key
prompts, since the container's host key rotates between deploys.

## How to manually back up the database

`sqlite3 .backup` needs a destination file, so the snapshot is written to a temp path
inside the container, streamed out gzipped, and the temp file is removed — all in one
command.

```shell
ssh -p 10022 -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
  root@localhost \
  "sh -c 'sqlite3 \"\$DATABASE_URL\" \".backup /tmp/backup.db\" && gzip -c /tmp/backup.db && rm -f /tmp/backup.db'" \
  > cz-vednemesicnik-backup-$(date +%Y-%m-%d).db.gz
```

The resulting file lands in your current directory, already named with the current
date. Verify it before trusting it:

```shell
gzip -t cz-vednemesicnik-backup-*.db.gz && echo "OK"
```

## After migrating to Tigris

Once `STORE_DRIVER=tigris` is in effect, backups get both simpler and faster:

- **Images** are durable in the bucket, so there is nothing extra to back up — skip
  the [image-store `tar`](#backing-up-the-image-store-volume-driver) entirely.
  (Optional defense-in-depth: keep a periodic offsite/second-region copy of the
  bucket.)
- **The database** can be pushed straight into object storage from the app machine,
  which has fast egress — instead of streaming it down through the slow WireGuard
  tunnel. Only the small control command rides the tunnel; the payload takes the
  fast link, and you pull it back over plain HTTPS.

Store backups under a sibling prefix in the shared bucket — `s3://$BUCKET_NAME/db/`.
This is safe next to the images: the image store only ever touches its own `images/`
prefix — a seed/reset (`imageStore.delete([''])` in `prisma/seed.ts`) wipes just
`images/`, not the whole bucket — so backups under `db/` are never affected. (A
dedicated backups bucket is fine too if you want stricter isolation; just adjust the
paths below.)

```shell
# Back up into the bucket under db/ (fast egress off the app machine)
fly ssh console --app cz-vednemesicnik -C "sh -c '\
  sqlite3 \"\$DATABASE_URL\" \".backup /tmp/backup.db\" && gzip -f /tmp/backup.db && \
  aws s3 cp /tmp/backup.db.gz \"s3://\$BUCKET_NAME/db/backup-\$(date +%F).db.gz\" \
    --endpoint-url \"\$AWS_ENDPOINT_URL_S3\" && rm -f /tmp/backup.db.gz'"
```

Then pull it locally over HTTPS (via the AWS CLI configured with the same Tigris
credentials, or a temporary presigned URL). List what's there and copy the exact
key — don't assume today's date, since the backup may have been taken on a
different day:

```shell
aws s3 ls "s3://$BUCKET_NAME/db/" --endpoint-url https://fly.storage.tigris.dev
aws s3 cp "s3://$BUCKET_NAME/db/backup-<YYYY-MM-DD>.db.gz" . \
  --endpoint-url https://fly.storage.tigris.dev
gzip -t backup-*.db.gz && echo "OK"
```

> A scheduled job can wrap the command above; backups under `db/` are isolated from
> the image-store lifecycle by prefix.

## Backing up the image store (volume driver)

The pre-generated image variants live as files under `/data/images` on the volume.
With the [proxy from the setup step](#setup-do-this-once-per-session) running, stream a
`tar` archive straight down over `ssh`:

```shell
ssh -p 10022 -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
  root@localhost "tar -czf - -C /data images" \
  > cz-vednemesicnik-images-$(date +%Y-%m-%d).tar.gz
```

Throughput is capped by the WireGuard tunnel (~150 KB/s), so a ~50 MB store takes a
few minutes — but it completes reliably.

> **Why not `rsync`?** `rsync` needs the binary on **both** ends, and the Fly
> container does not ship it — so the classic `rsync -e "ssh -p 10022" …` recipe can
> never work here. (Recent macOS also replaced `rsync` with `openrsync`, which rejects
> the remote-source syntax anyway.) Raw `ssh` + `tar` only relies on `ssh` and `tar`,
> both of which the container has.

Verify the archive is complete before trusting it — the important step, since a
truncated download otherwise looks fine:

```shell
gzip -t cz-vednemesicnik-images-*.tar.gz && echo "OK"
tar -tzf cz-vednemesicnik-images-*.tar.gz | wc -l   # file count sanity check
```

> **Bit-for-bit paranoia?** Build the archive on the volume, record its checksum, then
> compare after downloading:
>
> ```shell
> # on the server: build + print checksum
> fly ssh console --app cz-vednemesicnik \
>   -C "sh -c 'tar -czf /data/images-backup.tar.gz -C /data images && sha256sum /data/images-backup.tar.gz'"
>
> # download over the proxy
> ssh -p 10022 -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
>   root@localhost "cat /data/images-backup.tar.gz" > images.tar.gz
>
> # compare locally, then clean up the server
> shasum -a 256 images.tar.gz
> fly ssh console --app cz-vednemesicnik -C "rm -f /data/images-backup.tar.gz"
> ```
