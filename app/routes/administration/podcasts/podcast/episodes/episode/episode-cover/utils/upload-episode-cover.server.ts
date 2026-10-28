import { createId } from '@paralleldrive/cuid2'
import { data } from 'react-router'

import { PODCAST_COVER_CONFIG } from '~/config/podcast-cover-config'
import { prisma } from '~/utils/db.server'
import { isImageOverPixelBudget } from '~/utils/image-store/is-image-over-pixel-budget.server'
import {
  deleteImage,
  deleteImageVersion,
  type StoredImageMeta,
  storeImageVariants,
} from '~/utils/image-store/store-image.server'
import { getEpisodeCoverAltText } from '~/utils/podcast-episode/get-episode-cover-alt-text'

import {
  type CoverChangeResult,
  saveEpisodeCoverChange,
} from './save-episode-cover-change.server'

type Options = {
  podcastId: string
  episodeId: string
  tabId: string
  file: File
}

/**
 * Stores the episode's own cover as soon as it is picked (design 27d, as the
 * issue's in 26c). A new cover gets its row once its variants are stored; a
 * replacement keeps the cover's id and gets a new version, whose predecessor
 * goes only after the row commits, so a failed replacement keeps the old
 * cover. The alt text is composed from the title. An upload on its way still
 * lands after *Zavřít* released the hold. Cancelling it is #712.
 *
 * @param request - The action's request.
 * @param options - The podcast, the episode, the tab and the file.
 * @returns As `saveEpisodeCoverChange`; `failed` with `over-pixel-budget` for
 *   an image over `MAX_IMAGE_PIXELS`, refused before it is stored (4al3quzt).
 * @throws A 400 response for a file that is not an image or is too big.
 */
export async function uploadEpisodeCover(
  request: Request,
  { podcastId, episodeId, tabId, file }: Options,
): Promise<CoverChangeResult> {
  if (
    file.size === 0 ||
    file.size > PODCAST_COVER_CONFIG.maxFileBytes ||
    !file.type.startsWith('image/')
  ) {
    throw data(null, { status: 400 })
  }

  return saveEpisodeCoverChange(request, {
    episodeId,
    landsWithoutHold: true,
    podcastId,
    prepare: async (episode) => {
      if (await isImageOverPixelBudget(file)) {
        return { reason: 'over-pixel-budget', status: 'failed' }
      }

      const storedCover =
        episode.cover === null
          ? null
          : await prisma.podcastEpisodeCover.findUnique({
              select: { id: true, version: true },
              where: { id: episode.cover.id },
            })

      const coverId = storedCover?.id ?? createId()

      let meta: StoredImageMeta
      try {
        meta = await storeImageVariants(coverId, file)
      } catch {
        // What made it to the store goes; a replaced cover keeps its version.
        if (storedCover === null) await deleteImage(coverId).catch(() => {})
        return { status: 'failed' }
      }

      if (storedCover === null) {
        return {
          addsContent: true,
          isUpload: true,
          onRefused: () => deleteImage(coverId),
          writes: [
            prisma.podcastEpisodeCover.create({
              data: {
                ...meta,
                altText: getEpisodeCoverAltText(episode),
                episodeId,
                id: coverId,
              },
              select: { id: true },
            }),
          ],
        }
      }

      const previousVersion = storedCover.version
      const isNewVersion = previousVersion !== meta.version

      return {
        isUpload: true,
        onCommitted: async () => {
          if (isNewVersion) await deleteImageVersion(coverId, previousVersion)
        },
        onRefused: async () => {
          if (isNewVersion) await deleteImageVersion(coverId, meta.version)
        },
        writes: [
          prisma.podcastEpisodeCover.update({
            data: meta,
            select: { id: true },
            where: { id: coverId },
          }),
        ],
      }
    },
    tabId,
  })
}
