import { prisma } from "~/utils/db.server"
import { getConvertedImageStream } from "~/utils/sharp.server"
import { throwDbError } from "~/utils/throw-db-error.server"

type Args = {
  title: string
  slug: string
  description: string
  cover: File
  authorId: string
}

export async function createPodcast({
  title,
  slug,
  description,
  cover,
  authorId,
}: Args) {
  const convertedCover = await getConvertedImageStream(cover, {
    width: 1280,
    height: 1280,
    quality: 80,
    format: "jpeg",
  })

  try {
    const podcast = await prisma.podcast.create({
      data: {
        title,
        slug,
        description,
        cover: {
          create: {
            altText: `Obálka podcastu ${title}`,
            contentType: convertedCover.contentType,
            blob: Uint8Array.from(await convertedCover.stream.toBuffer()),
          },
        },
        state: "draft",
        authorId: authorId,
      },
    })

    return {
      podcastId: podcast.id,
    }
  } catch (error) {
    return throwDbError(error, "Unable to create the podcast.")
  }
}
