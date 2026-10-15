import type { EditHoldColumns } from './edit-hold-columns'

/** Who holds the content, as seen by one author (and one tab of theirs). */
export type EditHoldStatus = 'free' | 'own-tab' | 'own-other-tab' | 'other'

type Viewer = {
  authorId: string
  /** The viewer's tab; without one, an own hold is in another tab. */
  tabId?: string
  now: Date
}

/**
 * Reads the edit hold for one viewer (design 07g, 24g). A hold whose expiry has
 * passed is free, with no release.
 *
 * @param hold - The hold columns.
 * @param viewer - The author, their tab if known, and the current time.
 * @returns `free`, `own-tab`, `own-other-tab` (the same author elsewhere) or
 *   `other` (someone else).
 */
export const getEditHoldStatus = (
  hold: EditHoldColumns,
  { authorId, tabId, now }: Viewer,
): EditHoldStatus => {
  if (
    hold.heldByAuthorId === null ||
    hold.heldUntil === null ||
    hold.heldUntil <= now
  ) {
    return 'free'
  }

  if (hold.heldByAuthorId !== authorId) return 'other'

  return tabId !== undefined && hold.heldByTabId === tabId
    ? 'own-tab'
    : 'own-other-tab'
}
