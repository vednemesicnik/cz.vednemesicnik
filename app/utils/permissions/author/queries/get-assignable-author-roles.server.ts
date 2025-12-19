import { prisma } from "~/utils/db.server"

import type { UserPermissionContext } from "../../user/context/get-user-permission-context.server"

/**
 * Fetches author roles that the current user can assign when editing an author.
 *
 * Role assignment rules:
 * - Member: returns only their current role (cannot change it)
 * - Administrator and Owner: can assign any author role (Coordinator, Creator, Contributor)
 */
export async function getAssignableAuthorRoles(
  context: UserPermissionContext,
  targetAuthorId: string
) {
  // Member can only see their own current role (cannot change it)
  if (context.roleName === "member" && context.authorId === targetAuthorId) {
    const author = await prisma.author.findUnique({
      where: { id: targetAuthorId },
      select: {
        role: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
      },
    })

    return author ? [author.role] : []
  }

  // Administrator and Owner can assign any author role
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