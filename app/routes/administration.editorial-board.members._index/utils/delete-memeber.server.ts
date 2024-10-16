import { Prisma } from "@prisma/client"

import { prisma } from "~/utils/db.server"

export async function deleteMemeber(id: string) {
  try {
    await prisma.editorialBoardMember.delete({
      where: { id },
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new Response(
        `Error ${error.code}: Unable to delete the editorial board member. ${error.message}`,
        {
          status: 400,
        }
      )
    }
  }
}
