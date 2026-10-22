import { data } from 'react-router'

import { AUTHOR_REFERENCES_SELECT } from '~/utils/author-references/author-references-select'
import { getAuthorDeleteBlock } from '~/utils/author-references/get-author-delete-block'
import { prisma } from '~/utils/db.server'
import { createFormattedDate } from '~/utils/format-date'
import { getUserPermissionContext } from '~/utils/permissions/user/context/get-user-permission-context.server'

import type { Route } from './+types/route'

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { authorId } = params

  const context = await getUserPermissionContext(request, {
    actions: ['view', 'update', 'delete'],
    entities: ['author'],
  })

  const author = await prisma.author.findUniqueOrThrow({
    select: {
      ...AUTHOR_REFERENCES_SELECT,
      bio: true,
      createdAt: true,
      id: true,
      name: true,
      role: {
        select: {
          id: true,
          level: true,
          name: true,
        },
      },
      updatedAt: true,
      user: {
        select: {
          email: true,
          id: true,
          role: { select: { name: true } },
        },
      },
    },
    where: { id: authorId },
  })

  // targetUserId is the user who owns this author profile (or undefined for external authors)
  const targetUserId = author.user?.id

  // Check view permission
  const viewPerms = context.can({
    action: 'view',
    entity: 'author',
    targetUserId,
  })

  // A record the person may not see is a 404, like a deleted one (design 30e).
  if (!viewPerms.hasPermission) {
    throw data(null, { status: 404 })
  }

  // Check update permission
  const updatePerms = context.can({
    action: 'update',
    entity: 'author',
    targetUserId,
  })

  // Check delete permission - cannot delete own author profile
  const deletePerms = context.can({
    action: 'delete',
    entity: 'author',
    targetUserId,
  })

  return {
    author: {
      bio: author.bio,
      createdAt: createFormattedDate(author.createdAt),
      id: author.id,
      name: author.name,
      role: author.role,
      updatedAt: createFormattedDate(author.updatedAt),
      user: author.user,
    },
    canUpdate: updatePerms.hasPermission,
    // Smazat… confirms a deletable author and explains a blocked one (28g).
    deleteBlock: getAuthorDeleteBlock(author, context.userId),
    mayDelete: deletePerms.hasPermission,
  }
}
