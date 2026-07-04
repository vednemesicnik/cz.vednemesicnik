# Manual database restore

> **Important:** the database references image files by `id` + `version`.
> - **Volume driver (`STORE_DRIVER=volume`):** restore the image store from the
>   matching backup date together with the database, so the stored files line up with
>   the rows referencing them (see
>   [Restoring the image store](#restoring-the-image-store-volume-driver)).
> - **Tigris driver (`STORE_DRIVER=tigris`):** the images live durably in the
>   bucket and are not restored from a DB backup. Just make sure the restored
>   database's `id`/`version` values match the objects still present in the bucket
>   (they do, unless the bucket was independently pruned).

## How to manually restore the database
1. SSH into the sftp shell.
```shell
fly ssh sftp shell --app cz-vednemesicnik
```
2. Upload the backup file to the app directory.
```shell
put /path/to/cz-vednemesicnik-backup-YYYY-MM-DD.db.gz /app/backup.db.gz
```
3. Exit the sftp shell by pressing `Ctrl`+`D`.
4. SSH into the console.
```shell
fly ssh console --app cz-vednemesicnik
```
5. Unzip the backup file.
```shell
gunzip /app/backup.db.gz
```
6. Restore the database file by copying it with the `.restore` command.
```shell
sqlite3 $DATABASE_URL ".restore /app/backup.db"
```
7. Delete the unzipped backup file from the app directory.
```shell
rm /app/backup.db
```
8. Exit the console by pressing `Ctrl`+`D`.

## Restoring the image store (volume driver)

Restore the image files from the archive created during backup. This replaces the
current contents of `/data/images`. (Not needed on the Tigris driver — the bucket is
the durable copy.)

1. SSH into the sftp shell.
```shell
fly ssh sftp shell --app cz-vednemesicnik
```
2. Upload the image archive to the app directory.
```shell
put /path/to/cz-vednemesicnik-images-YYYY-MM-DD.tar.gz /app/images-backup.tar.gz
```
3. Exit the sftp shell by pressing `Ctrl`+`D`.
4. SSH into the console.
```shell
fly ssh console --app cz-vednemesicnik
```
5. Replace the current image store with the archive contents.
```shell
rm -rf /data/images
tar -xzf /app/images-backup.tar.gz -C /data
```
6. Delete the uploaded archive from the app directory.
```shell
rm /app/images-backup.tar.gz
```
7. Exit the console by pressing `Ctrl`+`D`.