import type { ContentState } from '@generated/prisma/enums'
import { prisma } from '~/utils/db.server'
import { withAuthorPermission } from '~/utils/permissions/author/actions/with-author-permission.server'
import { publishContentEvent } from '~/utils/sse/publish-content-event.server'

type Options = {
  categoryId: string
  name: string
  slug: string
  authorId: string
  state: ContentState
}

export const updateCategory = async (
  request: Request,
  { categoryId, name, slug, authorId, state }: Options,
) => {
  return withAuthorPermission(request, {
    action: 'update',
    entity: 'article_category',
    execute: async (context) => {
      const category = await prisma.articleCategory.update({
        data: {
          authorId,
          name,
          slug,
        },
        select: { id: true },
        where: { id: categoryId },
      })

      publishContentEvent(
        { change: 'update', entity: 'article_category', entityId: categoryId },
        context,
      )

      return category
    },
    target: { authorIds: [authorId], state },
  })
}
