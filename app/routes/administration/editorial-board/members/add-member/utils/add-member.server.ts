import { prisma } from "~/utils/db.server"
import { throwDbError } from "~/utils/throw-db-error.server"

type Args = {
  fullName: string
  positionIds: string[]
  authorId: string
}

export async function addMember({ fullName, positionIds, authorId }: Args) {
  try {
    const member = await prisma.editorialBoardMember.create({
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

    return {
      memberId: member.id,
    }
  } catch (error) {
    return throwDbError(error, "Unable to add the editorial board member.")
  }
}
