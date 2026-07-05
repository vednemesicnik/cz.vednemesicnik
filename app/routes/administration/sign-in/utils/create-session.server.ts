import { getSessionAuthCookieSessionExpirationDate } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'
import { throwDbError } from '~/utils/throw-db-error.server'

// Returns the created session, or throws (via throwDbError, typed `never`) on a
// DB error — it never returns a failure value, so callers can use the result
// directly without an `ok` check.
export const createSession = async (userId: string) => {
  try {
    return await prisma.session.create({
      data: {
        expirationDate: getSessionAuthCookieSessionExpirationDate(),
        user: { connect: { id: userId } },
      },
      select: { expirationDate: true, id: true },
    })
  } catch (error) {
    return throwDbError(error, 'Unable to create the session.')
  }
}
