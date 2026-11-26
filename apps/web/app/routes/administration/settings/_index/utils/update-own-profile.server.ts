import { prisma } from '~/utils/db.server'
import { throwDbError } from '~/utils/throw-db-error.server'

type Data = {
  authorId: string
  name: string
  bio?: string
}

/**
 * Saves what the signed-in person may change about themselves: the name and
 * bio of their author (design 29b — the name belongs to the author, not to the
 * user). The role is never touched here.
 *
 * @param data - The author to update and the new name and bio.
 */
export const updateOwnProfile = async ({ authorId, name, bio }: Data) => {
  try {
    await prisma.author.update({
      data: { bio: bio ?? null, name },
      where: { id: authorId },
    })
  } catch (error) {
    throwDbError(error, 'Unable to update the profile.')
  }
}
