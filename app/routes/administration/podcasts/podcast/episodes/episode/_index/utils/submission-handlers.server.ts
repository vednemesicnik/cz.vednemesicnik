import { createSubmissionHandlers } from '~/utils/content-state/create-submission-handlers.server'
import { prisma } from '~/utils/db.server'

/** Episode submission transitions (design 07d): single author. */
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
