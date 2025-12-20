import { getSessionAuthCookieSessionExpirationDate } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'
import { throwDbError } from '~/utils/throw-db-error.server'

export const createSession = async (userId: string) => {
  try {
    const session = await prisma.session.create({
      data: {
        expirationDate: getSessionAuthCookieSessionExpirationDate(),
        user: { connect: { id: userId } },
      },
      select: { expirationDate: true, id: true },
    })

    return {
      ok: true,
      session: { expirationDate: session.expirationDate, id: session.id },
    }
  } catch (error) {
    throwDbError(error, 'Unable to create the session.')
  }
}
