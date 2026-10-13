import type { ContentState } from '@generated/prisma/enums'
import { prisma } from '~/utils/db.server'
import { withAuthorPermission } from '~/utils/permissions/author/actions/with-author-permission.server'
import { publishContentEvent } from '~/utils/sse/publish-content-event.server'

type Options = {
  tagId: string
  name: string
  slug: string
  authorId: string
  state: ContentState
}

export const updateTag = async (
  request: Request,
  { tagId, name, slug, authorId, state }: Options,
) => {
  return withAuthorPermission(request, {
    action: 'update',
    entity: 'article_tag',
    execute: async (context) => {
      const tag = await prisma.articleTag.update({
        data: {
          authorId,
          name,
          slug,
        },
        select: { id: true },
        where: { id: tagId },
      })

      publishContentEvent(
        { change: 'update', entity: 'article_tag', entityId: tagId },
        context,
      )

      return tag
    },
    target: { authorIds: [authorId], state },
  })
}
