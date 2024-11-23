import { prisma } from "~/utils/db.server"
import { throwDbError } from "~/utils/throw-db-error.server"

export async function deleteMember(id: string) {
  try {
    await prisma.editorialBoardMember.delete({
      where: { id },
    })
  } catch (error) {
    throwDbError(error, "Unable to delete the editorial board member.")
  }
}
