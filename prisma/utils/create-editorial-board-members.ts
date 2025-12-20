import type { PrismaClient } from '@generated/prisma/client'
import { users } from '~~/data/users'

export type EditorialBoardMembersData = {
  fullName: string
  positions: {
    key: string
  }[]
}[]

export const createEditorialBoardMembers = async (
  prisma: PrismaClient,
  data: EditorialBoardMembersData,
) => {
  const user = await prisma.user.findUniqueOrThrow({
    select: { authorId: true },
    where: { email: users[0].email },
  })

  for (const member of data) {
    await prisma.editorialBoardMember
      .create({
        data: {
          author: {
            connect: { id: user.authorId },
          },
          fullName: member.fullName,
          positions: {
            connect: member.positions,
          },
        },
      })
      .catch((error) => {
        console.error('Error creating an editorial board member:', error)
        return null
      })
  }
}
