import { prisma } from '~/utils/db.server'

/**
 * What blocks submitting, approving or publishing the stored episode because
 * it has no link to listen to (design 27h, copy w59y90od), in the shape of the
 * missing-content hooks. The web lists no empty *Kde poslouchat*, since every
 * published episode has a link (13d).
 *
 * @param id - The episode.
 * @returns `Chybí odkaz na epizodu.` when the episode has no link; empty
 *   otherwise.
 */
export const loadMissingEpisodeLinkItems = async (id: string) => {
  const linkCount = await prisma.podcastEpisodeLink.count({
    where: { episodeId: id },
  })

  return linkCount === 0 ? ['Chybí odkaz na epizodu.'] : []
}
