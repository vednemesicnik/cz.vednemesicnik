import { prisma } from '~/utils/db.server'
import { getEditHoldStatus } from '~/utils/edit-hold/get-edit-hold-status'

/**
 * Who else holds the article's edit hold now (design 07g), for a refused
 * transition's „Článek právě upravuje …“ (23g).
 *
 * @param id - The article.
 * @param authorId - The acting author; their own hold doesn't count.
 * @returns The holder's name, or `null` when the article is free, the author's
 *   own or gone.
 */
export const findArticleHeldByName = async (id: string, authorId: string) => {
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

  return getEditHoldStatus(article, { authorId, now: new Date() }) === 'other'
    ? (article.heldByAuthor?.name ?? null)
    : null
}
