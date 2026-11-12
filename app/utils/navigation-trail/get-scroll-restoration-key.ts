import type { Location } from 'react-router'

import { findEntryByAddress } from './find-entry-by-address'
import { isRedirectState } from './is-redirect-state'
import {
  type NavigationTrailStore,
  navigationTrailStore,
} from './navigation-trail-store'
import { readReturnTo } from './read-return-to'

// Returns can follow returns: list → record → back → record → back. Each
// keeps its position under the first list's key, so the chain is followed to
// it. A chain of a trail's length at most; the bound only guards a loop.
const CHAIN_LIMIT = 10

const followReturns = (key: string, store: NavigationTrailStore) => {
  let resolved = key

  for (let step = 0; step < CHAIN_LIMIT; step++) {
    const next = store.get(resolved)?.returnKey

    if (next === undefined || next === resolved) break
    resolved = next
  }

  return resolved
}

/**
 * The key `<ScrollRestoration>` keeps a page's scroll position under. A return
 * up to a remembered list takes that list's key, so the list opens where it
 * was left (design 30i, n3wa2ld4). React Router restores a saved position on
 * any navigation, not only Back. Every other entry keeps its own key, so a new
 * visit starts at the top.
 *
 * - A link up names the list in its navigation state.
 * - An entry already recorded as a return has the key in its record.
 * - A redirect after a delete is matched to the trail of the entry it leaves,
 *   since the server's redirect carries no state.
 *
 * A list that was itself reached by a return keeps its position under the key
 * it returned to, so each key is followed back to the first one.
 *
 * @param location - The location to key.
 * @param store - The trail store; the tab's own by default.
 * @returns The scroll key.
 */
export const getScrollRestorationKey = (
  location: Location,
  store: NavigationTrailStore = navigationTrailStore,
) => {
  const returnTo = readReturnTo(location.state)

  if (returnTo !== null) return followReturns(returnTo, store)

  if (isRedirectState(location.state)) {
    const currentKey = store.readCurrentKey()
    const trail =
      currentKey === null ? [] : (store.get(currentKey)?.trail ?? [])
    const index = findEntryByAddress(trail, location.pathname + location.search)

    if (index !== -1) return followReturns(trail[index].key, store)
  }

  return followReturns(location.key, store)
}
