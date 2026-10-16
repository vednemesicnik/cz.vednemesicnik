import { formatArticleCount } from '~/utils/format-article-count'

/**
 * The sentence a bulk confirmation adds when some selected articles are being
 * edited by someone else, which the action skips (design 22f).
 *
 * @param heldCount - How many selected articles someone else holds.
 * @returns „1 článek právě někdo upravuje. Přeskočí se.“, `2 články …`,
 *   `5 článků …`; `null` for none.
 */
export const formatHeldSkipNote = (heldCount: number) =>
  heldCount === 0
    ? null
    : `${formatArticleCount(heldCount)} právě někdo upravuje. Přeskočí se.`
