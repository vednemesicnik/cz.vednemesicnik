import { createSubmissionHandlers } from '~/utils/content-state/create-submission-handlers.server'
import { prisma } from '~/utils/db.server'
import { buildNotHeldByOthersWhere } from '~/utils/edit-hold/build-not-held-by-others-where'
import { createEditHeldRefusal } from '~/utils/edit-hold/create-edit-held-refusal.server'
import { refuseWhenHeld } from '~/utils/edit-hold/refuse-when-held.server'

import { loadMissingPodcastContent } from '../../../utils/load-missing-podcast-content.server'
import { findPodcastHeldRefusal } from './find-podcast-held-refusal.server'

/**
 * Podcast submission transitions (design 07d): single author, submitted only
 * complete and with an address no other podcast holds (27i, log 0039). None
 * of them runs while someone else edits the podcast (log 0019).
 */
export const podcastSubmissionHandlers = createSubmissionHandlers({
  clearSubmission: async (id, authorId) => {
    await refuseWhenHeld(
      () =>
        prisma.podcast.update({
          data: {
            reviews: { deleteMany: {} },
            submittedAt: null,
            submittedById: null,
          },
          select: { id: true },
          // Not while someone else edits it (log 0019).
          where: { AND: [buildNotHeldByOthersWhere(authorId, new Date())], id },
        }),
      () => findPodcastHeldRefusal(id, authorId),
    )
  },
  entity: 'podcast',
  getMissing: loadMissingPodcastContent,

  loadSubmissionState: async (id) => {
    const podcast = await prisma.podcast.findUniqueOrThrow({
      select: {
        author: { select: { id: true, role: { select: { level: true } } } },
        state: true,
        submittedAt: true,
      },
      where: { id },
    })

    return {
      authors: [podcast.author],
      state: podcast.state,
      submittedAt: podcast.submittedAt,
    }
  },

  markSubmitted: async (id, authorId) => {
    const { count } = await prisma.podcast.updateMany({
      data: {
        // Its author no longer edits a submitted podcast (07d): one's own
        // edit, open in another tab, ends with it.
        heldByAuthorId: null,
        heldByTabId: null,
        heldSince: null,
        heldUntil: null,
        submittedAt: new Date(),
        submittedById: authorId,
      },
      where: {
        // Not while someone else edits it (log 0019).
        AND: [buildNotHeldByOthersWhere(authorId, new Date())],
        id,
        state: 'draft',
        submittedAt: null,
      },
    })

    if (count === 0) {
      const refusal = await findPodcastHeldRefusal(id, authorId)

      if (refusal !== null) throw createEditHeldRefusal(refusal)
    }

    return count
  },
})
