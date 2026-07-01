# Manual database backup

Next to the automatic snapshots, taken by Fly.io every 24 hours, stored for 5 days, it could be useful to manually back up the database to a local machine or another cloud storage. 
SQLite database is a single file, so it is easy to copy it to another location.

> **Important:** binary image data no longer lives in the database. Pre-generated
> image variants are stored as files under `/data/images` on the same Fly volume.
> A database backup alone is **not** a complete backup — back up the image store as
> well (see [Backing up the image store](#backing-up-the-image-store)). The image
> files are the only copy of the image data.

## How to manually back up the database
1. SSH into console.
```shell
fly ssh console --app cz-vednemesicnik
```
2. Back up the database file by copying it with the `.backup` command.
```shell
sqlite3 $DATABASE_URL ".backup /app/backup.db"
```
3. Zip the backup file.
```shell
gzip /app/backup.db
```
4. Exit the console by pressing `Ctrl`+`D`.
5. SSH in to the sftp shell.
```shell
fly ssh sftp shell --app cz-vednemesicnik
```
6. Download the zipped backup file.
```shell
get /app/backup.db.gz /path/to/backup.db.gz
```
7. Exit the sftp shell by pressing `Ctrl`+`D`.
8. Rename the downloaded file to include the current date.
```shell
mv /path/to/backup.db.gz /path/to/cz-vednemesicnik-backup-$(date +%Y-%m-%d).db.gz
```
9. SSH into the console again.
```shell
fly ssh console --app cz-vednemesicnik
```
10. Delete the zipped backup file from the app directory.
```shell
rm /app/backup.db.gz
```
11. Exit the console by pressing `Ctrl`+`D`.

## Backing up the image store

The pre-generated image variants live as files under `/data/images` on the volume.
Back them up as a single compressed archive.

1. SSH into console.
```shell
fly ssh console --app cz-vednemesicnik
```
2. Create a compressed archive of the image store.
```shell
tar -czf /app/images-backup.tar.gz -C /data images
```
3. Exit the console by pressing `Ctrl`+`D`.
4. SSH in to the sftp shell.
```shell
fly ssh sftp shell --app cz-vednemesicnik
```
5. Download the archive.
```shell
get /app/images-backup.tar.gz /path/to/images-backup.tar.gz
```
6. Exit the sftp shell by pressing `Ctrl`+`D`.
7. Rename the downloaded file to include the current date.
```shell
mv /path/to/images-backup.tar.gz /path/to/cz-vednemesicnik-images-$(date +%Y-%m-%d).tar.gz
```
8. SSH into the console again and delete the archive from the app directory.
```shell
fly ssh console --app cz-vednemesicnik
rm /app/images-backup.tar.gz
```
9. Exit the console by pressing `Ctrl`+`D`.
