import type { LoaderFunctionArgs } from 'react-router'

import { prisma } from '~/utils/db.server'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { getAuthorsByPermission } from '~/utils/permissions/author/queries/get-authors-by-permission.server'

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const context = await getAuthorPermissionContext(request, {
    actions: ['create'],
    entities: ['editorial_board_member'],
  })

  // Check create permission
  const canCreate = context.can({
    action: 'create',
    entity: 'editorial_board_member',
  }).hasPermission

  // If author cannot create members, they shouldn't access this page
  if (!canCreate) {
    throw new Response('Forbidden', { status: 403 })
  }

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
      'create',
      'draft',
    ),
  ])

  return {
    authors,
    editorialBoardMemberPositions,
    selfAuthorId: context.authorId,
  }
}
