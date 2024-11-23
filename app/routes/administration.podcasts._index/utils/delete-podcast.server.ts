import { prisma } from "~/utils/db.server"
import { throwDbError } from "~/utils/throw-db-error.server"

export const deletePodcast = async (id: string) => {
  try {
    await prisma.podcast.delete({
      where: { id },
    })
  } catch (error) {
    throwDbError(error, "Unable to delete the podcast.")
  }
}
