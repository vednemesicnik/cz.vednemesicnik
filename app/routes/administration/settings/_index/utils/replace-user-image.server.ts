import { createId } from '@paralleldrive/cuid2'

import { prisma } from '~/utils/db.server'
import {
  deleteImageVersion,
  storeImageVariants,
} from '~/utils/image-store/store-image.server'
import { throwDbError } from '~/utils/throw-db-error.server'

/**
 * Stores a new profile photo for the user, replacing the previous one. The
 * variants are written before the row (files before DB), and the previous
 * version's files are removed only after the row has committed.
 *
 * @param userId - The signed-in user.
 * @param file - The uploaded image.
 */
export const replaceUserImage = async (userId: string, file: File) => {
  const existing = await prisma.userImage.findUnique({
    select: { id: true, version: true },
    where: { userId },
  })

  const imageId = existing?.id ?? createId()
  const meta = await storeImageVariants(imageId, file)

  try {
    await prisma.userImage.upsert({
      create: { id: imageId, userId, ...meta },
      update: meta,
      where: { userId },
    })
  } catch (error) {
    throwDbError(error, 'Unable to save the profile photo.')
  }

  if (existing !== null && existing.version !== meta.version) {
    await deleteImageVersion(existing.id, existing.version)
  }
}
