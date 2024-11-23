import { prisma } from "~/utils/db.server"
import { throwDbError } from "~/utils/throw-db-error.server"
import { throwError } from "~/utils/throw-error.server"
import { type RoleName } from "~~/types/role"

export const deleteUser = async (id: string) => {
  const userToDelete = await prisma.user.findUnique({
    where: { id },
    select: {
      role: { select: { name: true } },
    },
  })

  const owner: RoleName = "owner"

  // Owner cannot be deleted
  if (userToDelete === null || userToDelete.role.name === owner) {
    throwError("Unable to delete the user.")
  }

  try {
    await prisma.user.delete({
      where: { id },
    })
  } catch (error) {
    throwDbError(error, "Unable to delete the user.")
  }
}
