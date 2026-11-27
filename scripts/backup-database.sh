#!/bin/sh

# Backs up the production SQLite databases (the web's and Publikace's) to the Tigris
# bucket under db/.
# Runs the whole payload on the app machine (fast egress) over `fly ssh console`:
# sqlite3 .backup -> gzip -> integrity check -> upload -> verify -> prune. The S3
# parts use the in-image `object-store` CLI (apps/web/scripts/object-store-cli.ts over
# @aws-sdk, baked in as /usr/local/bin/object-store) — the image ships no `aws`
# binary. The machine already has $DATABASE_URL, $PUBLIKACE_DATABASE_PATH, $BUCKET_NAME
# and the Tigris credentials in its environment.
#
# Usage: sh ./scripts/backup-database.sh [key-suffix]   (pnpm db:backup)
#   key-suffix — optional, e.g. -pre-migration for the deploy-time backup.
# Env: FLY_APP (default cz-vednemesicnik), FLY_API_TOKEN (for CI; flyctl reads it).
#
# See docs/_manual-database-backup.md and the callers backup.yml / deploy.yml.

# Callers invoke this as `sh ./scripts/backup-database.sh`, which ignores shebang
# flags, so enable errexit here in the body rather than on the shebang.
set -e

SUFFIX="${1:-}"

# The suffix is spliced into a remotely executed command, so allow only an empty
# value or a strict kebab flag like -pre-migration.
case "$SUFFIX" in
  '' | -[a-z][a-z-]*) : ;;
  *) echo "Invalid key suffix '$SUFFIX' (expected empty or e.g. -pre-migration)." >&2; exit 1 ;;
esac

FLY_APP="${FLY_APP:-cz-vednemesicnik}"

# Remote payload. Everything here runs on the machine: $DATABASE_URL,
# $PUBLIKACE_DATABASE_PATH, $STAMP and the object-store credentials expand THERE (kept
# literal inside single quotes below); only ${SUFFIX} is spliced in locally. Prints
# BACKUP_OK as the final line iff every backup + upload + verify succeeded — the caller
# greps for it so a failure (or a truncated stream) can never masquerade as success.
# Two databases share the volume: the web's under db/backup-…, Publikace's under
# db/publikace-backup-…, one timestamp for both. A machine whose image predates
# Publikace has no PUBLIKACE_DATABASE_PATH, and a Publikace that never started (its
# configuration refused) has no file yet; either skips Publikace with a line, so a
# Publikace problem never blocks the web's backup. Publikace creates the file at the
# path this reads, so the two cannot point at different files.
# The key carries a full timestamp (not just the date) so a second migration deploy
# on the same day can't overwrite the morning's backup; the temp files are PID-scoped
# ($$) so a concurrent quarterly + deploy run can't upload each other's torn file.
# The EXIT trap (0, dash-portable) removes the plaintext snapshots even on failure so
# no unencrypted DB copy is ever left on the machine.
REMOTE_SCRIPT='set -e
WEB=/tmp/backup-$$-web.db
PUBLIKACE=/tmp/backup-$$-publikace.db
trap "rm -f $WEB $WEB.gz $PUBLIKACE $PUBLIKACE.gz" 0
STAMP=$(date +%F-%H%M%S)
backup() {
  sqlite3 "$1" ".backup $2"
  gzip -f "$2"
  gzip -t "$2.gz"
  object-store put "$2.gz" "$3"
  object-store stat "$3" >/dev/null
  rm -f "$2.gz"
  echo "Uploaded $3"
}
backup "$DATABASE_URL" "$WEB" "db/backup-$STAMP'"$SUFFIX"'.db.gz"
if [ -z "$PUBLIKACE_DATABASE_PATH" ]; then
  echo "No PUBLIKACE_DATABASE_PATH on this machine; Publikace skipped."
elif [ ! -f "$PUBLIKACE_DATABASE_PATH" ]; then
  echo "WARNING: $PUBLIKACE_DATABASE_PATH does not exist (Publikace never started); Publikace skipped."
else
  backup "$PUBLIKACE_DATABASE_PATH" "$PUBLIKACE" "db/publikace-backup-$STAMP'"$SUFFIX"'.db.gz"
fi
# Retention: drop db/ backups older than 2 years. Best-effort — never fails the
# job, the backups above already succeeded. ISO date -> YYYYMMDD integer compare;
# the date starts right after each prefix (10 and 20 characters).
CUTOFF=$(date -d "-2 years" +%Y%m%d)
object-store ls db/ | while read -r _ NAME; do
  case "$NAME" in
    db/backup-*.db.gz) D=$(printf "%s" "$NAME" | cut -c11-20 | tr -d -) ;;
    db/publikace-backup-*.db.gz) D=$(printf "%s" "$NAME" | cut -c21-30 | tr -d -) ;;
    *) continue ;;
  esac
  case "$D" in
    [0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9])
      [ "$D" -lt "$CUTOFF" ] && object-store rm "$NAME" || true ;;
  esac
done || true
echo BACKUP_OK'

echo "Backing up $FLY_APP database to the bucket under db/ (suffix: '${SUFFIX:-none}')…"

# Capture so we can both surface the machine output and assert the success marker.
# Disable errexit only around the flyctl call so we always reach the marker check
# and can print the machine output even when flyctl exits non-zero.
set +e
OUTPUT=$(flyctl ssh console --app "$FLY_APP" -C "sh -c '$REMOTE_SCRIPT'" 2>&1)
STATUS=$?
set -e
printf '%s\n' "$OUTPUT"

case "$OUTPUT" in
  *BACKUP_OK*) echo "✅ Backup uploaded and verified." ;;
  *) echo "❌ Backup did not complete (no success marker; flyctl exit $STATUS)." >&2; exit 1 ;;
esac
