# Base node image
FROM node:22-slim AS base

# Set node environment
ENV NODE_ENV=production

# Install dependencies for database
RUN apt-get update && apt-get install -y openssl sqlite3

# Install all node_modules, including dev dependencies
FROM base AS deps

WORKDIR /app

ADD package.json package-lock.json ./
RUN npm ci --include=dev

# Setup production node_modules
FROM base AS production-deps

WORKDIR /app

COPY --from=deps /app/node_modules /app/node_modules
ADD package.json package-lock.json ./
RUN npm prune --omit=dev

# Build the app
FROM base AS build

WORKDIR /app

COPY --from=deps /app/node_modules /app/node_modules

ADD . .

# Run the Prisma type generator
RUN npm run prisma:generate

# Run the build
RUN npm run build

# Finally, build the production image with minimal footprint
FROM base

ENV DATABASE_FILENAME="sqlite.db"
ENV DATABASE_DIR="/data"
ENV DATABASE_PATH="$DATABASE_DIR/$DATABASE_FILENAME"
ENV DATABASE_URL="file:$DATABASE_PATH"
ENV INTERNAL_PORT="8081"
ENV PORT="8080"
# For WAL support: https://github.com/prisma/prisma-engines/issues/4675#issuecomment-1914383246
ENV PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK="1"

# Add shortcut for connecting to database CLI
ADD scripts/database-cli.sh /usr/local/bin/database-cli
RUN chmod +x /usr/local/bin/database-cli

WORKDIR /app

COPY --from=production-deps /app/node_modules /app/node_modules
COPY --from=build /app/node_modules/.prisma /app/node_modules/.prisma
COPY --from=build /app/build/server /app/build/server
COPY --from=build /app/build/client /app/build/client
COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/prisma/schema.prisma /app/prisma/schema.prisma
COPY --from=build /app/prisma/migrations /app/prisma/migrations
COPY --from=build /app/scripts/docker-entry-point.sh /app/scripts/docker-entry-point.sh

ENTRYPOINT [ "/app/scripts/docker-entry-point.sh" ]
