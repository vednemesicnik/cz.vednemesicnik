import type { JSONContent } from '@tiptap/react'
import { prisma } from '~/utils/db.server'
import { withAuthorPermission } from '~/utils/permissions/author/actions/with-author-permission.server'

type Options = {
  title: string
  slug: string
  content: JSONContent
  categoryIds?: string[]
  tagIds?: string[]
  authorId: string
}

export const createArticle = (
  request: Request,
  { authorId, title, slug, content, categoryIds, tagIds }: Options,
) =>
  withAuthorPermission(request, {
    action: 'create',
    entity: 'article',
    execute: () =>
      prisma.article.create({
        data: {
          authorId,
          categories: {
            connect: categoryIds?.map((id) => ({ id })) || [],
          },
          content,
          slug,
          tags: {
            connect: tagIds?.map((id) => ({ id })) || [],
          },
          title,
        },
        select: { id: true },
      }),
    target: { authorId, state: 'draft' },
  })
