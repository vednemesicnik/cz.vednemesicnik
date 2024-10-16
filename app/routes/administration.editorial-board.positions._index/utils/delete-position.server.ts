import { Prisma } from "@prisma/client"

import { prisma } from "~/utils/db.server"

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
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new Response(
        `Error ${error.code}: Unable to delete the editorial board position. ${error.message}`,
        {
          status: 400,
        }
      )
    }
  }
}
