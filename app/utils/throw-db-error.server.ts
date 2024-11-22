import { Prisma } from "@prisma/client"

export const throwDbError = (error: unknown, message?: string) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    throw new Response(`Error ${error.code}: ${message} ${error.message}`, {
      status: 400,
    })
  }

  throw error
}
