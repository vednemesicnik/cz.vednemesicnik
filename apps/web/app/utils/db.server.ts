import { remember } from '@epic-web/remember'
import { PrismaClient } from '@generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

export const prisma = remember('prisma', () => {
  const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL,
  })

  const client = new PrismaClient({
    adapter,
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'stdout', level: 'error' },
      { emit: 'stdout', level: 'warn' },
    ],
  })

  client.$on('query', (event) => {
    console.info(`prisma:query - ${event.duration}ms - ${event.query}`)
  })

  client.$connect()

  return client
})
