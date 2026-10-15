import { prisma } from '~/utils/db.server'

/**
 * Whether a cover or a profile picture already owns one of these image ids.
 * The image store keys every image by its row id alone, so a new article image
 * under such an id would share, and on removal wipe, that record's files
 * (decision 0022). A model that stores images under its own id belongs here.
 *
 * @param ids - Image ids the editor made, not yet stored as article images.
 * @returns `true` when any of them is an issue, podcast or episode cover, or a
 *   user's image.
 */
export const isImageIdOwnedElsewhere = async (
  ids: readonly string[],
): Promise<boolean> => {
  if (ids.length === 0) return false

  const where = { id: { in: [...ids] } }
  const counts = await Promise.all([
    prisma.issueCover.count({ where }),
    prisma.podcastCover.count({ where }),
    prisma.podcastEpisodeCover.count({ where }),
    prisma.userImage.count({ where }),
  ])

  return counts.some((count) => count > 0)
}
