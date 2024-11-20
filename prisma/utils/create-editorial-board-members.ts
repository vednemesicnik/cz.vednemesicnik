import type { PrismaClient } from "@prisma/client"

import { users } from "~~/data/users"

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
  const user = await prisma.user.findUniqueOrThrow({
    where: { email: users[0].email },
    select: { authorId: true },
  })

  for (const member of data) {
    await prisma.editorialBoardMember
      .create({
        data: {
          fullName: member.fullName,
          positions: {
            connect: member.positions,
          },
          author: {
            connect: { id: user.authorId },
          },
        },
      })
      .catch((error) => {
        console.error("Error creating an editorial board member:", error)
        return null
      })
  }
}
