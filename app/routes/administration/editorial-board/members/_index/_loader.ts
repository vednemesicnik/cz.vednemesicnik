import { prisma } from '~/utils/db.server'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'

import type { Route } from './+types/route'

export const loader = async ({ request }: Route.LoaderArgs) => {
  const context = await getAuthorPermissionContext(request, {
    actions: ['view', 'create', 'update', 'delete'],
    entities: ['editorial_board_member'],
  })

  // Check create permission
  const { hasPermission: canCreate } = context.can({
    action: 'create',
    entity: 'editorial_board_member',
    targetAuthorId: context.authorId,
  })

  const editorialBoardMembers = await prisma.editorialBoardMember.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      author: {
        select: {
          id: true,
        },
      },
      fullName: true,
      id: true,
      positions: {
        select: {
          id: true,
          key: true,
        },
      },
      state: true,
    },
  })

  const membersWithPermissions = editorialBoardMembers.map((member) => {
    const { hasPermission: canView } = context.can({
      action: 'view',
      entity: 'editorial_board_member',
      state: member.state,
      targetAuthorId: member.author.id,
    })

    const { hasPermission: canEdit } = context.can({
      action: 'update',
      entity: 'editorial_board_member',
      state: member.state,
      targetAuthorId: member.author.id,
    })

    const { hasPermission: canDelete } = context.can({
      action: 'delete',
      entity: 'editorial_board_member',
      state: member.state,
      targetAuthorId: member.author.id,
    })

    return {
      canDelete,
      canEdit,
      canView,
      fullName: member.fullName,
      id: member.id,
      positions: member.positions.map((position) => position.key).join(', '),
      state: member.state,
    }
  })

  return {
    canCreate,
    members: membersWithPermissions,
  }
}
