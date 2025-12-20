import { prisma } from '~/utils/db.server'

/**
 * Fetches all author roles for creating a new author.
 * Used by Administrator and Owner who can assign any author role.
 */
export async function getAllAuthorRoles() {
  return prisma.authorRole.findMany({
    orderBy: {
      level: 'asc',
    },
    select: {
      id: true,
      level: true,
      name: true,
    },
  })
}
