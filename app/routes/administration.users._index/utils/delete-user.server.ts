import { prisma } from "~/utils/db.server"
import { throwDbError } from "~/utils/throw-db-error.server"

export const deleteUser = async (id: string) => {
  if (process.env.PERMANENT_USER_ID === id) {
    throw new Response("Error: Unable to delete the user.", {
      status: 400,
    })
  }

  try {
    await prisma.user.delete({
      where: { id },
    })
  } catch (error) {
    throwDbError(error, "Unable to delete the user.")
  }
}
