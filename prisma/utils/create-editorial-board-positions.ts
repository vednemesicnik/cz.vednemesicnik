import type { PrismaClient } from "@prisma/client"

import { users } from "~~/data/users"

export type EditorialBoardPositionsData = {
  key: "chief-editor" | "editor" | "proofreader" | "artist" | "developer"
  pluralLabel: string
  order: number
}[]

export const createEditorialBoardPositions = async (
  prisma: PrismaClient,
  data: EditorialBoardPositionsData
) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { email: users[0].email },
    select: { authorId: true },
  })

  for (const position of data) {
    await prisma.editorialBoardPosition
      .create({
        data: {
          key: position.key,
          pluralLabel: position.pluralLabel,
          order: position.order,
          author: {
            connect: { id: user.authorId },
          },
        },
      })
      .catch((error) => {
        console.error(
          "Error creating an editorial board member position:",
          error
        )
        return null
      })
  }
}
