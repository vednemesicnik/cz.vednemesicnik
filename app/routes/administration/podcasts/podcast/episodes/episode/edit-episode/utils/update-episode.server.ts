import { prisma } from "~/utils/db.server"
import { throwDbError } from "~/utils/throw-db-error.server"

type Args = {
  id: string
  number: number
  title: string
  slug: string
  description: string
  authorId: string
}

export async function updateEpisode({
  id,
  number,
  title,
  slug,
  description,
  authorId,
}: Args) {
  try {
    await prisma.podcastEpisode.update({
      where: { id },
      data: {
        number,
        title,
        slug,
        description,
        authorId,
      },
    })
  } catch (error) {
    throwDbError(error, "Unable to update the episode.")
  }
}
