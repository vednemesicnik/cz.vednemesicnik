import { prisma } from '~/utils/db.server'
import { deleteRowWithImages } from '~/utils/image-store/store-image.server'

/**
 * Removes the user's profile photo: the row first, then its files. A no-op
 * when the user has no photo.
 *
 * @param userId - The signed-in user.
 */
export const deleteUserImage = async (userId: string) => {
  await deleteRowWithImages(
    async () => {
      const image = await prisma.userImage.findUnique({
        select: { id: true },
        where: { userId },
      })

      return image === null ? [] : [image.id]
    },
    () => prisma.userImage.deleteMany({ where: { userId } }),
  )
}
