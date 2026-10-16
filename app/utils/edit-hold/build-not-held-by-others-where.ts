import { buildFreeHoldWhere } from './build-free-hold-where'

/**
 * The condition every state transition repeats in its own write (decision
 * 0019): the content is not held by someone else. One's own hold, in any tab,
 * does not stop one's own actions (design 07g).
 *
 * @param authorId - The acting author.
 * @param now - The moment of the write.
 * @returns A `where` fragment for any content model with the hold columns.
 */
export const buildNotHeldByOthersWhere = (authorId: string, now: Date) => ({
  OR: [...buildFreeHoldWhere(now).OR, { heldByAuthorId: authorId }],
})
