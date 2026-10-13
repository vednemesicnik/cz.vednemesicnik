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
  const category = await withAuthorPermission(request, {
    action: 'create',
    entity: 'article_category',
    execute: () =>
      prisma.articleCategory.create({
        data: {
          authorId,
          name,
          slug,
        },
        select: { id: true },
      }),
    target: { authorIds: [authorId], state: 'draft' },
  })

  publishContentEvent({
    change: 'create',
    entity: 'article_category',
    entityId: category.id,
  })

  return category
}
