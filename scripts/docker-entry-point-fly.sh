#!/bin/sh -ex

# Run db migrations
pnpm prisma:migrate:deploy

# Start the server
pnpm app:start
