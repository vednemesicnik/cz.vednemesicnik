import { prisma } from '~/utils/db.server'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { requireContentUpdatePermission } from '~/utils/permissions/author/guards/require-content-update-permission.server'
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
    actions: ['view', 'update'],
    entities: ['article_tag'],
  })

  requireContentUpdatePermission(context, {
    authorIds: [tag.authorId],
    id: tagId,
    kind: 'tag',
    state: tag.state,
    title: tag.name,
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
