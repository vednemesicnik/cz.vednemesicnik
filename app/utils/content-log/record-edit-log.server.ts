import type { ContentLogEntity } from '@generated/prisma/enums'

import { recordContentLog } from '~/utils/content-log/record-content-log.server'
import { prisma } from '~/utils/db.server'
import type { AuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { publishContentEvent } from '~/utils/sse/publish-content-event.server'

type Options = {
  /** A content type with an editor that saves as it goes (log 0022). */
  entity: Extract<ContentLogEntity, 'article' | 'issue' | 'podcast_episode'>
  entityId: string
  /** The save made the empty draft's first content: its creation (0020). */
  isCreation: boolean
  /** When the editor's hold began; `null` when nobody holds it any more. */
  heldSince: Date | null
}

// Whether the content's latest history entry is this author's edit.
const isLastEntryOwnEdit = async (
  authorId: string,
  { entity, entityId }: Pick<Options, 'entity' | 'entityId'>,
) => {
  const lastEntry = await prisma.contentLog.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { actorId: true, event: true },
    where: { entity, entityId },
  })
  return (
    lastEntry?.actorId === authorId &&
    (lastEntry.event === 'create' || lastEntry.event === 'update')
  )
}

/**
 * Logs one saved edit of an article, an issue or an episode and tells the open lists
 * (design 07f, 24e): the creation once, then one *Upraveno* per hold, however
 * often the editor saves.
 *
 * @param context - Who saved.
 * @param options - The content, whether it is the creation, and the hold's
 *   start.
 */
export const recordEditLog = async (
  context: AuthorPermissionContext,
  { entity, entityId, isCreation, heldSince }: Options,
) => {
  const change = isCreation ? 'create' : 'update'

  // Without a hold (an upload landing after *Zavřít*), the hold it belonged
  // to is the one the history's last entry, by the same author, closed.
  const isLoggedInThisHold =
    change === 'update' &&
    (heldSince === null
      ? await isLastEntryOwnEdit(context.authorId, { entity, entityId })
      : (await prisma.contentLog.count({
          where: {
            actorId: context.authorId,
            createdAt: { gte: heldSince },
            entity,
            entityId,
            event: { in: ['create', 'update'] },
          },
        })) > 0)

  if (!isLoggedInThisHold) {
    await recordContentLog({ entity, entityId, events: [change] }, context)
  }

  publishContentEvent({ change, entity, entityId }, context)
}
