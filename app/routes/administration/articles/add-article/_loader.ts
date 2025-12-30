import { href } from 'react-router'

import { prisma } from '~/utils/db.server'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { requireAuthorPermission } from '~/utils/permissions/author/guards/require-author-permission.server'
import { getAuthorsByPermission } from '~/utils/permissions/author/queries/get-authors-by-permission.server'

import type { Route } from './+types/route'

export const loader = async ({ request }: Route.LoaderArgs) => {
  const context = await getAuthorPermissionContext(request, {
    actions: ['create'],
    entities: ['article'],
  })

  requireAuthorPermission(context, {
    action: 'create',
    entity: 'article',
    redirectTo: href('/administration/articles'),
    state: 'draft',
    targetAuthorId: context.authorId,
  })

  const authors = await getAuthorsByPermission(
    context,
    'article',
    'create',
    'draft',
  )

  // Get published categories and tags for selection
  const categories = await prisma.articleCategory.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
    },
    where: {
      state: 'published',
    },
  })

  const tags = await prisma.articleTag.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
    },
    where: {
      state: 'published',
    },
  })

  return {
    authors,
    categories,
    selfAuthorId: context.authorId,
    tags,
  }
}
