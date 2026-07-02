import { prisma } from '~/utils/db.server'
import { prepareCoverReplacement } from '~/utils/image-store/store-image.server'
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

  // Remember the current cover version so its files can be removed once the new
  // version is committed (see `prepareCoverReplacement`). Only queried when the
  // cover is actually being replaced.
  const previousVersion =
    cover === undefined
      ? null
      : ((
          await prisma.podcastCover.findUnique({
            select: { version: true },
            where: { id: coverId },
          })
        )?.version ?? null)

  const { data: coverData, cleanup } = await prepareCoverReplacement(
    coverId,
    coverAltText,
    previousVersion,
    cover,
  )

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

    await cleanup()
  } catch (error) {
    throwDbError(error, 'Unable to update the podcast.')
  }
}
