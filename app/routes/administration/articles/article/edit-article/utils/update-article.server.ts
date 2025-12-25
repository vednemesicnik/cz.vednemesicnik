import type { ContentState } from '@generated/prisma/enums'
import { prisma } from '~/utils/db.server'
import { withAuthorPermission } from '~/utils/permissions/author/actions/with-author-permission.server'

type Options = {
  articleId: string
  title: string
  slug: string
  content: string
  categoryIds?: string[]
  tagIds?: string[]
  authorId: string
  state: ContentState
}

export const updateArticle = (
  request: Request,
  {
    articleId,
    authorId,
    title,
    slug,
    content,
    categoryIds,
    tagIds,
    state,
  }: Options,
) =>
  withAuthorPermission(request, {
    action: 'update',
    entity: 'article',
    execute: () =>
      prisma.article.update({
        data: {
          authorId,
          categories: {
            set: categoryIds?.map((id) => ({ id })) || [],
          },
          content,
          slug,
          tags: {
            set: tagIds?.map((id) => ({ id })) || [],
          },
          title,
        },
        select: { id: true },
        where: { id: articleId },
      }),
    target: { authorId, state },
  })
