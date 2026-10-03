import { prisma } from '~/utils/db.server'

import type { UserPermissionContext } from '../../user/context/get-user-permission-context.server'
import { canChangeAuthorRole } from '../guards/can-change-author-role.server'

/**
 * Fetches author roles that the current user can assign when editing an author.
 *
 * Role assignment rules (see `canChangeAuthorRole`):
 * - Without `any` access to update authors (Member): only the current role
 * - Administrator and Owner: any author role (Coordinator, Creator, Contributor)
 */
export async function getAssignableAuthorRoles(
  context: UserPermissionContext,
  authorId: string,
) {
  if (!canChangeAuthorRole(context)) {
    const author = await prisma.author.findUnique({
      select: {
        role: {
          select: {
            id: true,
            level: true,
            name: true,
          },
        },
      },
      where: { id: authorId },
    })

    return author ? [author.role] : []
  }

  // Administrator and Owner can assign any author role
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
