#!/bin/sh -e

# Wrapper baked into the production image as /usr/local/bin/object-store. Runs
# the TypeScript CLI directly via Node 26 native type stripping (no tsx).
exec node /app/scripts/object-store-cli.ts "$@"
