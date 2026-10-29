import type { BulkNoun } from '~/config/bulk-noun-config'
import { formatListCount } from '~/utils/format-list-count'

/**
 * The sentence a bulk confirmation adds when some selected records are being
 * edited by someone else, which the action skips (design 22f, copy 0farrwua).
 *
 * @param heldCount - How many selected records someone else holds.
 * @param noun - The list's bulk noun; the count is the sentence's object.
 * @returns „1 článek právě někdo upravuje. Přeskočí se.“, „1 epizodu …“,
 *   `2 články …`, `5 článků …`; `null` for none.
 */
export const formatHeldSkipNote = (heldCount: number, noun: BulkNoun) =>
  heldCount === 0
    ? null
    : `${formatListCount(heldCount, noun.objectForms)} právě někdo upravuje. Přeskočí se.`
