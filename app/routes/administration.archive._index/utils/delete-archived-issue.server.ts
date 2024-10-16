import { Prisma } from "@prisma/client"

import { prisma } from "~/utils/db.server"

export const deleteArchivedIssue = async (id: string) => {
  try {
    await prisma.archivedIssue.delete({
      where: { id },
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new Response(
        `Error ${error.code}: Unable to delete the archived issue. ${error.message}`,
        {
          status: 400,
        }
      )
    }

    throw error
  }
}
