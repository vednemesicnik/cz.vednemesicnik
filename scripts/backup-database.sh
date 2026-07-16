#!/bin/sh

# Backs up the production SQLite database to the Tigris bucket under db/.
# Runs the whole payload on the app machine (fast egress) over `fly ssh console`:
# sqlite3 .backup -> gzip -> integrity check -> upload -> verify -> prune. The S3
# parts use the in-image `object-store` CLI (scripts/object-store-cli.ts over
# @aws-sdk, baked in as /usr/local/bin/object-store) — the image ships no `aws`
# binary. The machine already has $DATABASE_URL, $BUCKET_NAME and the Tigris
# credentials in its environment.
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

# Remote payload. Everything here runs on the machine: $DATABASE_URL, $KEY and the
# object-store credentials expand THERE (kept literal inside single quotes below);
# only ${SUFFIX} is spliced in locally. Prints BACKUP_OK as the final line iff the
# backup + upload + verify all succeeded — the caller greps for it so a failure (or
# a truncated stream) can never masquerade as success.
# The key carries a full timestamp (not just the date) so a second migration deploy
# on the same day can't overwrite the morning's backup; the temp file is PID-scoped
# ($$) so a concurrent quarterly + deploy run can't upload each other's torn file.
# The EXIT trap (0, dash-portable) removes the plaintext snapshot even on failure so
# no unencrypted DB copy is ever left on the machine.
REMOTE_SCRIPT='set -e
T=/tmp/backup-$$.db
trap "rm -f $T $T.gz" 0
KEY="db/backup-$(date +%F-%H%M%S)'"$SUFFIX"'.db.gz"
sqlite3 "$DATABASE_URL" ".backup $T"
gzip -f "$T"
gzip -t "$T.gz"
object-store put "$T.gz" "$KEY"
object-store stat "$KEY" >/dev/null
rm -f "$T.gz"
# Retention: drop db/ backups older than 2 years. Best-effort — never fails the
# job, the backup above already succeeded. ISO date -> YYYYMMDD integer compare.
CUTOFF=$(date -d "-2 years" +%Y%m%d)
object-store ls db/ | while read -r _ NAME; do
  case "$NAME" in
    db/backup-*.db.gz)
      D=$(printf "%s" "$NAME" | cut -c11-20 | tr -d -)
      case "$D" in
        [0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9])
          [ "$D" -lt "$CUTOFF" ] && object-store rm "$NAME" || true ;;
      esac ;;
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
