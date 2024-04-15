import type { PrismaClient } from "@prisma/client"

export type EditorialBoardMembersData = {
  name: string
  positions: {
    key: string
  }[]
}[]

export const createEditorialBoardMembers = async (prisma: PrismaClient, data: EditorialBoardMembersData) => {
  for (const member of data) {
    await prisma.editorialBoardMember
      .create({
        data: {
          name: member.name,
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
