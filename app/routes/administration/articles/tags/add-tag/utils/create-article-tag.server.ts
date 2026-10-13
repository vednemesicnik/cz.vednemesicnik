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
  return withAuthorPermission(request, {
    action: 'create',
    entity: 'article_tag',
    execute: async (context) => {
      const tag = await prisma.articleTag.create({
        data: {
          authorId,
          name,
          slug,
        },
        select: { id: true },
      })

      publishContentEvent(
        { change: 'create', entity: 'article_tag', entityId: tag.id },
        context,
      )

      return tag
    },
    target: { authorIds: [authorId], state: 'draft' },
  })
}
