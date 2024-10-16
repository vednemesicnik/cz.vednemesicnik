import { Prisma } from "@prisma/client"

import { prisma } from "~/utils/db.server"

type Args = {
  order: number
  key: string
  pluralLabel: string
}

export async function addPosition({ order, key, pluralLabel }: Args) {
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
            connect: { username: "owner" },
          },
        },
      })
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new Response(
        `Error ${error.code}: Unable to add the editorial board position. ${error.message}`,
        {
          status: 400,
        }
      )
    }
  }
}
