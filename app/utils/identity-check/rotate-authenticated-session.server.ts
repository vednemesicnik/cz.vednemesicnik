import { setSessionAuthCookieSession } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'
import { throwDbError } from '~/utils/throw-db-error.server'

/**
 * Records a passed identity check (design 29d) by swapping the session for a
 * new one: same user, same expiry, authenticated now. Nobody is signed out,
 * but a copy of the old session cookie stops working, so it never gains the
 * window for changing sign-in methods.
 *
 * @param args.request - The request the check finished in.
 * @param args.sessionId - The session the check was made in.
 * @returns The Set-Cookie header that hands the browser the new session.
 */
export const rotateAuthenticatedSession = async ({
  request,
  sessionId,
}: {
  request: Request
  sessionId: string
}) => {
  try {
    const session = await prisma.$transaction(async (transaction) => {
      const current = await transaction.session.delete({
        select: { expirationDate: true, userId: true },
        where: { id: sessionId },
      })

      return transaction.session.create({
        data: {
          authenticatedAt: new Date(),
          expirationDate: current.expirationDate,
          userId: current.userId,
        },
        select: { expirationDate: true, id: true },
      })
    })

    return await setSessionAuthCookieSession(
      request,
      session.id,
      session.expirationDate,
    )
  } catch (error) {
    return throwDbError(error, 'Unable to rotate the authenticated session.')
  }
}
