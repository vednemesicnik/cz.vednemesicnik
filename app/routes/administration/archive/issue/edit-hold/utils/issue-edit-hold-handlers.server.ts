import { prisma } from '~/utils/db.server'
import { buildHeldByTabWhere } from '~/utils/edit-hold/build-held-by-tab-where'
import { buildHoldConditionWhere } from '~/utils/edit-hold/build-hold-condition-where'
import { createEditHoldHandlers } from '~/utils/edit-hold/create-edit-hold-handlers.server'

/** The issue's edit hold (design 07g, 26c; logs 0019, 0034). */
export const issueEditHoldHandlers = createEditHoldHandlers({
  deleteEmpty: async (id, tab) => {
    const { count } = await prisma.issue.deleteMany({
      where: { firstContentAt: null, id, ...buildHeldByTabWhere(tab) },
    })

    return count
  },
  entity: 'issue',

  findHold: async (id) => {
    const issue = await prisma.issue.findUnique({
      select: {
        authorId: true,
        firstContentAt: true,
        heldByAuthor: { select: { name: true } },
        heldByAuthorId: true,
        heldByTabId: true,
        heldSince: true,
        heldUntil: true,
        state: true,
        submittedAt: true,
        updatedAt: true,
      },
      where: { id },
    })

    if (issue === null) return null

    return {
      authorIds: [issue.authorId],
      heldByAuthorId: issue.heldByAuthorId,
      heldByName: issue.heldByAuthor?.name ?? null,
      heldByTabId: issue.heldByTabId,
      heldSince: issue.heldSince,
      heldUntil: issue.heldUntil,
      isEmpty: issue.firstContentAt === null,
      state: issue.state,
      submittedAt: issue.submittedAt,
      updatedAt: issue.updatedAt,
    }
  },

  writeHold: async (id, condition, data) => {
    const { count } = await prisma.issue.updateMany({
      data,
      where: { id, ...buildHoldConditionWhere(condition) },
    })

    return count
  },
})
