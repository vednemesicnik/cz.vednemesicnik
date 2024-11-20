#!/bin/sh -ex

npm run prisma:migrate:deploy
npm run start
