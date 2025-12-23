import { href } from 'react-router'

import { prisma } from '~/utils/db.server'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { requireAuthorPermission } from '~/utils/permissions/author/guards/require-author-permission.server'
import { getAuthorsByPermission } from '~/utils/permissions/author/queries/get-authors-by-permission.server'

import type { Route } from './+types/route'

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const context = await getAuthorPermissionContext(request, {
    actions: ['update'],
    entities: ['article_category'],
  })

  const category = await prisma.articleCategory.findUniqueOrThrow({
    select: {
      author: {
        select: {
          id: true,
        },
      },
      authorId: true,
      id: true,
      name: true,
      slug: true,
      state: true,
    },
    where: { id: params.categoryId },
  })

  requireAuthorPermission(context, {
    action: 'update',
    entity: 'article_category',
    redirectTo: href('/administration/articles/categories/:categoryId', {
      categoryId: category.id,
    }),
    state: category.state,
    targetAuthorId: category.authorId,
  })

  const authors = await getAuthorsByPermission(
    context,
    'article_category',
    'update',
    category.state,
  )

  return {
    authors,
    category,
  }
}
