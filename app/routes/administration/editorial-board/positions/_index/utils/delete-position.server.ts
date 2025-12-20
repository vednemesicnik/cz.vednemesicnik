import { prisma } from '~/utils/db.server'
import { throwDbError } from '~/utils/throw-db-error.server'

export async function deletePosition(id: string) {
  try {
    await prisma.$transaction(async (prisma) => {
      // Delete the position and get its order
      const { order: deletedPositionOrder } =
        await prisma.editorialBoardPosition.delete({
          where: { id },
        })

      // Get the positions with order greater than the deleted position's order
      const positionsToUpdate = await prisma.editorialBoardPosition.findMany({
        orderBy: {
          order: 'asc',
        },
        where: {
          order: {
            gt: deletedPositionOrder,
          },
        },
      })

      for (const position of positionsToUpdate) {
        await prisma.editorialBoardPosition.update({
          data: {
            order: position.order - 1,
          },
          where: { id: position.id },
        })
      }
    })
  } catch (error) {
    throwDbError(error, 'Unable to delete the editorial board position.')
  }
}
