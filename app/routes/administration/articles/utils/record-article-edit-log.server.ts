import { recordContentLog } from '~/utils/content-log/record-content-log.server'
import { prisma } from '~/utils/db.server'
import type { AuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { publishContentEvent } from '~/utils/sse/publish-content-event.server'

type Options = {
  articleId: string
  /** The save made the empty draft's first content: its creation (0020). */
  isCreation: boolean
  /** When the editor's hold began; `null` when nobody holds it any more. */
  heldSince: Date | null
}

/**
 * Logs one saved edit of an article and tells the open lists (design 07f,
 * 24e): the creation once, then one *Upraveno* per hold, however often the
 * editor saves.
 *
 * @param context - Who saved.
 * @param options - The article, whether it is the creation, and the hold's
 *   start.
 */
export const recordArticleEditLog = async (
  context: AuthorPermissionContext,
  { articleId, isCreation, heldSince }: Options,
) => {
  const change = isCreation ? 'create' : 'update'

  const isLoggedInThisHold =
    change === 'update' &&
    heldSince !== null &&
    (await prisma.contentLog.count({
      where: {
        actorId: context.authorId,
        createdAt: { gte: heldSince },
        entity: 'article',
        entityId: articleId,
        event: { in: ['create', 'update'] },
      },
    })) > 0

  if (!isLoggedInThisHold) {
    await recordContentLog(
      { entity: 'article', entityId: articleId, events: [change] },
      context,
    )
  }

  publishContentEvent(
    { change, entity: 'article', entityId: articleId },
    context,
  )
}
