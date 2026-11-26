import { prisma } from '~/utils/db.server'
import { buildHeldByTabWhere } from '~/utils/edit-hold/build-held-by-tab-where'
import { buildHoldConditionWhere } from '~/utils/edit-hold/build-hold-condition-where'
import { createEditHoldHandlers } from '~/utils/edit-hold/create-edit-hold-handlers.server'

/** The episode's edit hold (design 07g, 27d; logs 0019, 0036). */
export const episodeEditHoldHandlers = createEditHoldHandlers({
  deleteEmpty: async (id, tab) => {
    const { count } = await prisma.podcastEpisode.deleteMany({
      where: { firstContentAt: null, id, ...buildHeldByTabWhere(tab) },
    })

    return count
  },
  entity: 'podcast_episode',

  findHold: async (id) => {
    const episode = await prisma.podcastEpisode.findUnique({
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

    if (episode === null) return null

    return {
      authorIds: [episode.authorId],
      heldByAuthorId: episode.heldByAuthorId,
      heldByName: episode.heldByAuthor?.name ?? null,
      heldByTabId: episode.heldByTabId,
      heldSince: episode.heldSince,
      heldUntil: episode.heldUntil,
      isEmpty: episode.firstContentAt === null,
      state: episode.state,
      submittedAt: episode.submittedAt,
      updatedAt: episode.updatedAt,
    }
  },

  writeHold: async (id, condition, data) => {
    const { count } = await prisma.podcastEpisode.updateMany({
      data,
      where: { id, ...buildHoldConditionWhere(condition) },
    })

    return count
  },
})
