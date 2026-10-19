import { createId } from '@paralleldrive/cuid2'

import { prisma } from '~/utils/db.server'
import {
  deleteImage,
  deleteImageVersion,
  type StoredImageMeta,
  storeImageVariants,
} from '~/utils/image-store/store-image.server'
import { throwDbError } from '~/utils/throw-db-error.server'

/** How a photo upload ended. */
export type SaveUserImageResult = {
  /** `failed`: the file could not be processed; nothing was stored. */
  status: 'saved' | 'cancelled' | 'failed'
}

/**
 * Stores a new profile photo for the user, replacing the previous one. The
 * variants are written before the row (files before DB), and the previous
 * version's files are removed only after the row has committed. The person
 * can cancel it until it saves (design 29b, decision 0029): the aborted
 * request is checked before the files are stored, right before the commit
 * and once more after it, where a first photo is deleted and a replaced one
 * put back.
 *
 * @param request - The action's request, whose signal carries the cancel.
 * @param options - The signed-in user and the uploaded image.
 * @returns `saved`, `cancelled`, or `failed` when the file could not be
 *   processed.
 * @throws A database error when the row could not be written.
 */
export const saveUserImage = async (
  request: Request,
  { userId, file }: { userId: string; file: File },
): Promise<SaveUserImageResult> => {
  const isCancelled = () => request.signal.aborted

  if (isCancelled()) return { status: 'cancelled' }

  const existing = await prisma.userImage.findUnique({
    select: {
      id: true,
      intrinsicHeight: true,
      intrinsicWidth: true,
      placeholderDataUrl: true,
      version: true,
    },
    where: { userId },
  })

  const imageId = existing?.id ?? createId()

  let meta: StoredImageMeta
  try {
    meta = await storeImageVariants(imageId, file)
  } catch {
    // What made it to the store goes; a replaced photo keeps its version.
    if (existing === null) await deleteImage(imageId)
    return { status: 'failed' }
  }

  // The new version's files, which no committed row uses.
  const dropNewFiles = async () => {
    if (existing === null) {
      await deleteImage(imageId)
    } else if (existing.version !== meta.version) {
      await deleteImageVersion(imageId, meta.version)
    }
  }

  // Cancelled while the files were stored: they go, nothing commits.
  if (isCancelled()) {
    await dropNewFiles()
    return { status: 'cancelled' }
  }

  try {
    await prisma.userImage.upsert({
      create: { id: imageId, userId, ...meta },
      update: meta,
      where: { userId },
    })
  } catch (error) {
    await dropNewFiles()
    throwDbError(error, 'Unable to save the profile photo.')
  }

  // Cancelled during the commit: a first photo goes, a replaced one points
  // back at its previous version, whose files are still there. Only while
  // the row still holds this upload's version, so a later save stays.
  if (isCancelled()) {
    try {
      if (existing === null) {
        const { count } = await prisma.userImage.deleteMany({
          where: { id: imageId, version: meta.version },
        })
        if (count === 1) await deleteImage(imageId)
      } else {
        const previousMeta: StoredImageMeta = {
          intrinsicHeight: existing.intrinsicHeight,
          intrinsicWidth: existing.intrinsicWidth,
          placeholderDataUrl: existing.placeholderDataUrl,
          version: existing.version,
        }
        const { count } = await prisma.userImage.updateMany({
          data: previousMeta,
          where: { userId, version: meta.version },
        })
        if (count === 1 && existing.version !== meta.version) {
          await deleteImageVersion(imageId, meta.version)
        }
      }
    } catch (error) {
      console.error('Profile photo left after a cancel', error)
    }
    return { status: 'cancelled' }
  }

  // The photo is saved; files it left behind are only litter.
  if (existing !== null && existing.version !== meta.version) {
    try {
      await deleteImageVersion(existing.id, existing.version)
    } catch (error) {
      console.error('Profile photo files left after a saved change', error)
    }
  }

  return { status: 'saved' }
}
