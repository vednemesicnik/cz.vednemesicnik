# Base node image
FROM node:26-slim AS base

# Set node environment
ENV NODE_ENV=production

# Install dependencies for database
RUN apt-get update && apt-get install -y openssl sqlite3

# Install pnpm globally, pinned for reproducible builds. Baked into the shared
# base stage, so the runtime image has pnpm available offline — the entrypoint
# runs pnpm at startup. Keep the version in sync with the "packageManager" field
# in package.json (the project's declared pnpm version).
RUN npm install -g pnpm@12.16.1

# Install all node_modules, including dev dependencies
FROM base AS deps

# The image mirrors the repository under /srv: the host at the root, each application
# under apps/. Only the manifests here, so the install layer stays cached until a
# dependency changes.
WORKDIR /srv

ADD package.json pnpm-lock.yaml pnpm-workspace.yaml ./
ADD apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile

# Setup production node_modules
FROM base AS production-deps

WORKDIR /srv

ADD package.json pnpm-lock.yaml pnpm-workspace.yaml ./
ADD apps/web/package.json apps/web/package.json
RUN pnpm install --prod --frozen-lockfile

# Build the web
FROM base AS build

# Set DATABASE_URL for Prisma generation
ENV DATABASE_URL="file:/data/sqlite.db"

WORKDIR /srv

COPY --from=deps /srv/node_modules /srv/node_modules
COPY --from=deps /srv/apps/web/node_modules /srv/apps/web/node_modules

# Only the web, so a change elsewhere in the repository doesn't rebuild it. The root
# manifest and the workspace file let the root scripts below forward to it.
ADD package.json pnpm-workspace.yaml ./
ADD apps/web apps/web

# Run the Prisma type generator
RUN pnpm prisma:generate

# Generate the GAS response types from the committed schemas (offline)
RUN pnpm gas:types:generate

# Run the build
RUN pnpm app:build

# Finally, build the production image with minimal footprint
FROM base

ENV BASE_URL="http://localhost:8080"
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

# Add shortcut for seeding owner user
ADD scripts/seed-owner.sh /usr/local/bin/seed-owner
RUN chmod +x /usr/local/bin/seed-owner

# Add shortcut for the object-store CLI (S3/Tigris bucket). Locally it targets the
# s3mock service behind the "tigris" compose profile — run it inside the container
# with `docker compose exec app object-store ls`.
ADD apps/web/scripts/object-store.sh /usr/local/bin/object-store
RUN chmod +x /usr/local/bin/object-store

WORKDIR /srv

COPY --from=production-deps /srv/node_modules /srv/node_modules
COPY --from=production-deps /srv/apps/web/node_modules /srv/apps/web/node_modules
# pnpm-workspace.yaml carries verifyDepsBeforeRun: false, which stops pnpm
# from reinstalling the full (dev) dependency tree over the network when the
# entrypoint runs `pnpm prisma:migrate:deploy` at startup. It also lists apps/*,
# so the root script can forward to the web.
COPY pnpm-workspace.yaml package.json ./
# The host that serves the build (app:start), run by Node's type stripping.
COPY server.ts ./
COPY server server
# Sentry instrument — app:start-with-sentry --imports it, so it must be in the image.
COPY instrument.server.ts ./
COPY scripts/docker-entry-point-local.sh scripts/docker-entry-point.sh

# The web: its build, the generated clients, and what migrations and the CLIs read.
COPY --from=build /srv/apps/web/build apps/web/build
COPY --from=build /srv/apps/web/generated apps/web/generated
COPY apps/web/package.json apps/web/prisma.config.ts apps/web/
COPY apps/web/constants/env.ts apps/web/constants/env.ts
COPY apps/web/prisma/schema.prisma apps/web/prisma/schema.prisma
COPY apps/web/prisma/migrations apps/web/prisma/migrations
COPY apps/web/app/utils/sentry/scrub-sentry-event.ts apps/web/app/utils/sentry/scrub-sentry-event.ts
COPY apps/web/scripts/object-store-cli.ts apps/web/scripts/object-store-cli.ts
# The statutes the membership application links to.
COPY apps/web/documents apps/web/documents

ENTRYPOINT [ "/srv/scripts/docker-entry-point.sh" ]
