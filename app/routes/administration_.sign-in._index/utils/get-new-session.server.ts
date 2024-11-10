import { getSessionExpirationDate } from "~/utils/auth.server"
import { prisma } from "~/utils/db.server"

export const getNewSession = async (userId: string) => {
  return prisma.session.create({
    data: {
      user: { connect: { id: userId } },
      expirationDate: getSessionExpirationDate(),
    },
    select: { id: true, expirationDate: true },
  })
}
