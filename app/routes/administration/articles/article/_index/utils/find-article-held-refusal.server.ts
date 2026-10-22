import { prisma } from '~/utils/db.server'
import { getEditHeldRefusal } from '~/utils/edit-hold/get-edit-held-refusal'

type Options = {
  /** A delete waits for one's own other tab too (decision 0036). */
  countsOwnOtherTab?: boolean
}

/**
 * Whose edit hold stops the acting author's write on the article now (design
 * 07g), for a refused transition's „Článek právě upravuje …“ (23g).
 *
 * @param id - The article.
 * @param authorId - The acting author; their own hold counts only with
 *   `countsOwnOtherTab`.
 * @param options - Whether one's own other tab counts.
 * @returns The refusal, or `null` when the article is free, the author's own
 *   or gone.
 */
export const findArticleHeldRefusal = async (
  id: string,
  authorId: string,
  { countsOwnOtherTab = false }: Options = {},
) => {
  const article = await prisma.article.findUnique({
    select: {
      heldByAuthor: { select: { name: true } },
      heldByAuthorId: true,
      heldByTabId: true,
      heldSince: true,
      heldUntil: true,
    },
    where: { id },
  })

  if (article === null) return null

  return getEditHeldRefusal(article, {
    authorId,
    countsOwnOtherTab,
    now: new Date(),
  })
}
