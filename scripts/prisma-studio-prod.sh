#!/bin/sh -e

# Runs Prisma Studio against the production database over a Fly tunnel.
# Starts Studio on the Fly machine, opens a local `fly proxy` to it, and tears
# both down on Ctrl+C (with a remote pkill so Studio never orphans on the
# machine). See docs/_prisma-studio-on-production.md for the manual equivalent.
#
# Usage: pnpm prisma:studio:prod
# Env:   FLY_APP (default cz-vednemesicnik), PORT (default 5555)
#
# Prerequisite: a fresh Fly SSH certificate in your agent:
#   fly ssh issue --agent -o <your-org-slug>

APP="${FLY_APP:-cz-vednemesicnik}"
PORT="${PORT:-5555}"

# PORT is interpolated into a remotely executed shell command, so reject anything
# non-numeric before it can break quoting or inject.
case "$PORT" in
  '' | *[!0-9]*) echo "PORT must be a number (1–65535), got '$PORT'." >&2; exit 1 ;;
esac
if [ "$PORT" -lt 1 ] || [ "$PORT" -gt 65535 ]; then
  echo "PORT must be between 1 and 65535, got '$PORT'." >&2
  exit 1
fi

cleanup() {
  # Stop the local proxy and the ssh session…
  [ -n "$STUDIO_PID" ] && kill "$STUDIO_PID" 2>/dev/null || true
  # …then make sure Studio is really gone on the machine, TTY or not. Scope the
  # match to this port so we don't kill another admin's Studio session.
  fly ssh console --app "$APP" -C "pkill -f 'prisma studio --port $PORT'" >/dev/null 2>&1 || true
  echo "🧹 Stopped Prisma Studio and closed the tunnel."
}
# `0` (not EXIT) is the portable exit-trap condition for POSIX /bin/sh (dash);
# INT/TERM re-exit so cleanup runs exactly once, on the way out.
trap cleanup 0
trap 'exit 130' INT
trap 'exit 143' TERM

echo "🚀 Starting Prisma Studio on $APP (port $PORT, not publicly exposed)…"
fly ssh console --app "$APP" -C \
  "sh -c 'cd /app && HOST=0.0.0.0 pnpm prisma:studio --port $PORT --browser none'" &
STUDIO_PID=$!

# Give Studio a moment to bind before the proxy forwards to it.
sleep 3

echo "🔌 Tunnel open → http://localhost:$PORT  (Ctrl+C to stop)"
fly proxy "$PORT:$PORT" --app "$APP"
