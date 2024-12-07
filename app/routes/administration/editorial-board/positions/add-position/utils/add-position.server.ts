import { prisma } from "~/utils/db.server"
import { throwDbError } from "~/utils/throw-db-error.server"

type Args = {
  order: number
  key: string
  pluralLabel: string
  authorId: string
}

export async function addPosition({ order, key, pluralLabel, authorId }: Args) {
  try {
    await prisma.$transaction(async (prisma) => {
      // Update the orders of existing positions
      const positions = await prisma.editorialBoardPosition.findMany({
        where: {
          order: {
            gte: order,
          },
        },
        orderBy: {
          order: "desc",
        },
      })

      for (const position of positions) {
        await prisma.editorialBoardPosition.update({
          where: { id: position.id },
          data: { order: position.order + 1 },
        })
      }

      // Create the new position
      await prisma.editorialBoardPosition.create({
        data: {
          key,
          pluralLabel,
          order,
          author: {
            connect: { id: authorId },
          },
        },
      })
    })

    return { ok: true }
  } catch (error) {
    throwDbError(error, `Unable to add the editorial board position.`)
  }
}
