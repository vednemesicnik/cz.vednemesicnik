import { prisma } from '~/utils/db.server'
import { getEditHeldRefusal } from '~/utils/edit-hold/get-edit-held-refusal'

type Options = {
  /** A delete waits for one's own other tab too (log 0036). */
  countsOwnOtherTab?: boolean
}

/**
 * Whose edit hold stops the acting author's write on the episode now (design
 * 07g), for a refused transition's „Epizodu právě upravuje …“ (copy ahizoh4o).
 *
 * @param id - The episode.
 * @param authorId - The acting author; their own hold counts only with
 *   `countsOwnOtherTab`.
 * @param options - Whether one's own other tab counts.
 * @returns The refusal, or `null` when the episode is free, the author's own
 *   or gone.
 */
export const findEpisodeHeldRefusal = async (
  id: string,
  authorId: string,
  { countsOwnOtherTab = false }: Options = {},
) => {
  const episode = await prisma.podcastEpisode.findUnique({
    select: {
      heldByAuthor: { select: { name: true } },
      heldByAuthorId: true,
      heldByTabId: true,
      heldSince: true,
      heldUntil: true,
    },
    where: { id },
  })

  if (episode === null) return null

  return getEditHeldRefusal(episode, {
    authorId,
    countsOwnOtherTab,
    now: new Date(),
  })
}
