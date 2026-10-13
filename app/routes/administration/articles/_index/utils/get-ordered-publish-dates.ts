const STEP_MS = 1000

/**
 * The publish dates of articles published in bulk, in the dialog's order
 * (design 22c, gbsczekj): the top one gets the base moment, each next one a
 * second earlier, so the website shows them in that order. A second, not a
 * minute: ten articles published five minutes after another one stay above it.
 *
 * @param base - The moment of confirmation, or the chosen day at that time.
 * @param count - How many articles are ordered.
 * @returns One date per article, top first.
 */
export const getOrderedPublishDates = (base: Date, count: number): Date[] =>
  Array.from(
    { length: count },
    (_, index) => new Date(base.getTime() - index * STEP_MS),
  )
