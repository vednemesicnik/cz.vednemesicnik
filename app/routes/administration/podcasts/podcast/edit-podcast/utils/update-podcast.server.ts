import { createId } from '@paralleldrive/cuid2'

import { prisma } from '~/utils/db.server'
import { getConvertedImageStream } from '~/utils/sharp.server'
import { throwDbError } from '~/utils/throw-db-error.server'

type Args = {
  id: string
  title: string
  slug: string
  description: string
  coverId: string
  cover?: File
  authorId: string
}

export async function updatePodcast({
  id,
  title,
  slug,
  description,
  coverId,
  cover,
  authorId,
}: Args) {
  const coverAltText = `Obálka podcastu ${title}`
  const convertedCover = cover
    ? await getConvertedImageStream(cover, {
        format: 'jpeg',
        height: 1280,
        quality: 80,
        width: 1280,
      })
    : undefined

  try {
    await prisma.podcast.update({
      data: {
        authorId: authorId,
        cover: {
          update: {
            data:
              convertedCover !== undefined
                ? {
                    altText: coverAltText,
                    blob: Uint8Array.from(
                      await convertedCover.stream.toBuffer(),
                    ),
                    contentType: convertedCover.contentType,
                    id: createId(), // New ID forces browser to download new image
                  }
                : {
                    altText: coverAltText,
                  },
            where: { id: coverId },
          },
        },
        description,
        slug,
        title,
      },
      where: { id },
    })
  } catch (error) {
    throwDbError(error, 'Unable to update the podcast.')
  }
}
