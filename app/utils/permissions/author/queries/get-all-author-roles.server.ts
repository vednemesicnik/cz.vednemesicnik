import { prisma } from "~/utils/db.server"

/**
 * Fetches all author roles for creating a new author.
 * Used by Administrator and Owner who can assign any author role.
 */
export async function getAllAuthorRoles() {
  return prisma.authorRole.findMany({
    select: {
      id: true,
      name: true,
      level: true,
    },
    orderBy: {
      level: "asc",
    },
  })
}
