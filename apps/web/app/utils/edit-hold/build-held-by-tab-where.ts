import type { EditHoldTab } from './edit-hold-columns'

/**
 * The condition of a write only the holding tab may make: a save, a renewal or
 * a release. The expiry is not checked, so a hold that expired while nobody
 * else took it still belongs to its tab (design 24i).
 *
 * @param tab - The author and the tab.
 * @returns A `where` fragment for any content model with the hold columns.
 */
export const buildHeldByTabWhere = ({ authorId, tabId }: EditHoldTab) => ({
  heldByAuthorId: authorId,
  heldByTabId: tabId,
})
