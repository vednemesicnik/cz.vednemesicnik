import { createSubmissionHandlers } from '~/utils/content-state/create-submission-handlers.server'
import { prisma } from '~/utils/db.server'

/** Podcast submission transitions (design 07d): single author. */
export const podcastSubmissionHandlers = createSubmissionHandlers({
  clearSubmission: async (id) => {
    await prisma.podcast.update({
      data: {
        reviews: { deleteMany: {} },
        submittedAt: null,
        submittedById: null,
      },
      where: { id },
    })
  },
  entity: 'podcast',

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
      data: { submittedAt: new Date(), submittedById: authorId },
      where: { id, state: 'draft', submittedAt: null },
    })

    return count
  },
})
