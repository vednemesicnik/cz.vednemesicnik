import { prisma } from '~/utils/db.server'

import { getMissingPodcastContent } from './get-missing-podcast-content'

/**
 * What blocks submitting, approving or publishing the stored podcast (design
 * 27i), in the shape of the missing-content hooks. Only a published address
 * is unique (log 0039); a retracted or archived podcast keeps holding its own.
 *
 * @param id - The podcast.
 * @returns The sentences of {@link getMissingPodcastContent}; empty when the
 *   podcast is complete.
 */
export const loadMissingPodcastContent = async (id: string) => {
  const podcast = await prisma.podcast.findUniqueOrThrow({
    select: {
      cover: { select: { id: true } },
      description: true,
      slug: true,
      title: true,
    },
    where: { id },
  })
  const { cover, slug, ...texts } = podcast

  const slugHolder =
    slug === ''
      ? null
      : await prisma.podcast.findFirst({
          select: { id: true },
          where: { id: { not: id }, publishedSlug: slug },
        })

  return getMissingPodcastContent({
    ...texts,
    hasCover: cover !== null,
    isSlugTaken: slugHolder !== null,
    slug,
  })
}
