import { prisma } from "~/utils/db.server"
import { throwDbError } from "~/utils/throw-db-error.server"

export async function deleteLink(id: string) {
  try {
    await prisma.podcastEpisodeLink.delete({
      where: { id },
    })
  } catch (error) {
    throwDbError(error, "Unable to delete the link.")
  }
}
