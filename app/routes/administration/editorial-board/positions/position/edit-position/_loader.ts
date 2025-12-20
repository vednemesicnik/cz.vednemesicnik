import { prisma } from '~/utils/db.server'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { checkAuthorPermission } from '~/utils/permissions/author/guards/check-author-permission.server'
import { getAuthorsByPermission } from '~/utils/permissions/author/queries/get-authors-by-permission.server'

import type { Route } from './+types/route'

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { positionId } = params

  const context = await getAuthorPermissionContext(request, {
    actions: ['update'],
    entities: ['editorial_board_position'],
  })

  const editorialBoardPosition =
    await prisma.editorialBoardPosition.findUniqueOrThrow({
      select: {
        author: {
          select: {
            id: true,
          },
        },
        authorId: true,
        id: true,
        key: true,
        order: true,
        pluralLabel: true,
        state: true,
      },
      where: { id: positionId },
    })

  // Check if author can update this position
  checkAuthorPermission(context, {
    action: 'update',
    entity: 'editorial_board_position',
    state: editorialBoardPosition.state,
    targetAuthorId: editorialBoardPosition.author.id,
  })

  const [editorialBoardPositionsCount, authors] = await Promise.all([
    prisma.editorialBoardPosition.count(),
    getAuthorsByPermission(
      context,
      'editorial_board_position',
      'update',
      editorialBoardPosition.state,
    ),
  ])

  return { authors, editorialBoardPosition, editorialBoardPositionsCount }
}
