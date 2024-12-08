import { prisma } from "~/utils/db.server"
import { convertImage } from "~/utils/sharp.server"
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
  const convertedCover = await convertImage(cover, {
    width: "1280",
    height: "1280",
    quality: "100",
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
            blob: Uint8Array.from(convertedCover.blob),
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
