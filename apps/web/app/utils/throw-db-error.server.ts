import { Prisma } from '@generated/prisma/client'

export const throwDbError = (error: unknown, message: string): never => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Raw Prisma details (table and constraint names) stay in the server log only.
    console.error(`Database error ${error.code}: ${message}`, error.message)
    throw new Response(message, { status: 400 })
  }

  throw error
}
