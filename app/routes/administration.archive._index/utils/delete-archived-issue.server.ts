import { prisma } from "~/utils/db.server"
import { throwDbError } from "~/utils/throw-db-error.server"

export const deleteArchivedIssue = async (id: string) => {
  try {
    await prisma.archivedIssue.delete({
      where: { id },
    })
  } catch (error) {
    throwDbError(error, "Unable to delete the archived issue.")
  }
}
