import { prisma } from '~/utils/db.server'

import { getMissingEpisodeContent } from './get-missing-episode-content'

/**
 * What blocks submitting, approving or publishing the stored episode (design
 * 27h, 27f), in the shape of the missing-content hooks. Only a published
 * number and address are unique, and only within the podcast (logs 0039,
 * 0047); a retracted or archived episode keeps holding its own.
 *
 * @param id - The episode.
 * @returns The sentences of {@link getMissingEpisodeContent}; empty when the
 *   episode is complete.
 */
export const loadMissingEpisodeContent = async (id: string) => {
  const episode = await prisma.podcastEpisode.findUniqueOrThrow({
    select: {
      description: true,
      links: { orderBy: { order: 'asc' }, select: { label: true, url: true } },
      number: true,
      podcastId: true,
      slug: true,
      title: true,
    },
    where: { id },
  })
  const { number, podcastId, slug } = episode

  const [numberHolder, slugHolder] = await Promise.all([
    number === null
      ? null
      : prisma.podcastEpisode.findFirst({
          select: { id: true },
          where: { id: { not: id }, podcastId, publishedNumber: number },
        }),
    slug === ''
      ? null
      : prisma.podcastEpisode.findFirst({
          select: { id: true },
          where: { id: { not: id }, podcastId, publishedSlug: slug },
        }),
  ])

  return getMissingEpisodeContent({
    ...episode,
    isNumberTaken: numberHolder !== null,
    isSlugTaken: slugHolder !== null,
  })
}
