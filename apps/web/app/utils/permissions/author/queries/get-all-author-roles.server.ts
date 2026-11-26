import { prisma } from '~/utils/db.server'

/**
 * Fetches all author roles for the role choice of Nový autor and Upravit
 * autora, from the least permission up: Přispěvatel, Tvůrce, Koordinátor
 * (design 28c). Only Administrator and Owner reach those pages.
 */
export async function getAllAuthorRoles() {
  return prisma.authorRole.findMany({
    orderBy: {
      level: 'desc',
    },
    select: {
      id: true,
      level: true,
      name: true,
    },
  })
}
