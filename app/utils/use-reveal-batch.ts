import { useState } from 'react'

/**
 * Tracks which slice of a paginated list is being shown for the first time.
 *
 * On the initial render that is the whole list; after a "load more" navigation
 * it is only the appended items, so the items already on screen are not
 * animated again.
 *
 * @param limit Page size the list is currently rendered with.
 * @returns Index of the first item of the batch being revealed.
 */
export const useRevealBatchStart = (limit: number) => {
  const [renderedLimit, setRenderedLimit] = useState(limit)
  const [batchStart, setBatchStart] = useState(0)

  if (renderedLimit !== limit) {
    setRenderedLimit(limit)
    setBatchStart(limit > renderedLimit ? renderedLimit : 0)
  }

  return batchStart
}

/**
 * Picks the entry animation for one item of such a list.
 *
 * @param position Item index relative to the batch being revealed — negative
 * for items an earlier render already revealed.
 * @param staggerCount How many items of the batch to chain; the rest are left
 * to reveal on scroll, since they render below the fold.
 */
export const getRevealProps = (position: number, staggerCount: number) => {
  if (position < 0) return { reveal: 'none' as const }
  if (position >= staggerCount) return { reveal: 'scroll' as const }

  return { reveal: 'stagger' as const, staggerIndex: position }
}
