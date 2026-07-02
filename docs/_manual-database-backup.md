# Manual database backup

Next to the automatic snapshots, taken by Fly.io every 24 hours, stored for 5 days, it could be useful to manually back up the database to a local machine or another cloud storage. 
SQLite database is a single file, so it is easy to copy it to another location.

> **Important:** binary image data no longer lives in the database. Pre-generated
> image variants are stored as files under `/data/images` on the same Fly volume.
> A database backup alone is **not** a complete backup — back up the image store as
> well (see [Backing up the image store](#backing-up-the-image-store)). The image
> files are the only copy of the image data.

> **Why not `fly ssh sftp get`?** The SFTP transfer runs over an extra protocol
> layer on top of the WireGuard tunnel and is painfully slow. Streaming the backup
> straight to stdout over `fly ssh console` bypasses that layer and is much faster.
> Each step below is a single command run from your **local machine** — no separate
> SSH session, no temporary files left on the volume to clean up afterwards.

## How to manually back up the database

`sqlite3 .backup` needs a destination file, so the snapshot is written to a temp
path inside the container, streamed out gzipped, and the temp file is removed — all
in one command.

```shell
fly ssh console --app cz-vednemesicnik \
  -C "sh -c 'sqlite3 \"\$DATABASE_URL\" \".backup /tmp/backup.db\" && gzip -c /tmp/backup.db && rm -f /tmp/backup.db'" \
  > cz-vednemesicnik-backup-$(date +%Y-%m-%d).db.gz
```

The resulting file lands in your current directory, already named with the current
date.

## Backing up the image store

The pre-generated image variants live as files under `/data/images` on the volume.
`tar` streams a compressed archive directly to stdout — nothing is written to the
volume.

```shell
fly ssh console --app cz-vednemesicnik \
  -C "tar -czf - -C /data images" \
  > cz-vednemesicnik-images-$(date +%Y-%m-%d).tar.gz
```

> **Tip:** for repeated image-store backups, `rsync` over `fly proxy` only transfers
> changed files, making every backup after the first nearly instant:
>
> ```shell
> # in one terminal
> fly proxy 10022:22 --app cz-vednemesicnik
>
> # in another
> rsync -avz -e "ssh -p 10022" root@localhost:/data/images/ ./images-backup/
> ```
