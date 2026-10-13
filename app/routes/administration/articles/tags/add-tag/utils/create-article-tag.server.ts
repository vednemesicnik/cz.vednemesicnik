import { prisma } from '~/utils/db.server'
import { withAuthorPermission } from '~/utils/permissions/author/actions/with-author-permission.server'
import { publishContentEvent } from '~/utils/sse/publish-content-event.server'

type Options = {
  name: string
  slug: string
  authorId: string
}

export const createArticleTag = async (
  request: Request,
  { name, slug, authorId }: Options,
) => {
  const tag = await withAuthorPermission(request, {
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
    target: { authorIds: [authorId], state: 'draft' },
  })

  publishContentEvent({
    change: 'create',
    entity: 'article_tag',
    entityId: tag.id,
  })

  return tag
}
