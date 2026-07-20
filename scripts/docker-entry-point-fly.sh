#!/bin/sh -ex

# Run db migrations
pnpm prisma:migrate:deploy

# Start the server with the Sentry instrument (loaded via --import inside the script)
pnpm app:start-with-sentry
