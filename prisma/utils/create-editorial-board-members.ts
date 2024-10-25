import type { PrismaClient } from "@prisma/client"

export type EditorialBoardMembersData = {
  fullName: string
  positions: {
    key: string
  }[]
}[]

export const createEditorialBoardMembers = async (
  prisma: PrismaClient,
  data: EditorialBoardMembersData
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
            connect: { username: "owner" },
          },
        },
      })
      .catch((error) => {
        console.error("Error creating an editorial board member:", error)
        return null
      })
  }
}
