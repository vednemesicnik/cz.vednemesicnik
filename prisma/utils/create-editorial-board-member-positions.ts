import type { PrismaClient } from "@prisma/client"

export type EditorialBoardMemberPositionsData = {
  key: "chief-editor" | "editor" | "proofreader" | "artist" | "developer"
  label: string
  order: number
}[]

export const createEditorialBoardMemberPositions = async (
  prisma: PrismaClient,
  data: EditorialBoardMemberPositionsData
) => {
  for (const position of data) {
    await prisma.editorialBoardMemberPosition
      .create({
        data: {
          key: position.key,
          label: position.label,
          order: position.order,
          author: {
            connect: { username: "owner" },
          },
        },
      })
      .catch((error) => {
        console.error("Error creating an editorial board member position:", error)
        return null
      })
  }
}
