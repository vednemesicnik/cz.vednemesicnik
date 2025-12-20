import { prisma } from '~/utils/db.server'
import { throwDbError } from '~/utils/throw-db-error.server'

type Args = {
  id: string
  key: string
  pluralLabel: string
  newOrder: number
  currentOrder: number
}

export async function updatePosition({
  id,
  key,
  pluralLabel,
  newOrder,
  currentOrder,
}: Args) {
  try {
    await prisma.$transaction(async (prisma) => {
      // Set the target position's order to a temporary value
      await prisma.editorialBoardPosition.update({
        data: { order: 0 },
        where: { id },
      })

      // Adjust the orders of other positions
      if (newOrder > currentOrder) {
        // Decrease the order of positions between currentOrder and newOrder
        const positionsToUpdate = await prisma.editorialBoardPosition.findMany({
          orderBy: {
            order: 'asc',
          },
          where: {
            order: {
              gt: currentOrder,
              lte: newOrder,
            },
          },
        })

        for (const position of positionsToUpdate) {
          await prisma.editorialBoardPosition.update({
            data: { order: position.order - 1 },
            where: { id: position.id },
          })
        }
      }

      if (newOrder < currentOrder) {
        // Increase the order of positions between newOrder and currentOrder
        const positionsToUpdate = await prisma.editorialBoardPosition.findMany({
          orderBy: {
            order: 'desc',
          },
          where: {
            order: {
              gte: newOrder,
              lt: currentOrder,
            },
          },
        })

        for (const position of positionsToUpdate) {
          await prisma.editorialBoardPosition.update({
            data: { order: position.order + 1 },
            where: { id: position.id },
          })
        }
      }

      // Update the order of the target position to the new order
      await prisma.editorialBoardPosition.update({
        data: { key, order: newOrder, pluralLabel },
        where: { id },
      })
    })

    return { positionId: id }
  } catch (error) {
    return throwDbError(error, 'Unable to update the editorial board position.')
  }
}
