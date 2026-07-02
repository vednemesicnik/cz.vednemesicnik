# Manual database backup

Next to the automatic snapshots, taken by Fly.io every 24 hours, stored for 5 days, it could be useful to manually back up the database to a local machine or another cloud storage. 
SQLite database is a single file, so it is easy to copy it to another location.

> **Important:** binary image data no longer lives in the database. Pre-generated
> image variants are stored as files under `/data/images` on the same Fly volume.
> A database backup alone is **not** a complete backup — back up the image store as
> well (see [Backing up the image store](#backing-up-the-image-store)). The image
> files are the only copy of the image data.

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

## Backing up the image store

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
