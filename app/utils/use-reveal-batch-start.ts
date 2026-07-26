import { useState } from 'react'

/**
 * Tracks which slice of a growing list is being shown for the first time.
 *
 * On the initial render that is the whole list; after a "load more" navigation
 * it is only the appended items, so the items already on screen are not
 * animated again.
 *
 * @param limit How many items the list is currently rendered with.
 * @returns Index of the first item of the batch being revealed.
 */
export const useRevealBatchStart = (limit: number) => {
  const [renderedLimit, setRenderedLimit] = useState(limit)
  const [batchStart, setBatchStart] = useState(0)

  // A non-finite limit (`?limit=abc`) never compares equal to itself, which
  // would set state on every render and never settle.
  if (Number.isFinite(limit) && renderedLimit !== limit) {
    setRenderedLimit(limit)
    setBatchStart(limit > renderedLimit ? renderedLimit : 0)
  }

  return batchStart
}
