import { prisma } from '~/utils/db.server'
import { throwDbError } from '~/utils/throw-db-error.server'

type Args = {
  id: string
  number: number
  title: string
  slug: string
  description: string
  authorId: string
  links?: { label: string; url: string }[]
}

export async function updateEpisode({
  id,
  number,
  title,
  slug,
  description,
  authorId,
  links = [],
}: Args) {
  try {
    // Links inherit the episode's lifecycle, so replace the whole set on save.
    // Delete then recreate in an explicit transaction rather than a nested
    // deleteMany + create, whose execution order Prisma does not guarantee.
    await prisma.$transaction(async (transaction) => {
      await transaction.podcastEpisodeLink.deleteMany({
        where: { episodeId: id },
      })

      await transaction.podcastEpisode.update({
        data: {
          authorId,
          description,
          links: {
            create: links.map((link, index) => ({
              label: link.label,
              order: index,
              url: link.url,
            })),
          },
          number,
          slug,
          title,
        },
        where: { id },
      })
    })
  } catch (error) {
    throwDbError(error, 'Unable to update the episode.')
  }
}
