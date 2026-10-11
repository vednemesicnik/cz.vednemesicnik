import { prisma } from '~/utils/db.server'
import { throwDbError } from '~/utils/throw-db-error.server'

/**
 * Records a passed identity check on the session: it counts as freshly
 * authenticated again, as if just signed in, without creating a new one.
 *
 * @param sessionId - The session the check was made in.
 */
export const markSessionAuthenticated = async (sessionId: string) => {
  try {
    await prisma.session.update({
      data: { authenticatedAt: new Date() },
      select: { id: true },
      where: { id: sessionId },
    })
  } catch (error) {
    throwDbError(error, 'Unable to mark the session as authenticated.')
  }
}
