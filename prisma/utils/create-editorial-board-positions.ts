import type { PrismaClient } from '@generated/prisma/client'
import { users } from '~~/data/users'

export type EditorialBoardPositionsData = {
  key: 'chief-editor' | 'editor' | 'proofreader' | 'artist' | 'developer'
  pluralLabel: string
  order: number
}[]

export const createEditorialBoardPositions = async (
  prisma: PrismaClient,
  data: EditorialBoardPositionsData,
) => {
  const user = await prisma.user.findUniqueOrThrow({
    select: { authorId: true },
    where: { email: users[0].email },
  })

  for (const position of data) {
    await prisma.editorialBoardPosition
      .create({
        data: {
          author: {
            connect: { id: user.authorId },
          },
          key: position.key,
          order: position.order,
          pluralLabel: position.pluralLabel,
        },
      })
      .catch((error) => {
        console.error(
          'Error creating an editorial board member position:',
          error,
        )
        return null
      })
  }
}
