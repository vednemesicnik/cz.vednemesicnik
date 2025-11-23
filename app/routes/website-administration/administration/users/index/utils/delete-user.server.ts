import { prisma } from "~/utils/db.server"
import { throwDbError } from "~/utils/throw-db-error.server"

export const deleteUser = async (id: string) => {
  try {
    await prisma.user.delete({
      where: { id },
    })
  } catch (error) {
    throwDbError(error, "Unable to delete the user.")
  }
}
