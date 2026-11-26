import { prisma } from '~/utils/db.server'
import { getFreeSlugSuggestion } from '~/utils/get-free-slug-suggestion'

import { getNextFreeEpisodeNumber } from './get-next-free-episode-number.server'

type Options = {
  episodeId: string
  podcastId: string
  number: number | null
  slug: string
}

type EpisodeConflict = {
  /** The number, when another episode of the podcast holds it as published. */
  takenNumber: number | null
  /** The number *Použít N* offers for a taken one (27f). */
  freeNumber: number | null
  /** The address, when another episode of the podcast holds it as published. */
  takenSlug: string | null
  /** The address *Použít …* offers for a taken one (24d, 27f). */
  slugSuggestion: string | null
}

/**
 * Whether another episode of the podcast holds the number or the address as
 * published (design 27f, logs 0039, 0047): only a published value is unique,
 * so a draft saves a taken one and the editor says so at the field. A
 * retracted or archived episode keeps holding its own.
 *
 * @param options - The episode, its podcast, and the number and address it has.
 * @returns The taken values with a free one each to offer, `null` where free
 *   or empty.
 */
export const findPublishedEpisodeConflict = async ({
  episodeId,
  podcastId,
  number,
  slug,
}: Options): Promise<EpisodeConflict> => {
  const [numberHolder, slugHolders] = await Promise.all([
    number === null
      ? null
      : prisma.podcastEpisode.findFirst({
          select: { id: true },
          where: { id: { not: episodeId }, podcastId, publishedNumber: number },
        }),
    slug === ''
      ? []
      : prisma.podcastEpisode.findMany({
          select: { publishedSlug: true },
          where: {
            id: { not: episodeId },
            podcastId,
            publishedSlug: { startsWith: slug },
          },
        }),
  ])

  const takenSlugs = slugHolders.flatMap(({ publishedSlug }) =>
    publishedSlug === null ? [] : [publishedSlug],
  )
  const isSlugTaken = takenSlugs.includes(slug)

  return {
    freeNumber:
      numberHolder === null
        ? null
        : await getNextFreeEpisodeNumber({ episodeId, podcastId }),
    slugSuggestion: isSlugTaken
      ? getFreeSlugSuggestion(slug, takenSlugs)
      : null,
    takenNumber: numberHolder === null ? null : number,
    takenSlug: isSlugTaken ? slug : null,
  }
}
