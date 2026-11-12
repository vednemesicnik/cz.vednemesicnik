import { isOnRecordPath } from './is-on-record-path'
import type { TrailEntry } from './navigation-trail-entry'

/**
 * Finds the list a link up returns to (design 30i, n3wa2ld4): the entry of
 * `targetPathname` in the current page's trail, when the way from it led
 * through pages above or below the current one only. The list → detail →
 * edit → detail way qualifies; a record reached from another record does
 * not, so its link up leads to the bare parent.
 *
 * @param trail - The current entry's trail, the latest first.
 * @param targetPathname - The address the link up leads to, `null` for the
 *   nearest page above the current one.
 * @param pathname - The current page's address.
 * @returns The remembered entry and its index in the trail, or `null`.
 */
export const findReturn = (
  trail: TrailEntry[],
  targetPathname: string | null,
  pathname: string,
): { entry: TrailEntry; index: number } | null => {
  for (const [index, entry] of trail.entries()) {
    const isSamePage = entry.pathname === pathname

    if (!isSamePage && !isOnRecordPath(entry.pathname, pathname)) return null

    const isTarget =
      targetPathname === null
        ? pathname.startsWith(`${entry.pathname}/`)
        : entry.pathname === targetPathname

    if (isTarget && !isSamePage) return { entry, index }
  }

  return null
}
