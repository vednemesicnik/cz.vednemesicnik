import { remember } from "@epic-web/remember"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"

import { PrismaClient } from "@generated/prisma/client"

export const prisma = remember("prisma", () => {
  const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL,
  })

  const client = new PrismaClient({
    adapter,
    log: [
      { level: "query", emit: "event" },
      { level: "error", emit: "stdout" },
      { level: "warn", emit: "stdout" },
    ],
  })

  client.$on("query", (event) => {
    console.info(`prisma:query - ${event.duration}ms - ${event.query}`)
  })

  client.$connect()

  return client
})
