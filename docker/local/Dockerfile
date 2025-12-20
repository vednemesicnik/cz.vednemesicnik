# Base node image
FROM node:22-slim AS base

# Set node environment
ENV NODE_ENV=production

# Install dependencies for database
RUN apt-get update && apt-get install -y openssl sqlite3

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

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

WORKDIR /app

COPY --from=deps /app/node_modules /app/node_modules

ADD . .

# Run the Prisma type generator
RUN pnpm prisma:generate

# Run the build
RUN pnpm build

# Finally, build the production image with minimal footprint
FROM base

ENV DATABASE_URL="file:/data/sqlite.db"
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

WORKDIR /app

COPY --from=production-deps /app/node_modules /app/node_modules
COPY --from=build /app/build /app/build
COPY --from=build /app/generated /app/generated
COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/prisma.config.ts /app/prisma.config.ts
COPY --from=build /app/constants/env.ts /app/constants/env.ts
COPY --from=build /app/prisma/schema.prisma /app/prisma/schema.prisma
COPY --from=build /app/prisma/migrations /app/prisma/migrations
COPY --from=build /app/scripts/docker-entry-point-local.sh /app/scripts/docker-entry-point.sh

ENTRYPOINT [ "/app/scripts/docker-entry-point.sh" ]
