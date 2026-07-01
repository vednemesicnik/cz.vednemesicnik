import { prisma } from '~/utils/db.server'
import {
  deleteImageVersion,
  storeImageVariants,
} from '~/utils/image-store/store-image.server'
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

  // Replace the cover file: store a new version (stable id → cache-busted URL),
  // remembering the previous version so its files can be removed afterwards.
  let previousVersion: string | null = null
  let coverData: {
    altText: string
    version?: string
    intrinsicWidth?: number
    intrinsicHeight?: number
    placeholderDataUrl?: string
  } = { altText: coverAltText }

  if (cover !== undefined) {
    const previous = await prisma.podcastCover.findUnique({
      select: { version: true },
      where: { id: coverId },
    })
    previousVersion = previous?.version ?? null

    const meta = await storeImageVariants(coverId, cover)
    coverData = {
      altText: coverAltText,
      intrinsicHeight: meta.intrinsicHeight,
      intrinsicWidth: meta.intrinsicWidth,
      placeholderDataUrl: meta.placeholderDataUrl,
      version: meta.version,
    }
  }

  try {
    await prisma.podcast.update({
      data: {
        authorId: authorId,
        cover: {
          update: {
            data: coverData,
            where: { id: coverId },
          },
        },
        description,
        slug,
        title,
      },
      where: { id },
    })

    if (
      previousVersion &&
      coverData.version &&
      previousVersion !== coverData.version
    ) {
      await deleteImageVersion(coverId, previousVersion)
    }
  } catch (error) {
    throwDbError(error, 'Unable to update the podcast.')
  }
}
