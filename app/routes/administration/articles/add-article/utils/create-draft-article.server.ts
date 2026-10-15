import { prisma } from '~/utils/db.server'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { requireAuthorPermission } from '~/utils/permissions/author/guards/require-author-permission.server'

import { deleteStaleEmptyDrafts } from './delete-stale-empty-drafts.server'

/**
 * Creates an empty draft owned by the signed-in author (decision 0020): no
 * title, text, address or history yet, so nobody sees it until it has
 * content. Also clears empty drafts left over from earlier clicks.
 *
 * @param request - The action's request; the caller has checked the session.
 * @returns The new draft's id.
 * @throws A 403 response when the author may not create articles.
 */
export const createDraftArticle = async (request: Request) => {
  const context = await getAuthorPermissionContext(request, {
    actions: ['create'],
    entities: ['article'],
  })

  requireAuthorPermission(context, {
    action: 'create',
    entity: 'article',
    state: 'draft',
    targetAuthorIds: [context.authorId],
  })

  const draft = await prisma.article.create({
    data: {
      authors: { connect: { id: context.authorId } },
      content: '',
      title: '',
    },
    select: { id: true },
  })

  await deleteStaleEmptyDrafts()

  return { articleId: draft.id }
}
