import { createId } from '@paralleldrive/cuid2'
import { data } from 'react-router'

import { ISSUE_FILE_CONFIG } from '~/config/issue-file-config'
import { prisma } from '~/utils/db.server'
import { isImageOverPixelBudget } from '~/utils/image-store/is-image-over-pixel-budget.server'
import {
  deleteImage,
  deleteImageVersion,
  type StoredImageMeta,
  storeImageVariants,
} from '~/utils/image-store/store-image.server'
import { getIssueCoverAltText } from '~/utils/issue/get-issue-cover-alt-text'

import {
  type FileChangeResult,
  saveIssueFileChange,
} from './save-issue-file-change.server'

type Options = {
  issueId: string
  tabId: string
  file: File
}

/**
 * Stores a picked cover as soon as it is chosen (design 26c, decision 0029).
 * A new cover gets its row once its variants are stored; a replacement keeps
 * the cover's id and gets a new version, whose predecessor goes only after the
 * row commits, so a failed replacement keeps the old cover. The alt text is
 * composed from the title (qjv38ti4). The editor can cancel it until it saves:
 * a cancel during the commit deletes a new cover and puts a replaced one back
 * (bxy8xxqs).
 *
 * @param request - The action's request.
 * @param options - The issue, the tab and the file.
 * @returns As `saveIssueFileChange`; `failed` with `over-pixel-budget` for an
 *   image over `MAX_IMAGE_PIXELS`, refused before it is stored (4al3quzt).
 * @throws A 400 response for a file that is not an image or is too big.
 */
export async function uploadIssueCover(
  request: Request,
  { issueId, tabId, file }: Options,
): Promise<FileChangeResult> {
  if (
    file.size === 0 ||
    file.size > ISSUE_FILE_CONFIG.cover.maxFileBytes ||
    !file.type.startsWith('image/')
  ) {
    throw data(null, { status: 400 })
  }

  return saveIssueFileChange(request, {
    isCancellable: true,
    issueId,
    landsWithoutHold: true,
    prepare: async (issue) => {
      if (await isImageOverPixelBudget(file)) {
        return { reason: 'over-pixel-budget', status: 'failed' }
      }

      const storedCover =
        issue.cover === null
          ? null
          : await prisma.issueCover.findUnique({
              select: {
                id: true,
                intrinsicHeight: true,
                intrinsicWidth: true,
                placeholderDataUrl: true,
                version: true,
              },
              where: { id: issue.cover.id },
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
          logEvent: 'cover_uploaded',
          onCancelled: async () => {
            await prisma.issueCover.delete({
              select: { id: true },
              where: { id: coverId },
            })
            await deleteImage(coverId)
          },
          onRefused: () => deleteImage(coverId),
          writes: [
            prisma.issueCover.create({
              data: {
                ...meta,
                altText: getIssueCoverAltText(issue),
                id: coverId,
                issueId,
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
        logEvent: 'cover_uploaded',
        // The previous version's files are still there: the row points back
        // at them, and the new version's go.
        onCancelled: async () => {
          await prisma.issueCover.update({
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
          prisma.issueCover.update({
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
