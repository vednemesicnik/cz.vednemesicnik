type Window = {
  draftSkip: number
  draftTake: number
  restSkip: number
  restTake: number
}

/**
 * Splits a page of a date-ordered list with every draft on top (10d) into a
 * window over the drafts and one over the rest, so each is its own query and
 * the pages stay continuous.
 *
 * @param options.skip - The items before this page in the whole list.
 * @param options.take - The page size.
 * @param options.draftCount - How many drafts the whole list has.
 * @returns The `skip` and `take` for the drafts and for the rest.
 */
export const computeDraftsFirstWindow = ({
  skip,
  take,
  draftCount,
}: {
  skip: number
  take: number
  draftCount: number
}): Window => {
  const draftSkip = Math.min(skip, draftCount)
  const draftTake = Math.max(0, Math.min(take, draftCount - skip))

  return {
    draftSkip,
    draftTake,
    restSkip: Math.max(0, skip - draftCount),
    restTake: take - draftTake,
  }
}
