# Manual database restore (local Docker)

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