import { prisma } from "~/utils/db.server"
import { throwDbError } from "~/utils/throw-db-error.server"

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
        where: {
          order: {
            gt: deletedPositionOrder,
          },
        },
        orderBy: {
          order: "asc",
        },
      })

      for (const position of positionsToUpdate) {
        await prisma.editorialBoardPosition.update({
          where: { id: position.id },
          data: {
            order: position.order - 1,
          },
        })
      }
    })
  } catch (error) {
    throwDbError(error, "Unable to delete the editorial board position.")
  }
}
