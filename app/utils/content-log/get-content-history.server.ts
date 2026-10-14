import type { ContentLogEntity } from '@generated/prisma/enums'

import { prisma } from '~/utils/db.server'

import { type ContentHistory, toContentHistory } from './to-content-history'

/**
 * Reads a content's Historie (design 07f) from `ContentLog`, with the name of
 * whoever did each step; a deleted author has none.
 *
 * @param content - The content's entity and id, and its own creation and
 *   publish dates for the fallback of content older than the log.
 * @returns The rows, newest first, ready for the detail's Historie.
 */
export const getContentHistory = async ({
  entity,
  entityId,
  createdAt,
  publishedAt,
}: {
  entity: ContentLogEntity
  entityId: string
  createdAt: Date
  publishedAt: Date | null
}): Promise<ContentHistory> => {
  const rows = await prisma.contentLog.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      actor: { select: { name: true } },
      actorId: true,
      createdAt: true,
      detail: true,
      event: true,
      id: true,
    },
    where: { entity, entityId },
  })

  return toContentHistory(
    rows.map(({ actor, ...row }) => ({
      ...row,
      actorName: actor?.name ?? null,
    })),
    { createdAt, publishedAt },
  )
}
