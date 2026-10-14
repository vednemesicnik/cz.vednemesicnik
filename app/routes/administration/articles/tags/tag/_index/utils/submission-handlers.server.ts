import { createSubmissionHandlers } from '~/utils/content-state/create-submission-handlers.server'
import { prisma } from '~/utils/db.server'

/** Tag submission transitions (design 07d): single author. */
export const tagSubmissionHandlers = createSubmissionHandlers({
  clearSubmission: async (id) => {
    await prisma.articleTag.update({
      data: {
        reviews: { deleteMany: {} },
        submittedAt: null,
        submittedById: null,
      },
      where: { id },
    })
  },
  entity: 'article_tag',

  loadSubmissionState: async (id) => {
    const tag = await prisma.articleTag.findUniqueOrThrow({
      select: {
        author: { select: { id: true, role: { select: { level: true } } } },
        state: true,
        submittedAt: true,
      },
      where: { id },
    })

    return {
      authors: [tag.author],
      state: tag.state,
      submittedAt: tag.submittedAt,
    }
  },

  markSubmitted: async (id, authorId) => {
    const { count } = await prisma.articleTag.updateMany({
      data: { submittedAt: new Date(), submittedById: authorId },
      where: { id, state: 'draft', submittedAt: null },
    })

    return count
  },
})
