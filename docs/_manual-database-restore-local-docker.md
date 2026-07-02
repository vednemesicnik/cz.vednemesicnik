# Manual database restore (local Docker)

## Quick start: test a production database locally

End-to-end flow to boot this branch's image and restore a downloaded production
backup. Detailed steps are in the sections below.

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

# 4) Open the app
open http://localhost:8080
```

> Images live on the volume (`/data/images`), not in the database, so a DB-only
> restore renders pages with **empty image slots** (the app does not crash). To see
> images, restore the `/data/images` volume from the same backup alongside the DB —
> see [`_manual-database-backup.md`](./_manual-database-backup.md).

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

> Images are served from the `/data/images` volume, not the database. A DB-only
> restore therefore renders **empty image slots** (the app does not crash). To
> populate them, restore the `/data/images` volume from the same backup — see
> [`_manual-database-backup.md`](./_manual-database-backup.md).