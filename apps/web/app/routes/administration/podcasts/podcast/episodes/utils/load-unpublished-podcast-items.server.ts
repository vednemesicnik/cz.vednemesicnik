import { prisma } from '~/utils/db.server'

import { getUnpublishedPodcastItem } from './get-unpublished-podcast-item'

/**
 * What blocks submitting or publishing the stored episode because its podcast
 * is off the web (design 27f), in the shape of the missing-content hooks.
 *
 * @param id - The episode.
 * @returns The sentence of {@link getUnpublishedPodcastItem}; empty when the
 *   podcast is published.
 */
export const loadUnpublishedPodcastItems = async (id: string) => {
  const { podcast } = await prisma.podcastEpisode.findUniqueOrThrow({
    select: { podcast: { select: { state: true, title: true } } },
    where: { id },
  })
  const item = getUnpublishedPodcastItem(podcast)

  return item === null ? [] : [item]
}
