import { prisma } from "~/utils/db.server"

export const deleteSession = (id: string | undefined) => {
  void prisma.session.delete({
    where: { id },
  })
}
