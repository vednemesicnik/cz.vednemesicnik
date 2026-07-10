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

cleanup() {
  # Stop the local proxy and the ssh session…
  [ -n "$STUDIO_PID" ] && kill "$STUDIO_PID" 2>/dev/null || true
  # …then make sure Studio is really gone on the machine, TTY or not.
  fly ssh console --app "$APP" -C "pkill -f 'prisma studio'" >/dev/null 2>&1 || true
  echo "🧹 Stopped Prisma Studio and closed the tunnel."
}
trap cleanup EXIT INT TERM

echo "🚀 Starting Prisma Studio on $APP (port $PORT, not publicly exposed)…"
fly ssh console --app "$APP" -C \
  "sh -c 'cd /app && HOST=0.0.0.0 pnpm prisma:studio --port $PORT --browser none'" &
STUDIO_PID=$!

# Give Studio a moment to bind before the proxy forwards to it.
sleep 3

echo "🔌 Tunnel open → http://localhost:$PORT  (Ctrl+C to stop)"
fly proxy "$PORT:$PORT" --app "$APP"
