import { prisma } from '~/utils/db.server'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'

import type { Route } from './+types/route'

export const loader = async ({ request }: Route.LoaderArgs) => {
  const context = await getAuthorPermissionContext(request, {
    actions: ['view', 'create', 'update', 'delete'],
    entities: ['editorial_board_position'],
  })

  // Check create permission
  const { hasPermission: canCreate } = context.can({
    action: 'create',
    entity: 'editorial_board_position',
    targetAuthorId: context.authorId,
  })

  const editorialBoardPositions = await prisma.editorialBoardPosition.findMany({
    orderBy: {
      order: 'asc',
    },
    select: {
      author: {
        select: {
          id: true,
        },
      },
      id: true,
      key: true,
      order: true,
      pluralLabel: true,
      state: true,
    },
  })

  const positionsWithPermissions = editorialBoardPositions.map((position) => {
    const { hasPermission: canView } = context.can({
      action: 'view',
      entity: 'editorial_board_position',
      state: position.state,
      targetAuthorId: position.author.id,
    })

    const { hasPermission: canEdit } = context.can({
      action: 'update',
      entity: 'editorial_board_position',
      state: position.state,
      targetAuthorId: position.author.id,
    })

    const { hasPermission: canDelete } = context.can({
      action: 'delete',
      entity: 'editorial_board_position',
      state: position.state,
      targetAuthorId: position.author.id,
    })

    return {
      canDelete,
      canEdit,
      canView,
      id: position.id,
      key: position.key,
      order: position.order,
      pluralLabel: position.pluralLabel,
      state: position.state,
    }
  })

  return {
    canCreate,
    positions: positionsWithPermissions,
  }
}
