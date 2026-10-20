import { deleteContentLog } from '~/utils/content-log/delete-content-log.server'
import { prisma } from '~/utils/db.server'

/** An empty draft older than this is left over, not being started. */
export const STALE_EMPTY_ISSUE_DRAFT_AGE_MILLISECONDS = 24 * 60 * 60 * 1000

/**
 * Deletes empty issue drafts (no first content, decision 0020) whose edit hold
 * expired without a release, whatever their age: an empty draft ends with its
 * hold (24e). One never held is deleted a day after it was created. A system
 * clean-up: nothing is logged and no event is sent. An open editor renews its
 * hold, so its draft stays.
 *
 * @param now - The current time.
 * @returns The number of deleted drafts.
 */
export const deleteStaleEmptyIssueDrafts = async (now: Date = new Date()) => {
  const where = {
    firstContentAt: null,
    OR: [
      { heldUntil: { lt: now } },
      {
        createdAt: {
          lt: new Date(
            now.getTime() - STALE_EMPTY_ISSUE_DRAFT_AGE_MILLISECONDS,
          ),
        },
        heldUntil: null,
      },
    ],
  }

  const staleDrafts = await prisma.issue.findMany({
    select: { id: true },
    where,
  })

  if (staleDrafts.length === 0) return 0

  const ids = staleDrafts.map((draft) => draft.id)

  // The condition is repeated so a draft that got content meanwhile stays.
  const { count } = await prisma.issue.deleteMany({
    where: { ...where, id: { in: ids } },
  })

  // Only the deleted drafts lose their history, not one that got content.
  const keptDrafts = await prisma.issue.findMany({
    select: { id: true },
    where: { id: { in: ids } },
  })
  const keptIds = new Set(keptDrafts.map((draft) => draft.id))

  await Promise.all(
    ids
      .filter((id) => !keptIds.has(id))
      .map((id) => deleteContentLog({ entity: 'issue', entityId: id })),
  )

  return count
}
