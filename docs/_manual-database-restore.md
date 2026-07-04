# Manual database restore

> **Important:** the database references image files by `id` + `version` and issue
> PDFs by `id`. Both image binaries and issue PDFs live outside the DB, in the object
> store. Restoring the database together with the object stores keeps both in sync.
> - **Volume driver (`STORE_DRIVER=volume`):** restore the object stores (images and
>   PDFs) from the matching backup date together with the database, so the stored
>   files line up with the rows referencing them (see
>   [Restoring the object stores](#restoring-the-object-stores-volume-driver)).
> - **Tigris driver (`STORE_DRIVER=tigris`):** the images and PDFs live durably in
>   the bucket and are not restored from a DB backup. Just make sure the restored
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

## Restoring the object stores (volume driver)

Restore the image and PDF files from the archive created during backup. This replaces
the current contents of `/data/images` and `/data/pdfs`. (Not needed on the Tigris
driver — the bucket is the durable copy.)

1. SSH into the sftp shell.
```shell
fly ssh sftp shell --app cz-vednemesicnik
```
2. Upload the object-store archive to the app directory.
```shell
put /path/to/cz-vednemesicnik-stores-YYYY-MM-DD.tar.gz /app/stores-backup.tar.gz
```
3. Exit the sftp shell by pressing `Ctrl`+`D`.
4. SSH into the console.
```shell
fly ssh console --app cz-vednemesicnik
```
5. Replace the current object stores with the archive contents (the archive holds
   both the `images` and `pdfs` directories).
```shell
rm -rf /data/images /data/pdfs
tar -xzf /app/stores-backup.tar.gz -C /data
```
6. Delete the uploaded archive from the app directory.
```shell
rm /app/stores-backup.tar.gz
```
7. Exit the console by pressing `Ctrl`+`D`.