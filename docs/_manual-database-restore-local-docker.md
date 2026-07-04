# Manual database restore (local Docker)

## Quick start: test a production database locally

End-to-end flow to boot this branch's image and restore a downloaded production
backup (database **and** object stores). Detailed steps are in the sections below.

```shell
# 1) Build & start the container (image from this branch)
docker compose --file docker/local/docker-compose.yml up -d --build

# 2) Restore the downloaded production DB
docker cp cz-vednemesicnik-backup-YYYY-MM-DD.db.gz vdm_app_container:/data/backup.db.gz
docker exec vdm_app_container gunzip /data/backup.db.gz
docker exec vdm_app_container sqlite3 /data/sqlite.db ".restore /data/backup.db"
docker exec vdm_app_container rm /data/backup.db

# 3) Restore the downloaded object stores (images + PDFs) into the volume
docker cp cz-vednemesicnik-stores-YYYY-MM-DD.tar.gz vdm_app_container:/data/stores.tar.gz
docker exec vdm_app_container sh -c 'rm -rf /data/images /data/pdfs && tar -xzf /data/stores.tar.gz -C /data && rm /data/stores.tar.gz'

# 4) Restart so the entrypoint applies migrations to the restored DB
#    (this is where the blob/contentType columns get dropped)
docker restart vdm_app_container

# 5) Open the app
open http://localhost:8080
```

## Testing the VACUUM (reclaim space after the blob drop)

A restored **production** DB still carries the legacy in-DB image blobs. The migration
applied on restart (step 4) drops the `blob`/`contentType` columns, which frees pages
*inside* the SQLite file but does **not** shrink the file on disk until a `VACUUM`.
This is the one-off step from [`_deploy-to-fly.md`](./_deploy-to-fly.md) — test it here
before running it in production.

```shell
# Size right after migrations (still bloated — freed pages not yet reclaimed)
docker exec vdm_app_container ls -lh /data/sqlite.db

# Compact the database
docker exec vdm_app_container sqlite3 /data/sqlite.db 'VACUUM;'

# Size after VACUUM — should be dramatically smaller
docker exec vdm_app_container ls -lh /data/sqlite.db
```

`VACUUM` cannot run inside a migration (SQLite forbids it in a transaction), which is
why it is a separate manual step. The app keeps working throughout.

## How to manually restore the database in local Docker environment

1. Start the Docker container if it is not already running.
```shell
docker compose --file docker/local/docker-compose.yml up -d
```
2. Upload the backup file to the container.
```shell
docker cp /path/to/cz-vednemesicnik-backup-YYYY-MM-DD.db.gz vdm_app_container:/data/backup.db.gz
```
3. Unzip the backup file.
```shell
docker exec vdm_app_container gunzip /data/backup.db.gz
```
4. Restore the database file by copying it with the `.restore` command.
```shell
docker exec vdm_app_container sqlite3 /data/sqlite.db ".restore /data/backup.db"
```
5. Delete the unzipped backup file from the container.
```shell
docker exec vdm_app_container rm /data/backup.db
```

## How to restore the object stores in local Docker environment

Images and issue PDFs are served from the `/data/images` and `/data/pdfs` volume
directories, not the database. A DB-only restore renders **empty image slots** and
broken `/archive/<file>.pdf` downloads (the app does not crash); restore the archive
to populate them.

1. Upload the object-store archive to the container.
```shell
docker cp /path/to/cz-vednemesicnik-stores-YYYY-MM-DD.tar.gz vdm_app_container:/data/stores.tar.gz
```
2. Replace the existing `/data/images` and `/data/pdfs` directories with the archive contents, then remove the archive. The archive contains top-level `images/` and `pdfs/` folders, so it extracts to `/data/images` and `/data/pdfs`.
```shell
docker exec vdm_app_container sh -c 'rm -rf /data/images /data/pdfs && tar -xzf /data/stores.tar.gz -C /data && rm /data/stores.tar.gz'
```

See [`_manual-database-backup.md`](./_manual-database-backup.md) for how to create the
archive.