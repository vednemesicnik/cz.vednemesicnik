import { createSubmissionHandlers } from '~/utils/content-state/create-submission-handlers.server'
import { prisma } from '~/utils/db.server'

/** Category submission transitions (design 07d): single author. */
export const categorySubmissionHandlers = createSubmissionHandlers({
  clearSubmission: async (id) => {
    await prisma.articleCategory.update({
      data: {
        reviews: { deleteMany: {} },
        submittedAt: null,
        submittedById: null,
      },
      where: { id },
    })
  },
  entity: 'article_category',

  loadSubmissionState: async (id) => {
    const category = await prisma.articleCategory.findUniqueOrThrow({
      select: {
        author: { select: { id: true, role: { select: { level: true } } } },
        state: true,
        submittedAt: true,
      },
      where: { id },
    })

    return {
      authors: [category.author],
      state: category.state,
      submittedAt: category.submittedAt,
    }
  },

  markSubmitted: async (id, authorId) => {
    const { count } = await prisma.articleCategory.updateMany({
      data: { submittedAt: new Date(), submittedById: authorId },
      where: { id, state: 'draft', submittedAt: null },
    })

    return count
  },
})
