import { prisma } from '~/utils/db.server'
import { deleteImage } from '~/utils/image-store/store-image.server'

import {
  type CoverChangeResult,
  saveEpisodeCoverChange,
} from './save-episode-cover-change.server'

type Options = {
  podcastId: string
  episodeId: string
  tabId: string
}

/**
 * Removes the episode's own cover with its files, which go only after the row
 * is deleted: *Použít obálku podcastu* (design 27d). Without its own cover,
 * the episode goes out with the podcast's.
 *
 * @param request - The action's request.
 * @param options - The podcast, the episode and the tab.
 * @returns As `saveEpisodeCoverChange`; a cover that does not exist counts as
 *   removed.
 */
export async function removeEpisodeCover(
  request: Request,
  { podcastId, episodeId, tabId }: Options,
): Promise<CoverChangeResult> {
  return saveEpisodeCoverChange(request, {
    episodeId,
    podcastId,
    prepare: async (episode) => {
      // Already gone: the removal holds.
      if (episode.cover === null) return { writes: [] }
      const coverId = episode.cover.id
      return {
        onCommitted: () => deleteImage(coverId),
        writes: [
          prisma.podcastEpisodeCover.delete({
            select: { id: true },
            where: { id: coverId },
          }),
        ],
      }
    },
    tabId,
  })
}
