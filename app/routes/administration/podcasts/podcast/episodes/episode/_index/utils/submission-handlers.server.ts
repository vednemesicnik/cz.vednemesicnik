import { createSubmissionHandlers } from '~/utils/content-state/create-submission-handlers.server'
import { prisma } from '~/utils/db.server'

import { loadTakenEpisodeSlugItems } from '../../../utils/load-taken-episode-slug-items.server'
import { loadUnpublishedPodcastItems } from '../../../utils/load-unpublished-podcast-items.server'

/**
 * Episode submission transitions (design 07d): single author, submitted only
 * in a published podcast (27f) and under an address no other episode of the
 * podcast holds (log 0039).
 */
export const episodeSubmissionHandlers = createSubmissionHandlers({
  clearSubmission: async (id) => {
    await prisma.podcastEpisode.update({
      data: {
        reviews: { deleteMany: {} },
        submittedAt: null,
        submittedById: null,
      },
      where: { id },
    })
  },
  entity: 'podcast_episode',
  // The taken address is said last (24d).
  getMissing: async (id) => [
    ...(await loadUnpublishedPodcastItems(id)),
    ...(await loadTakenEpisodeSlugItems(id)),
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
      data: { submittedAt: new Date(), submittedById: authorId },
      where: { id, state: 'draft', submittedAt: null },
    })

    return count
  },
})
