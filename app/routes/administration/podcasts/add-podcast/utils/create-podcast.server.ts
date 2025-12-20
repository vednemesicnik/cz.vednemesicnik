import { prisma } from '~/utils/db.server'
import { getConvertedImageStream } from '~/utils/sharp.server'
import { throwDbError } from '~/utils/throw-db-error.server'

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
    format: 'jpeg',
    height: 1280,
    quality: 80,
    width: 1280,
  })

  try {
    const podcast = await prisma.podcast.create({
      data: {
        authorId: authorId,
        cover: {
          create: {
            altText: `Obálka podcastu ${title}`,
            blob: Uint8Array.from(await convertedCover.stream.toBuffer()),
            contentType: convertedCover.contentType,
          },
        },
        description,
        slug,
        title,
      },
    })

    return {
      podcastId: podcast.id,
    }
  } catch (error) {
    return throwDbError(error, 'Unable to create the podcast.')
  }
}
