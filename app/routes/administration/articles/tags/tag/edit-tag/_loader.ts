import { href } from 'react-router'
import { prisma } from '~/utils/db.server'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { requireAuthorPermission } from '~/utils/permissions/author/guards/require-author-permission.server'
import { getAuthorsByPermission } from '~/utils/permissions/author/queries/get-authors-by-permission.server'
import type { Route } from './+types/route'

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { tagId } = params

  const tag = await prisma.articleTag.findUnique({
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
    where: { id: tagId },
  })

  if (tag === null) {
    throw new Response('Tag nenalezen', { status: 404 })
  }

  const context = await getAuthorPermissionContext(request, {
    actions: ['update'],
    entities: ['article_tag'],
  })

  requireAuthorPermission(context, {
    action: 'update',
    entity: 'article_tag',
    redirectTo: href('/administration/articles/tags/:tagId', { tagId }),
    state: tag.state,
    targetAuthorId: tag.authorId,
  })

  const authors = await getAuthorsByPermission(
    context,
    'article_category',
    'update',
    tag.state,
  )

  return {
    authors,
    tag,
  }
}
