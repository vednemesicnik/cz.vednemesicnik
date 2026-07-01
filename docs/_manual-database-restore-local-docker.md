# Manual database restore (local Docker)

## Quick start: test a production database locally

End-to-end flow to boot this branch's image, restore a downloaded production
backup, and populate the image store. Detailed steps are in the sections below.

```shell
# 1) Build & start the container (image from this branch)
docker compose --file docker/local/docker-compose.yml up -d --build

# 2) Restore the downloaded production DB
docker cp cz-vednemesicnik-backup-YYYY-MM-DD.db.gz vdm_app_container:/data/backup.db.gz
docker exec vdm_app_container gunzip /data/backup.db.gz
docker exec vdm_app_container sqlite3 /data/sqlite.db ".restore /data/backup.db"
docker exec vdm_app_container rm /data/backup.db

# 3) Restart so the entrypoint applies migrations to the restored DB
docker restart vdm_app_container

# 4) Backfill the image store inside the container → fills /data/images
docker exec vdm_app_container node /app/build/migrate-images.mjs

# 5) Open the app
open http://localhost:8080
```

> Steps 3–4 are required when the restored database predates the image-store
> rollout — otherwise pages render **without images** (see
> [Backfilling the image store](#backfilling-the-image-store-after-restoring-a-pre-migration-database)).

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

## Backfilling the image store (after restoring a pre-migration database)

A production database taken before the image-store rollout still holds images as
in-DB `blob` columns. The new read path serves pre-generated files from
`/data/images` instead, so after restoring such a database you must apply the
schema migration and run the one-time backfill — otherwise pages render **without
images** (the app does not crash; image slots are simply empty).

1. Restart the container so the entrypoint re-applies migrations to the restored
   database (adds the nullable image-store columns).
```shell
docker restart vdm_app_container
```
2. Run the bundled backfill inside the container. It generates the variant files
   into `/data/images` and fills the new columns (idempotent — safe to re-run).
```shell
docker exec vdm_app_container node /app/build/migrate-images.mjs
```
3. Open the app and verify images load.
```shell
open http://localhost:8080
```

> The backfill is bundled into the image at build time (`build/migrate-images.mjs`).
> If you changed the app, rebuild first: `docker compose --file
> docker/local/docker-compose.yml up -d --build`.