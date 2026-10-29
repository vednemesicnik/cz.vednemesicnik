import { createSubmissionHandlers } from '~/utils/content-state/create-submission-handlers.server'
import { prisma } from '~/utils/db.server'
import { buildNotHeldByOthersWhere } from '~/utils/edit-hold/build-not-held-by-others-where'
import { createEditHeldRefusal } from '~/utils/edit-hold/create-edit-held-refusal.server'
import { refuseWhenHeld } from '~/utils/edit-hold/refuse-when-held.server'

import { loadMissingEpisodeContent } from '../../../utils/load-missing-episode-content.server'
import { loadUnpublishedPodcastItems } from '../../../utils/load-unpublished-podcast-items.server'
import { findEpisodeHeldRefusal } from './find-episode-held-refusal.server'

/**
 * Episode submission transitions (design 07d): single author, submitted only
 * in a published podcast (27f), complete (27h) and with a number and an
 * address no other episode of the podcast holds (log 0039). None of them runs
 * while someone else edits the episode (log 0019).
 */
export const episodeSubmissionHandlers = createSubmissionHandlers({
  clearSubmission: async (id, authorId) => {
    await refuseWhenHeld(
      () =>
        prisma.podcastEpisode.update({
          data: {
            reviews: { deleteMany: {} },
            submittedAt: null,
            submittedById: null,
          },
          select: { id: true },
          // Not while someone else edits it (log 0019).
          where: { AND: [buildNotHeldByOthersWhere(authorId, new Date())], id },
        }),
      () => findEpisodeHeldRefusal(id, authorId),
    )
  },
  entity: 'podcast_episode',
  // The unpublished podcast is said first (27f).
  getMissing: async (id) => [
    ...(await loadUnpublishedPodcastItems(id)),
    ...(await loadMissingEpisodeContent(id)),
  ],

  loadSubmissionState: async (id) => {
    const episode = await prisma.podcastEpisode.findUniqueOrThrow({
      select: {
        author: { select: { id: true, role: { select: { level: true } } } },
        state: true,
        submittedAt: true,
      },
      where: { id },
    })

    return {
      authors: [episode.author],
      state: episode.state,
      submittedAt: episode.submittedAt,
    }
  },

  markSubmitted: async (id, authorId) => {
    const { count } = await prisma.podcastEpisode.updateMany({
      data: {
        // Its author no longer edits a submitted episode (07d): one's own
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
      const refusal = await findEpisodeHeldRefusal(id, authorId)

      if (refusal !== null) throw createEditHeldRefusal(refusal)
    }

    return count
  },
})
