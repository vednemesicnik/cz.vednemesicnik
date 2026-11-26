import type { TrailEntry } from './navigation-trail-entry'

/**
 * Finds the entry of the trail with exactly this address, query included: the
 * list a server redirect lands on after a delete from its record (30i).
 *
 * @param trail - The trail of the entry being left, the latest first.
 * @param address - The new address, pathname and search.
 * @returns The index of the first entry with that address, or `-1`.
 */
export const findEntryByAddress = (trail: TrailEntry[], address: string) =>
  trail.findIndex((entry) => entry.pathname + entry.search === address)
