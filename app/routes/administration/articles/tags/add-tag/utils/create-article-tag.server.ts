import { prisma } from '~/utils/db.server'
import { withAuthorPermission } from '~/utils/permissions/author/actions/with-author-permission.server'

type Options = {
  name: string
  slug: string
  authorId: string
}

export const createArticleTag = async (
  request: Request,
  { name, slug, authorId }: Options,
) =>
  withAuthorPermission(request, {
    action: 'create',
    entity: 'article_tag',
    execute: () =>
      prisma.articleTag.create({
        data: {
          authorId,
          name,
          slug,
        },
        select: { id: true },
      }),
    target: { authorId, state: 'draft' },
  })
