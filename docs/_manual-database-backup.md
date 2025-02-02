# Manual database backup

Next to the automatic snapshots, taken by Fly.io every 24 hours, stored for 5 days, it could be useful to manually back up the database to a local machine or another cloud storage. 
SQLite database is a single file, so it is easy to copy it to another location.

## How to manually back up the database
1. SSH into the Fly.io instance.
```shell
fly ssh console --app cz-vednemesicnik
```
2. Back up the database file by copying it with the `.backup` command.
```shell
sqlite3 $DATABASE_URL ".backup /app/backup-$(date +%Y-%m-%d).db"
```
3. Zip the backup file.
```shell
gzip /app/backup-$(date +%Y-%m-%d).db
```
4. Download the zipped backup file to the local machine in the new terminal window.
```shell
fly ssh sftp get --app cz-vednemesicnik /app/backup-$(date +%Y-%m-%d).db.gz ~/Downloads/cz-vednemesicnik-backup-$(date +%Y-%m-%d).db.gz
```
5. Delete the zipped backup file from the app directory.
```shell
rm /app/backup-$(date +%Y-%m-%d).db.gz
```
