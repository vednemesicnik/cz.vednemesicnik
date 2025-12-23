import { href } from 'react-router'

import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { requireAuthorPermission } from '~/utils/permissions/author/guards/require-author-permission.server'
import { getAuthorsByPermission } from '~/utils/permissions/author/queries/get-authors-by-permission.server'

import type { Route } from './+types/route'

export const loader = async ({ request }: Route.LoaderArgs) => {
  const context = await getAuthorPermissionContext(request, {
    actions: ['create'],
    entities: ['article_tag'],
  })

  requireAuthorPermission(context, {
    action: 'create',
    entity: 'article_tag',
    redirectTo: href('/administration/articles/tags'),
    state: 'draft',
    targetAuthorId: context.authorId,
  })

  const authors = await getAuthorsByPermission(
    context,
    'article_tag',
    'create',
    'draft',
  )

  return {
    authors,
    selfAuthorId: context.authorId,
  }
}
