import { deleteContentLog } from '~/utils/content-log/delete-content-log.server'
import { prisma } from '~/utils/db.server'

/** An empty draft older than this is left over, not being started. */
export const STALE_EMPTY_DRAFT_AGE_MILLISECONDS = 24 * 60 * 60 * 1000

/**
 * Deletes empty drafts (no first content, decision 0020) created more than a
 * day ago whose edit hold is free. A system clean-up: nothing is logged and no
 * event is sent. Until the edit hold is taken (#669), an editor left open for
 * more than a day on a new draft loses it.
 *
 * @param now - The current time.
 * @returns The number of deleted drafts.
 */
export const deleteStaleEmptyDrafts = async (now: Date = new Date()) => {
  const where = {
    createdAt: {
      lt: new Date(now.getTime() - STALE_EMPTY_DRAFT_AGE_MILLISECONDS),
    },
    firstContentAt: null,
    OR: [{ heldUntil: null }, { heldUntil: { lt: now } }],
  }

  const staleDrafts = await prisma.article.findMany({
    select: { id: true },
    where,
  })

  if (staleDrafts.length === 0) return 0

  const ids = staleDrafts.map((draft) => draft.id)

  // The condition is repeated so a draft that got content meanwhile stays.
  const { count } = await prisma.article.deleteMany({
    where: { ...where, id: { in: ids } },
  })

  await Promise.all(
    ids.map((id) => deleteContentLog({ entity: 'article', entityId: id })),
  )

  return count
}
