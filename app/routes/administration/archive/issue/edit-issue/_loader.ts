import { prisma } from '~/utils/db.server'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { requireContentUpdatePermission } from '~/utils/permissions/author/guards/require-content-update-permission.server'
import { getAuthorsByPermission } from '~/utils/permissions/author/queries/get-authors-by-permission.server'

import type { Route } from './+types/route'

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const context = await getAuthorPermissionContext(request, {
    actions: ['view', 'update'],
    entities: ['issue'],
  })

  const issue = await prisma.issue.findUniqueOrThrow({
    select: {
      author: {
        select: {
          id: true,
        },
      },
      authorId: true,
      cover: {
        select: {
          id: true,
        },
      },
      id: true,
      label: true,
      pdf: {
        select: {
          id: true,
        },
      },
      publishedAt: true,
      releasedAt: true,
      state: true,
    },
    where: { id: params.issueId },
  })

  requireContentUpdatePermission(context, {
    authorIds: [issue.authorId],
    id: params.issueId,
    kind: 'issue',
    state: issue.state,
    title: issue.label,
  })

  const authors = await getAuthorsByPermission(
    context,
    'issue',
    'update',
    issue.state,
  )

  return {
    authors,
    issue,
  }
}
