import { Prisma } from "@prisma/client"

import { prisma } from "~/utils/db.server"

type Args = {
  fullName: string
  positionIds: string[]
  authorId: string
}

export async function addMember({ fullName, positionIds, authorId }: Args) {
  try {
    await prisma.editorialBoardMember.create({
      data: {
        fullName,
        positions: {
          connect: positionIds.map((positionId) => ({ id: positionId })),
        },
        author: {
          connect: { id: authorId },
        },
      },
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new Response(
        `Error ${error.code}: Unable to add the editorial board member. ${error.message}`,
        {
          status: 400,
        }
      )
    }

    throw error
  }
}
