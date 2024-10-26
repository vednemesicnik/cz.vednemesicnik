import { remember } from "@epic-web/remember"
import { PrismaClient } from "@prisma/client"

export const prisma = remember("prisma", () => {
  const client = new PrismaClient({
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
