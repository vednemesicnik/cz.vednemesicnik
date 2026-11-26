import { EDIT_HOLD_CONFIG } from '~/config/edit-hold-config'
import { deleteContentLog } from '~/utils/content-log/delete-content-log.server'
import { prisma } from '~/utils/db.server'

/**
 * An empty podcast draft never held for this long is left over: the editor
 * takes the hold as it opens.
 */
export const STALE_EMPTY_PODCAST_DRAFT_AGE_MILLISECONDS =
  EDIT_HOLD_CONFIG.durationMilliseconds

type Options = {
  now?: Date
}

/**
 * Deletes empty podcast drafts (no first content, log 0020) whose edit hold
 * expired without a release, whatever their age: an empty draft ends with its
 * hold (24e). One never held is deleted once a hold would have expired: a
 * double click or an abandoned redirect. An empty draft has neither a cover
 * nor episodes: a cover is content, and only a podcast's page creates an
 * episode. A system clean-up: nothing is logged and no event is sent. An open
 * editor renews its hold, so its draft stays.
 *
 * @param options - The current time.
 * @returns The number of deleted drafts.
 */
export const deleteStaleEmptyPodcastDrafts = async ({
  now = new Date(),
}: Options = {}) => {
  const where = {
    firstContentAt: null,
    OR: [
      { heldUntil: { lt: now } },
      {
        createdAt: {
          lt: new Date(
            now.getTime() - STALE_EMPTY_PODCAST_DRAFT_AGE_MILLISECONDS,
          ),
        },
        heldUntil: null,
      },
    ],
    // Only a draft is ever empty; nothing published goes with the sweep.
    state: 'draft' as const,
  }

  const staleDrafts = await prisma.podcast.findMany({
    select: { id: true },
    where,
  })

  if (staleDrafts.length === 0) return 0

  const ids = staleDrafts.map((draft) => draft.id)

  // The condition is repeated so a draft that got content meanwhile stays.
  const { count } = await prisma.podcast.deleteMany({
    where: { ...where, id: { in: ids } },
  })

  // Only the deleted drafts lose their history, not one that got content.
  const keptDrafts = await prisma.podcast.findMany({
    select: { id: true },
    where: { id: { in: ids } },
  })
  const keptIds = new Set(keptDrafts.map((draft) => draft.id))

  await Promise.all(
    ids
      .filter((id) => !keptIds.has(id))
      .map((id) => deleteContentLog({ entity: 'podcast', entityId: id })),
  )

  return count
}
