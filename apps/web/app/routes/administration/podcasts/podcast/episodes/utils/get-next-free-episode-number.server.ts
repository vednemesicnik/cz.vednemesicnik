import { prisma } from '~/utils/db.server'
import { NON_EMPTY_EPISODE_WHERE } from '~/utils/podcast-episode/non-empty-episode-where'

type Options = {
  podcastId: string
  /** The episode the number is for, left out of the count. */
  episodeId?: string
}

/**
 * The number a new episode of the podcast gets, and the one *Použít N* offers
 * for a taken number (design 27d, 27f, 00l7fuiu): the highest plus one, an
 * archived episode's included. A number an episode still holds since its
 * last publish counts too, so the offer is never taken (log 0039). An empty
 * draft counts for nothing (log 0020).
 *
 * @param options - The podcast, and the episode to leave out.
 * @returns The next free number, 1 for a podcast without episodes.
 */
export const getNextFreeEpisodeNumber = async ({
  podcastId,
  episodeId,
}: Options) => {
  const { _max: highest } = await prisma.podcastEpisode.aggregate({
    _max: { number: true, publishedNumber: true },
    where: {
      ...NON_EMPTY_EPISODE_WHERE,
      podcastId,
      ...(episodeId === undefined ? {} : { id: { not: episodeId } }),
    },
  })

  return Math.max(highest.number ?? 0, highest.publishedNumber ?? 0) + 1
}
