#!/bin/sh -ex

# Run db migrations
pnpm prisma:migrate:deploy

# Start the server with the Sentry instrument, as `pnpm app:start-with-sentry` does. exec,
# and node rather than pnpm, so the stop signal reaches the server: neither sh nor pnpm
# passes it on, and the container was killed instead of closing its connections.
exec node --enable-source-maps --import ./instrument.server.ts server.ts
