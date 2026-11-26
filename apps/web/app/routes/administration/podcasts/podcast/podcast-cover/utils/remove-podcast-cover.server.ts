import { prisma } from '~/utils/db.server'
import { deleteImage } from '~/utils/image-store/store-image.server'

import {
  type CoverChangeResult,
  savePodcastCoverChange,
} from './save-podcast-cover-change.server'

type Options = {
  podcastId: string
  tabId: string
}

/**
 * Removes the podcast's cover with its files, which go only after the row is
 * deleted. The editor offers no removal, since a podcast needs its cover
 * (27e): it sends this only after cancelling a first cover, because the abort
 * loses an answer already on its way (log 0029). Like that upload, it lands
 * after *Zavřít* released the hold, never over someone else's.
 *
 * @param request - The action's request.
 * @param options - The podcast and the tab.
 * @returns As `savePodcastCoverChange`; a cover that does not exist counts as
 *   removed.
 */
export async function removePodcastCover(
  request: Request,
  { podcastId, tabId }: Options,
): Promise<CoverChangeResult> {
  return savePodcastCoverChange(request, {
    landsWithoutHold: true,
    podcastId,
    prepare: async (podcast) => {
      // Already gone, or never landed: the removal holds.
      if (podcast.cover === null) return { writes: [] }
      const coverId = podcast.cover.id
      return {
        onCommitted: () => deleteImage(coverId),
        writes: [
          prisma.podcastCover.delete({
            select: { id: true },
            where: { id: coverId },
          }),
        ],
      }
    },
    tabId,
  })
}
