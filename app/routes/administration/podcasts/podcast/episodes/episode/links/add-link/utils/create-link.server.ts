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
    const link = await prisma.podcastEpisodeLink.create({
      data: {
        label,
        url,
        episode: {
          connect: { id: episodeId },
        },
        publishedAt: new Date(),
        state: "published",
        author: {
          connect: { id: authorId },
        },
      },
      select: {
        id: true,
      },
    })

    return { linkId: link.id }
  } catch (error) {
    return throwDbError(error, "Unable to create the link.")
  }
}
