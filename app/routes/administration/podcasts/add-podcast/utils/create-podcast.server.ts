import { createId } from '@paralleldrive/cuid2'
import { prisma } from '~/utils/db.server'
import { storeImageVariants } from '~/utils/image-store/store-image.server'
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
  // Generate the cover id up front so its variants can be written to the store
  // before the row is committed.
  const coverId = createId()
  const coverMeta = await storeImageVariants(coverId, cover)

  try {
    const podcast = await prisma.podcast.create({
      data: {
        authorId: authorId,
        cover: {
          create: {
            ...coverMeta,
            altText: `Obálka podcastu ${title}`,
            id: coverId,
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
