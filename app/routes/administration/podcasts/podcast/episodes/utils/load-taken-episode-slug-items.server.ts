import { TAKEN_SLUG_ITEM } from '~/routes/administration/articles/article/_index/utils/slug-items'
import { prisma } from '~/utils/db.server'

/**
 * What blocks submitting, approving or publishing the stored episode because
 * another episode of its podcast holds its address as published (log 0039,
 * design 27f, 24d), in the shape of the missing-content hooks. Only a
 * published address is unique, and only within the podcast; a retracted or
 * archived episode keeps holding its own.
 *
 * @param id - The episode.
 * @returns `Adresa je obsazená.` when the address is taken; empty otherwise.
 */
export const loadTakenEpisodeSlugItems = async (id: string) => {
  const { podcastId, slug } = await prisma.podcastEpisode.findUniqueOrThrow({
    select: { podcastId: true, slug: true },
    where: { id },
  })
  const holder = await prisma.podcastEpisode.findFirst({
    select: { id: true },
    where: { id: { not: id }, podcastId, publishedSlug: slug },
  })

  return holder === null ? [] : [TAKEN_SLUG_ITEM]
}
