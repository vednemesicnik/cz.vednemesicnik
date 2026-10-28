import { prisma } from '~/utils/db.server'
import { buildHeldByTabWhere } from '~/utils/edit-hold/build-held-by-tab-where'
import { buildHoldConditionWhere } from '~/utils/edit-hold/build-hold-condition-where'
import { createEditHoldHandlers } from '~/utils/edit-hold/create-edit-hold-handlers.server'

/** The podcast's edit hold (design 07g, 27e; logs 0019, 0036). */
export const podcastEditHoldHandlers = createEditHoldHandlers({
  // An empty draft has no cover (a cover is content) and no episodes (only a
  // podcast's page creates one), so it goes alone.
  deleteEmpty: async (id, tab) => {
    const { count } = await prisma.podcast.deleteMany({
      where: { firstContentAt: null, id, ...buildHeldByTabWhere(tab) },
    })

    return count
  },
  entity: 'podcast',

  findHold: async (id) => {
    const podcast = await prisma.podcast.findUnique({
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

    if (podcast === null) return null

    return {
      authorIds: [podcast.authorId],
      heldByAuthorId: podcast.heldByAuthorId,
      heldByName: podcast.heldByAuthor?.name ?? null,
      heldByTabId: podcast.heldByTabId,
      heldSince: podcast.heldSince,
      heldUntil: podcast.heldUntil,
      isEmpty: podcast.firstContentAt === null,
      state: podcast.state,
      submittedAt: podcast.submittedAt,
      updatedAt: podcast.updatedAt,
    }
  },

  writeHold: async (id, condition, data) => {
    const { count } = await prisma.podcast.updateMany({
      data,
      where: { id, ...buildHoldConditionWhere(condition) },
    })

    return count
  },
})
