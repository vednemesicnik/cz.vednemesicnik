/**
 * The condition of a free edit hold (design 07g): nobody holds it, or its
 * expiry has passed. Time decides, because a crashed browser never releases it.
 *
 * @param now - The moment of the write.
 * @returns A `where` fragment for any content model with the hold columns.
 */
export const buildFreeHoldWhere = (now: Date) => ({
  OR: [
    { heldByAuthorId: null },
    { heldUntil: null },
    { heldUntil: { lte: now } },
  ],
})
