import { Prisma } from "@prisma/client"

import { prisma } from "~/utils/db.server"

type Args = {
  id: string
  fullName: string
  positionIds: string[]
}

export async function updateMember({ id, fullName, positionIds }: Args) {
  try {
    await prisma.editorialBoardMember.update({
      where: { id },
      data: {
        name: fullName, // TODO: change in Prisma schema to fullName
        positions: {
          set: positionIds.map((positionId) => ({ id: positionId })),
        },
      },
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new Response(
        `Error ${error.code}: Unable to update the editorial board member. ${error.message}`,
        {
          status: 400,
        }
      )
    }

    throw error
  }
}
