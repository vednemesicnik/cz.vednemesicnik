import { prisma } from '~/utils/db.server'
import { buildHeldByTabWhere } from '~/utils/edit-hold/build-held-by-tab-where'
import { buildHoldConditionWhere } from '~/utils/edit-hold/build-hold-condition-where'
import { createEditHoldHandlers } from '~/utils/edit-hold/create-edit-hold-handlers.server'

/** The article's edit hold (design 07g, 24g; decision 0019). */
export const articleEditHoldHandlers = createEditHoldHandlers({
  deleteEmpty: async (id, tab) => {
    const { count } = await prisma.article.deleteMany({
      where: { firstContentAt: null, id, ...buildHeldByTabWhere(tab) },
    })

    return count
  },
  entity: 'article',

  findHold: async (id) => {
    const article = await prisma.article.findUnique({
      select: {
        authors: { select: { id: true } },
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

    if (article === null) return null

    return {
      authorIds: article.authors.map((author) => author.id),
      heldByAuthorId: article.heldByAuthorId,
      heldByName: article.heldByAuthor?.name ?? null,
      heldByTabId: article.heldByTabId,
      heldSince: article.heldSince,
      heldUntil: article.heldUntil,
      isEmpty: article.firstContentAt === null,
      state: article.state,
      submittedAt: article.submittedAt,
      updatedAt: article.updatedAt,
    }
  },

  writeHold: async (id, condition, data) => {
    const { count } = await prisma.article.updateMany({
      data,
      where: { id, ...buildHoldConditionWhere(condition) },
    })

    return count
  },
})
