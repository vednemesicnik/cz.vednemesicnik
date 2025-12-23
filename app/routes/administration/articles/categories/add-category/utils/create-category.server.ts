import { prisma } from '~/utils/db.server'
import { withAuthorPermission } from '~/utils/permissions/author/actions/with-author-permission.server'

type Options = {
  name: string
  slug: string
  authorId: string
}

export const createCategory = (
  request: Request,
  { authorId, name, slug }: Options,
) =>
  withAuthorPermission(request, {
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
    target: { authorId, state: 'draft' },
  })
