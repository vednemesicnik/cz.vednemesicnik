import { createSubmissionHandlers } from '~/utils/content-state/create-submission-handlers.server'
import { prisma } from '~/utils/db.server'
import { buildNotHeldByOthersWhere } from '~/utils/edit-hold/build-not-held-by-others-where'
import { createEditHeldRefusal } from '~/utils/edit-hold/create-edit-held-refusal.server'
import { refuseWhenHeld } from '~/utils/edit-hold/refuse-when-held.server'

import { findIssueHeldRefusal } from './find-issue-held-refusal.server'
import { loadMissingIssueContent } from './load-missing-issue-content.server'

/**
 * Issue submission transitions (design 07d): single author. An issue is
 * checked for completeness before it is submitted (design 26e).
 */
export const issueSubmissionHandlers = createSubmissionHandlers({
  clearSubmission: async (id, authorId) => {
    await refuseWhenHeld(
      () =>
        prisma.issue.update({
          data: {
            reviews: { deleteMany: {} },
            submittedAt: null,
            submittedById: null,
          },
          select: { id: true },
          // Not while someone else edits it (log 0019).
          where: { AND: [buildNotHeldByOthersWhere(authorId, new Date())], id },
        }),
      () => findIssueHeldRefusal(id, authorId),
    )
  },
  entity: 'issue',

  getMissing: loadMissingIssueContent,

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
      data: {
        // Its author no longer edits a submitted issue (07d): one's own edit,
        // open in another tab, ends with it.
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
      const refusal = await findIssueHeldRefusal(id, authorId)

      if (refusal !== null) throw createEditHeldRefusal(refusal)
    }

    return count
  },
})
