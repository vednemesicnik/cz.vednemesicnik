import type { PrismaClient } from "@prisma/client"

export type AuthorData = {
  name: string
}

export const createAuthor = async (prisma: PrismaClient, data: AuthorData) => {
  return await prisma.author
    .create({
      data: {
        name: data.name,
      },
    })
    .catch((error) => {
      console.error("Error creating an author:", error)
      return null
    })
}
