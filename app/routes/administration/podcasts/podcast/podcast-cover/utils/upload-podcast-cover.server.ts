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
import { getPodcastCoverAltText } from '~/utils/podcast/get-podcast-cover-alt-text'

import {
  type CoverChangeResult,
  savePodcastCoverChange,
} from './save-podcast-cover-change.server'

type Options = {
  podcastId: string
  /** The editor's tab, which must hold the edit hold (log 0019). */
  tabId: string
  file: File
}

/**
 * Stores the podcast's cover as soon as it is picked (design 27e, as the
 * issue's in 26c and the episode's in 27d; log 0029). A first cover gets its
 * row once its variants are stored and ends the empty draft (0020); a
 * replacement keeps the cover's id and gets a new version, whose predecessor
 * goes only after the row commits, so a failed replacement keeps the old
 * cover. The alt text is composed from the title. An upload on its way still
 * lands after *Zavřít* released the hold, never over someone else's, and the
 * editor can cancel it until it saves (bxy8xxqs): a first cover goes again, a
 * replacement gets its previous version back.
 *
 * @param request - The action's request.
 * @param options - The podcast, the editor's tab and the file.
 * @returns As `savePodcastCoverChange`; `failed` with `over-pixel-budget` for
 *   an image over `MAX_IMAGE_PIXELS`, refused before it is stored (4al3quzt).
 * @throws A 400 response for a file that is not an image or is too big.
 */
export async function uploadPodcastCover(
  request: Request,
  { podcastId, tabId, file }: Options,
): Promise<CoverChangeResult> {
  if (
    file.size === 0 ||
    file.size > PODCAST_COVER_CONFIG.maxFileBytes ||
    !file.type.startsWith('image/')
  ) {
    throw data(null, { status: 400 })
  }

  return savePodcastCoverChange(request, {
    isCancellable: true,
    landsWithoutHold: true,
    podcastId,
    prepare: async (podcast) => {
      if (await isImageOverPixelBudget(file)) {
        return { reason: 'over-pixel-budget', status: 'failed' }
      }

      const storedCover =
        podcast.cover === null
          ? null
          : await prisma.podcastCover.findUnique({
              select: {
                id: true,
                intrinsicHeight: true,
                intrinsicWidth: true,
                placeholderDataUrl: true,
                version: true,
              },
              where: { id: podcast.cover.id },
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
          onCancelled: async () => {
            await prisma.podcastCover.delete({
              select: { id: true },
              where: { id: coverId },
            })
            await deleteImage(coverId)
          },
          onRefused: () => deleteImage(coverId),
          writes: [
            prisma.podcastCover.create({
              data: {
                ...meta,
                altText: getPodcastCoverAltText(podcast.title),
                id: coverId,
                podcastId,
              },
              select: { id: true },
            }),
          ],
        }
      }

      const previousMeta: StoredImageMeta = {
        intrinsicHeight: storedCover.intrinsicHeight,
        intrinsicWidth: storedCover.intrinsicWidth,
        placeholderDataUrl: storedCover.placeholderDataUrl,
        version: storedCover.version,
      }
      const isNewVersion = previousMeta.version !== meta.version

      return {
        isUpload: true,
        // The previous version's files are still there: the row points back
        // at them, and the new version's go.
        onCancelled: async () => {
          await prisma.podcastCover.update({
            data: previousMeta,
            select: { id: true },
            where: { id: coverId },
          })
          if (isNewVersion) await deleteImageVersion(coverId, meta.version)
        },
        onCommitted: async () => {
          if (isNewVersion) {
            await deleteImageVersion(coverId, previousMeta.version)
          }
        },
        onRefused: async () => {
          if (isNewVersion) await deleteImageVersion(coverId, meta.version)
        },
        writes: [
          prisma.podcastCover.update({
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
