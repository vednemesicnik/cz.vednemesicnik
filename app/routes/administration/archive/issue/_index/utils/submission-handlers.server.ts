import { createSubmissionHandlers } from '~/utils/content-state/create-submission-handlers.server'
import { prisma } from '~/utils/db.server'

/** Issue submission transitions (design 07d): single author. */
export const issueSubmissionHandlers = createSubmissionHandlers({
  clearSubmission: async (id) => {
    await prisma.issue.update({
      data: {
        reviews: { deleteMany: {} },
        submittedAt: null,
        submittedById: null,
      },
      where: { id },
    })
  },
  entity: 'issue',

  loadSubmissionState: async (id) => {
    const issue = await prisma.issue.findUniqueOrThrow({
      select: {
        author: { select: { id: true, role: { select: { level: true } } } },
        state: true,
        submittedAt: true,
      },
      where: { id },
    })

    return {
      authors: [issue.author],
      state: issue.state,
      submittedAt: issue.submittedAt,
    }
  },

  markSubmitted: async (id, authorId) => {
    const { count } = await prisma.issue.updateMany({
      data: { submittedAt: new Date(), submittedById: authorId },
      where: { id, state: 'draft', submittedAt: null },
    })

    return count
  },
})
