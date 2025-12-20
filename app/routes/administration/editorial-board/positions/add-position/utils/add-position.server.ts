import { prisma } from '~/utils/db.server'
import { throwDbError } from '~/utils/throw-db-error.server'

type Args = {
  order: number
  key: string
  pluralLabel: string
  authorId: string
}

export async function addPosition({ order, key, pluralLabel, authorId }: Args) {
  try {
    const position = await prisma.$transaction(async (prisma) => {
      // Update the orders of existing positions
      const positions = await prisma.editorialBoardPosition.findMany({
        orderBy: {
          order: 'desc',
        },
        where: {
          order: {
            gte: order,
          },
        },
      })

      for (const position of positions) {
        await prisma.editorialBoardPosition.update({
          data: { order: position.order + 1 },
          where: { id: position.id },
        })
      }

      // Create the new position
      return await prisma.editorialBoardPosition.create({
        data: {
          author: {
            connect: { id: authorId },
          },
          key,
          order,
          pluralLabel,
        },
      })
    })

    return { positionId: position.id }
  } catch (error) {
    return throwDbError(error, `Unable to add the editorial board position.`)
  }
}
