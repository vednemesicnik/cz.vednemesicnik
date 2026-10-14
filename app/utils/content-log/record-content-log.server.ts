import type { ContentLogEntity, ContentLogEvent } from '@generated/prisma/enums'

import { prisma } from '~/utils/db.server'
import type { PublishingAuthor } from '~/utils/sse/publish-content-event.server'

type ContentLogRecord = {
  entity: ContentLogEntity
  entityId: string
  events: ContentLogEvent[]
  detail?: string
}

/**
 * Writes what an author did to a piece of content into its history (design
 * 07f). Never rejects: a logging failure must not break the action, so an error
 * is only logged. Awaited, so the page revalidating after the action shows it.
 *
 * @param record - The content, the events of one step and an optional detail
 *   (`set_published_at`: `"<from ISO> → <to ISO>"`). All events share one time,
 *   so the history can tell they happened in one step.
 * @param actor - The author who did it.
 */
export const recordContentLog = (
  { entity, entityId, events, detail }: ContentLogRecord,
  actor: PublishingAuthor,
): Promise<void> => {
  const createdAt = new Date()

  return prisma.contentLog
    .createMany({
      data: events.map((event) => ({
        actorId: actor.authorId,
        createdAt,
        detail,
        entity,
        entityId,
        event,
      })),
    })
    .then(() => undefined)
    .catch((error: unknown) => {
      console.error('Failed to record content log', error)
    })
}
