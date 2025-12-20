import { href } from 'react-router'

import { prisma } from '~/utils/db.server'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { requireAuthorPermission } from '~/utils/permissions/author/guards/require-author-permission.server'
import { getAuthorsByPermission } from '~/utils/permissions/author/queries/get-authors-by-permission.server'

import type { Route } from './+types/route'

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const context = await getAuthorPermissionContext(request, {
    actions: ['update'],
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

  requireAuthorPermission(context, {
    action: 'update',
    entity: 'issue',
    redirectTo: href('/administration/archive/:issueId', { issueId: issue.id }),
    state: issue.state,
    targetAuthorId: issue.authorId,
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
