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
    await prisma.podcastEpisode.update({
      data: {
        authorId,
        description,
        // Links inherit the episode's lifecycle; replace the whole set on save.
        links: {
          create: links.map((link, index) => ({
            label: link.label,
            order: index,
            url: link.url,
          })),
          deleteMany: {},
        },
        number,
        slug,
        title,
      },
      where: { id },
    })
  } catch (error) {
    throwDbError(error, 'Unable to update the episode.')
  }
}
