#!/bin/sh -ex

# Run db migrations
npm run prisma:migrate:deploy

# Start the server
npm run start
