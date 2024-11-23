import { prisma } from "~/utils/db.server"
import { throwDbError } from "~/utils/throw-db-error.server"

type Args = {
  id: string
  fullName: string
  positionIds: string[]
  authorId: string
}

export async function updateMember({
  id,
  fullName,
  positionIds,
  authorId,
}: Args) {
  try {
    await prisma.editorialBoardMember.update({
      where: { id },
      data: {
        fullName,
        positions: {
          set: positionIds.map((positionId) => ({ id: positionId })),
        },
        author: { connect: { id: authorId } },
      },
    })
  } catch (error) {
    throwDbError(error, "Unable to update the editorial board member.")
  }
}
