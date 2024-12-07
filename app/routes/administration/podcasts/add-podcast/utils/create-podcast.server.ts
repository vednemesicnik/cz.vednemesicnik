import { prisma } from "~/utils/db.server"
import { throwDbError } from "~/utils/throw-db-error.server"

type Args = {
  cover: File
  title: string
  slug: string
  description: string
  authorId: string
}

export async function createPodcast({
  cover,
  title,
  slug,
  description,
  authorId,
}: Args) {
  try {
    await prisma.podcast.create({
      data: {
        title,
        slug,
        description,
        cover: {
          create: {
            altText: `Obálka podcastu ${title}`,
            contentType: cover.type,
            blob: Uint8Array.from(await cover.bytes()),
          },
        },
        publishedAt: new Date(),
        state: "published",
        author: {
          connect: { id: authorId },
        },
      },
    })

    return { ok: true }
  } catch (error) {
    throwDbError(error, "Unable to create the podcast.")
  }
}
