import { Prisma } from "@prisma/client"

import { prisma } from "~/utils/db.server"

type Args = {
  fullName: string
  positionIds: string[]
}

export async function addMember({ fullName, positionIds }: Args) {
  try {
    await prisma.editorialBoardMember.create({
      data: {
        name: fullName, // TODO: change in Prisma schema to fullName
        positions: {
          connect: positionIds.map((positionId) => ({ id: positionId })),
        },
        author: {
          connect: { username: "owner" },
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
