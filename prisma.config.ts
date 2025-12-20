// noinspection JSUnusedGlobalSymbols

import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

import { ENV_KEYS } from './constants/env'

export default defineConfig({
  datasource: {
    url: env(ENV_KEYS.DATABASE_URL),
  },
  migrations: {
    path: './prisma/migrations',
    seed: 'tsx ./prisma/seed.ts',
  },
  schema: './prisma/schema.prisma',
})
