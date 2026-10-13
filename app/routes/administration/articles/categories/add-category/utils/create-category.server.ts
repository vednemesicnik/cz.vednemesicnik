import { prisma } from '~/utils/db.server'
import { withAuthorPermission } from '~/utils/permissions/author/actions/with-author-permission.server'
import { publishContentEvent } from '~/utils/sse/publish-content-event.server'

type Options = {
  name: string
  slug: string
  authorId: string
}

export const createCategory = async (
  request: Request,
  { authorId, name, slug }: Options,
) => {
  return withAuthorPermission(request, {
    action: 'create',
    entity: 'article_category',
    execute: async (context) => {
      const category = await prisma.articleCategory.create({
        data: {
          authorId,
          name,
          slug,
        },
        select: { id: true },
      })

      publishContentEvent(
        { change: 'create', entity: 'article_category', entityId: category.id },
        context,
      )

      return category
    },
    target: { authorIds: [authorId], state: 'draft' },
  })
}
