import { getSessionAuthCookieSessionExpirationDate } from "~/utils/auth.server"
import { prisma } from "~/utils/db.server"
import { throwDbError } from "~/utils/throw-db-error.server"

export const createSession = async (userId: string) => {
  try {
    const session = await prisma.session.create({
      data: {
        user: { connect: { id: userId } },
        expirationDate: getSessionAuthCookieSessionExpirationDate(),
      },
      select: { id: true, expirationDate: true },
    })

    return {
      ok: true,
      session: { id: session.id, expirationDate: session.expirationDate },
    }
  } catch (error) {
    throwDbError(error, "Unable to create the session.")
  }
}
