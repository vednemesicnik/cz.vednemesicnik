import { prisma } from "~/utils/db.server"
import { throwDbError } from "~/utils/throw-db-error.server"

export async function deleteEpisode(id: string) {
  try {
    await prisma.podcastEpisode.delete({
      where: { id },
    })
  } catch (error) {
    throwDbError(error, "Unable to delete the episode.")
  }
}
