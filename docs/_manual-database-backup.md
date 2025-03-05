# Manual database backup

Next to the automatic snapshots, taken by Fly.io every 24 hours, stored for 5 days, it could be useful to manually back up the database to a local machine or another cloud storage. 
SQLite database is a single file, so it is easy to copy it to another location.

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
mv /path/to/backup.db.gz /path/to/backup-$(date +%Y-%m-%d).db.gz
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
