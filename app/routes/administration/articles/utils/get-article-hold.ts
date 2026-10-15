import type { EditHoldColumns } from '~/utils/edit-hold/edit-hold-columns'
import { getEditHoldStatus } from '~/utils/edit-hold/get-edit-hold-status'

type HeldArticle = EditHoldColumns & {
  heldByAuthor: { name: string } | null
}

type Viewer = {
  authorId: string
  now: Date
}

/**
 * The article's edit hold as a list row or the detail shows it (design 22f,
 * 23g). An expired hold is none: the loaders read the expiry, no release needed.
 *
 * @param article - The hold columns and the holder's name.
 * @param viewer - The signed-in author and the moment of the load.
 * @returns `null` when nobody holds it; else the holder's name, since and
 *   until when, and whether it is the viewer's own (in another tab).
 */
export const getArticleHold = (article: HeldArticle, viewer: Viewer) => {
  const status = getEditHoldStatus(article, viewer)

  if (
    status === 'free' ||
    article.heldByAuthor === null ||
    article.heldSince === null ||
    article.heldUntil === null
  ) {
    return null
  }

  return {
    heldByName: article.heldByAuthor.name,
    heldSince: article.heldSince,
    heldUntil: article.heldUntil,
    isOwn: status !== 'other',
  }
}
