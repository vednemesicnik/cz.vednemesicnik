import type { LoaderFunctionArgs } from 'react-router'

import { prisma } from '~/utils/db.server'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { getAuthorsByPermission } from '~/utils/permissions/author/queries/get-authors-by-permission.server'

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const context = await getAuthorPermissionContext(request, {
    actions: ['create'],
    entities: ['editorial_board_position'],
  })

  // Check create permission
  const canCreate = context.can({
    action: 'create',
    entity: 'editorial_board_position',
  }).hasPermission

  // If author cannot create positions, they shouldn't access this page
  if (!canCreate) {
    throw new Response('Forbidden', { status: 403 })
  }

  const editorialBoardPositionsCount =
    await prisma.editorialBoardPosition.count()

  const authors = await getAuthorsByPermission(
    context,
    'editorial_board_position',
    'create',
    'draft',
  )

  return {
    authors,
    editorialBoardPositionsCount,
    selfAuthorId: context.authorId,
  }
}
