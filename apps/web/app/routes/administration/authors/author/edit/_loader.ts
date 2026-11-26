import { data } from 'react-router'

import { prisma } from '~/utils/db.server'
import { getAllAuthorRoles } from '~/utils/permissions/author/queries/get-all-author-roles.server'
import { getUserPermissionContext } from '~/utils/permissions/user/context/get-user-permission-context.server'
import { checkUserPermission } from '~/utils/permissions/user/guards/check-user-permission.server'
import type { Route } from './+types/route'

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const context = await getUserPermissionContext(request, {
    actions: ['update'],
    entities: ['author'],
  })

  // Any author, never one's own only: a Member edits their name and bio in
  // Settings (28c, 29b). The generic 403 (30h).
  checkUserPermission(context, { action: 'update', entity: 'author' })

  const author = await prisma.author.findUnique({
    select: {
      bio: true,
      id: true,
      name: true,
      role: { select: { id: true, name: true } },
    },
    where: { id: params.authorId },
  })

  if (author === null) {
    throw data(null, { status: 404 })
  }

  return { author, roles: await getAllAuthorRoles() }
}
