import type { PrismaClient } from "@prisma/client"

export type EditorialBoardMembersData = {
  fullName: string
  positions: {
    key: string
  }[]
}[]

export const createEditorialBoardMembers = async (
  prisma: PrismaClient,
  data: EditorialBoardMembersData,
  authorId: string
) => {
  for (const member of data) {
    await prisma.editorialBoardMember
      .create({
        data: {
          fullName: member.fullName,
          positions: {
            connect: member.positions,
          },
          author: {
            connect: { id: authorId },
          },
        },
      })
      .catch((error) => {
        console.error("Error creating an editorial board member:", error)
        return null
      })
  }
}
