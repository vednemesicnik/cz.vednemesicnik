import type { ContentState } from '@generated/prisma/enums'
import { prisma } from '~/utils/db.server'
import { withAuthorPermission } from '~/utils/permissions/author/actions/with-author-permission.server'

type Options = {
  tagId: string
  name: string
  slug: string
  authorId: string
  state: ContentState
}

export const updateTag = (
  request: Request,
  { tagId, name, slug, authorId, state }: Options,
) =>
  withAuthorPermission(request, {
    action: 'update',
    entity: 'article_category',
    execute: () =>
      prisma.articleTag.update({
        data: {
          authorId,
          name,
          slug,
        },
        select: { id: true },
        where: { id: tagId },
      }),
    target: { authorId, state },
  })
