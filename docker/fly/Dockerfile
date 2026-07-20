# syntax=docker/dockerfile:1
# Pin the Dockerfile frontend so every builder (incl. Fly's Depot) uses the same
# feature set — notably the `env=` secret-mount target below — instead of the
# builder's default, which may be older and reject newer keys.

# Base node image
FROM node:26-slim AS base

# Set node environment
ENV NODE_ENV=production

# Install system dependencies: openssl + sqlite3 for the database, and
# ca-certificates so CLI tools with their own TLS stack (notably sentry-cli, which
# uploads source maps during the build) can verify HTTPS certificates. node:26-slim
# ships without CA certs; Node's bundled store covers the app but not sentry-cli.
RUN apt-get update && apt-get install -y ca-certificates openssl sqlite3

# Install pnpm globally, pinned for reproducible builds. Baked into the shared
# base stage, so the runtime image has pnpm available offline — the entrypoint
# runs pnpm at startup. Keep the version in sync with the "packageManager" field
# in package.json (the project's declared pnpm version).
RUN npm install -g pnpm@11.9.0

# Install all node_modules, including dev dependencies
FROM base AS deps

WORKDIR /app

ADD package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

# Setup production node_modules
FROM base AS production-deps

WORKDIR /app

ADD package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --prod --frozen-lockfile

# Build the app
FROM base AS build

# Set DATABASE_URL for Prisma generation
ENV DATABASE_URL="file:/data/sqlite.db"

# Sentry org/project are non-secret build-time inputs for source-map upload. Only
# the auth token is a secret (mounted below); these two just identify the target.
ARG SENTRY_ORG
ARG SENTRY_PROJECT
ENV SENTRY_ORG=$SENTRY_ORG
ENV SENTRY_PROJECT=$SENTRY_PROJECT

WORKDIR /app

COPY --from=deps /app/node_modules /app/node_modules

ADD . .

# Run the Prisma type generator
RUN pnpm prisma:generate

# Run the build. SENTRY_AUTH_TOKEN is mounted as a BuildKit build secret and exposed
# to this step only (never baked into a layer). The `env=` target needs the pinned
# frontend (see the `# syntax` directive at the top). The secret is optional: absent
# → the var is empty and the vite/RR config skips Sentry entirely, so a token-less
# build still succeeds.
RUN --mount=type=secret,id=sentry_auth_token,env=SENTRY_AUTH_TOKEN \
    pnpm app:build

# Finally, build the production image with minimal footprint
FROM base

ENV BASE_URL="https://vednemesicnik.cz"
ENV DATABASE_URL="file:/data/sqlite.db"
# Pre-generated image variants and issue PDFs live on the mounted volume, next to
# the SQLite DB.
ENV IMAGE_STORE_PATH="/data/images"
ENV PDF_STORE_PATH="/data/pdfs"
ENV HOST="0.0.0.0"
ENV PORT="8080"
# For WAL support: https://github.com/prisma/prisma-engines/issues/4675#issuecomment-1914383246
ENV PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK="1"

# Add shortcut for connecting to database CLI
ADD scripts/database-cli.sh /usr/local/bin/database-cli
RUN chmod +x /usr/local/bin/database-cli

# Add shortcut for the object-store CLI (S3/Tigris bucket over `fly ssh`). The
# CLI is a Node 26 TypeScript file run via native type stripping, reusing the
# already-bundled @aws-sdk/client-s3 — no extra dependency, no tsx.
ADD scripts/object-store.sh /usr/local/bin/object-store
RUN chmod +x /usr/local/bin/object-store

WORKDIR /app

COPY --from=production-deps /app/node_modules /app/node_modules
# pnpm-workspace.yaml carries verifyDepsBeforeRun: false, which stops pnpm 11
# from reinstalling the full (dev) dependency tree over the network when the
# entrypoint runs `pnpm prisma:migrate:deploy` at startup.
COPY --from=build /app/pnpm-workspace.yaml /app/pnpm-workspace.yaml
COPY --from=build /app/build /app/build
COPY --from=build /app/generated /app/generated
COPY --from=build /app/package.json /app/package.json
# Sentry instrument — app:start-with-sentry --imports it, so it must be in the image.
COPY --from=build /app/instrument.server.ts /app/instrument.server.ts
COPY --from=build /app/prisma.config.ts /app/prisma.config.ts
COPY --from=build /app/constants/env.ts /app/constants/env.ts
COPY --from=build /app/prisma/schema.prisma /app/prisma/schema.prisma
COPY --from=build /app/prisma/migrations /app/prisma/migrations
COPY --from=build /app/scripts/object-store-cli.ts /app/scripts/object-store-cli.ts
COPY --from=build /app/scripts/docker-entry-point-fly.sh /app/scripts/docker-entry-point.sh

ENTRYPOINT [ "/app/scripts/docker-entry-point.sh" ]
