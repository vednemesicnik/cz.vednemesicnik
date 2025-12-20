import { prisma } from '~/utils/db.server'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { checkAuthorPermission } from '~/utils/permissions/author/guards/check-author-permission.server'
import { getAuthorsByPermission } from '~/utils/permissions/author/queries/get-authors-by-permission.server'

import type { Route } from './+types/route'

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { memberId } = params

  const context = await getAuthorPermissionContext(request, {
    actions: ['update'],
    entities: ['editorial_board_member'],
  })

  const editorialBoardMember =
    await prisma.editorialBoardMember.findUniqueOrThrow({
      select: {
        author: {
          select: {
            id: true,
          },
        },
        authorId: true,
        fullName: true,
        id: true,
        positions: {
          select: {
            id: true,
          },
        },
        state: true,
      },
      where: { id: memberId },
    })

  // Check if author can update this member
  checkAuthorPermission(context, {
    action: 'update',
    entity: 'editorial_board_member',
    state: editorialBoardMember.state,
    targetAuthorId: editorialBoardMember.author.id,
  })

  const [editorialBoardMemberPositions, authors] = await Promise.all([
    prisma.editorialBoardPosition.findMany({
      select: {
        id: true,
        key: true,
      },
    }),
    getAuthorsByPermission(
      context,
      'editorial_board_member',
      'update',
      editorialBoardMember.state,
    ),
  ])

  return { authors, editorialBoardMember, editorialBoardMemberPositions }
}
