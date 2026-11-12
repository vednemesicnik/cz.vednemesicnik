import { useSyncExternalStore } from 'react'
import { useLocation } from 'react-router'

import { findReturn } from '~/utils/navigation-trail/find-return'
import { navigationTrailStore } from '~/utils/navigation-trail/navigation-trail-store'

const readNothing = () => undefined

/**
 * The address of the nearest page above this one, as it was left, when this
 * page was reached from it in this tab through the record's own pages
 * (design 30i, n3wa2ld4): the list a record's page goes back to after a
 * delete, with its search, filters, sort and page.
 *
 * @returns The address with its query, or `undefined` from anywhere else.
 */
export const useParentReturnAddress = () => {
  const { key, pathname } = useLocation()
  const record = useSyncExternalStore(
    navigationTrailStore.subscribe,
    () => navigationTrailStore.get(key),
    readNothing,
  )
  const found = findReturn(record?.trail ?? [], null, pathname)

  return found === null ? undefined : found.entry.pathname + found.entry.search
}
