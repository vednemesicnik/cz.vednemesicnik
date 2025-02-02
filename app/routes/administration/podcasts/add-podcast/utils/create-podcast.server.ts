import { prisma } from "~/utils/db.server"
import { convertImage } from "~/utils/sharp.server"
import { throwDbError } from "~/utils/throw-db-error.server"

type Args = {
  cover: File
  title: string
  slug: string
  description: string
  authorId: string
  publishedAt: string
}

export async function createPodcast({
  cover,
  title,
  slug,
  description,
  authorId,
  publishedAt,
}: Args) {
  const convertedCover = await convertImage(cover, {
    width: "1280",
    height: "1280",
    quality: "80",
    format: "jpeg",
  })

  try {
    await prisma.podcast.create({
      data: {
        title,
        slug,
        description,
        cover: {
          create: {
            altText: `Obálka podcastu ${title}`,
            contentType: convertedCover.contentType,
            blob: convertedCover.blob,
          },
        },
        publishedAt: new Date(publishedAt),
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
