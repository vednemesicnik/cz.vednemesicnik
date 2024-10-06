import type { PrismaClient } from "@prisma/client"

export type EditorialBoardPositionsData = {
  key: "chief-editor" | "editor" | "proofreader" | "artist" | "developer"
  pluralLabel: string
  order: number
}[]

export const createEditorialBoardPositions = async (
  prisma: PrismaClient,
  data: EditorialBoardPositionsData
) => {
  for (const position of data) {
    await prisma.editorialBoardPosition
      .create({
        data: {
          key: position.key,
          pluralLabel: position.pluralLabel,
          order: position.order,
          author: {
            connect: { username: "owner" },
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
