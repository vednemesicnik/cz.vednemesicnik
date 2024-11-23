import { prisma } from "~/utils/db.server"
import { throwDbError } from "~/utils/throw-db-error.server"

type Args = {
  label: string
  url: string
  episodeId: string
  authorId: string
}

export async function createLink({ label, url, episodeId, authorId }: Args) {
  try {
    await prisma.podcastEpisodeLink.create({
      data: {
        label,
        url,
        episode: {
          connect: { id: episodeId },
        },
        publishedAt: new Date(),
        published: true,
        author: {
          connect: { id: authorId },
        },
      },
    })
  } catch (error) {
    throwDbError(error, "Unable to create the link.")
  }
}
