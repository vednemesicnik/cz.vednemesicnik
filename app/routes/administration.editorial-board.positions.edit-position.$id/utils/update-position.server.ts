import { prisma } from "~/utils/db.server"
import { throwDbError } from "~/utils/throw-db-error.server"

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
        where: { id },
        data: { order: 0 },
      })

      // Adjust the orders of other positions
      if (newOrder > currentOrder) {
        // Decrease the order of positions between currentOrder and newOrder
        const positionsToUpdate = await prisma.editorialBoardPosition.findMany({
          where: {
            order: {
              gt: currentOrder,
              lte: newOrder,
            },
          },
          orderBy: {
            order: "asc",
          },
        })

        for (const position of positionsToUpdate) {
          await prisma.editorialBoardPosition.update({
            where: { id: position.id },
            data: { order: position.order - 1 },
          })
        }
      }

      if (newOrder < currentOrder) {
        // Increase the order of positions between newOrder and currentOrder
        const positionsToUpdate = await prisma.editorialBoardPosition.findMany({
          where: {
            order: {
              gte: newOrder,
              lt: currentOrder,
            },
          },
          orderBy: {
            order: "desc",
          },
        })

        for (const position of positionsToUpdate) {
          await prisma.editorialBoardPosition.update({
            where: { id: position.id },
            data: { order: position.order + 1 },
          })
        }
      }

      // Update the order of the target position to the new order
      await prisma.editorialBoardPosition.update({
        where: { id },
        data: { order: newOrder, key, pluralLabel },
      })
    })
  } catch (error) {
    throwDbError(error, "Unable to update the editorial board position.")
  }
}
