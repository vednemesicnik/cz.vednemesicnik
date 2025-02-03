# Manual database restore

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