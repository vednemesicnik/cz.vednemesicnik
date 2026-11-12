import { findEntryByAddress } from './find-entry-by-address'
import { isRedirectState } from './is-redirect-state'
import type { TrailEntry, TrailRecord } from './navigation-trail-entry'
import { readReturnTo } from './read-return-to'

/** How long a trail grows: the way list → detail → edit and a little more. */
const TRAIL_LENGTH = 5

type NextLocation = {
  pathname: string
  search: string
  state: unknown
}

type Options = {
  previous: TrailEntry
  previousTrail: TrailEntry[]
  next: NextLocation
  navigationType: 'POP' | 'PUSH' | 'REPLACE'
}

const findReturnIndex = (next: NextLocation, previousTrail: TrailEntry[]) => {
  const returnTo = readReturnTo(next.state)

  if (returnTo !== null) {
    return previousTrail.findIndex((entry) => entry.key === returnTo)
  }

  return isRedirectState(next.state)
    ? findEntryByAddress(previousTrail, next.pathname + next.search)
    : -1
}

/**
 * What a navigation leaves the new history entry (design 30i, n3wa2ld4).
 *
 * - Back and Forward leave nothing new: the entry keeps what it had.
 * - A return up to a remembered list leaves the trail that list had. It also
 *   leaves that list's key for its scroll position and the record's address
 *   for the focus. A return is a link up, or a redirect after a delete, that
 *   lands on an address of the trail.
 * - Another page of the same list (page, filters, sort) and a replace keep the
 *   trail.
 * - Any other navigation puts the page left at the head of the trail.
 *
 * @param options.previous - The entry left.
 * @param options.previousTrail - Its trail.
 * @param options.next - The new location, with its navigation state.
 * @param options.navigationType - How the router got there.
 * @returns The new entry's record, or `null` for Back and Forward.
 */
export const recordNavigation = ({
  previous,
  previousTrail,
  next,
  navigationType,
}: Options): TrailRecord | null => {
  if (navigationType === 'POP') return null

  const returnIndex = findReturnIndex(next, previousTrail)

  if (returnIndex !== -1) {
    const returnedTo = previousTrail[returnIndex]
    const left = returnIndex === 0 ? previous : previousTrail[returnIndex - 1]

    return {
      focusPath: left.pathname,
      returnKey: returnedTo.key,
      trail: previousTrail.slice(returnIndex + 1),
    }
  }

  if (navigationType === 'REPLACE' || next.pathname === previous.pathname) {
    return { trail: previousTrail }
  }

  return { trail: [previous, ...previousTrail].slice(0, TRAIL_LENGTH) }
}
