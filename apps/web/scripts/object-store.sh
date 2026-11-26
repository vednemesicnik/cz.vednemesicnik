#!/bin/sh -e

# Wrapper baked into the production image as /usr/local/bin/object-store. Runs
# the TypeScript CLI directly via Node 26 native type stripping (no tsx).
exec node /srv/apps/web/scripts/object-store-cli.ts "$@"
