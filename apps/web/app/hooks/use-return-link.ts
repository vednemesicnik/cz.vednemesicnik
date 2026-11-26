import { useSyncExternalStore } from 'react'
import { useLocation } from 'react-router'

import { findReturn } from '~/utils/navigation-trail/find-return'
import type { ReturnState } from '~/utils/navigation-trail/navigation-trail-entry'
import { navigationTrailStore } from '~/utils/navigation-trail/navigation-trail-store'

// The server and the hydrating render know no trail, so both draw the bare
// address and agree; the remembered one follows once hydrated.
const readNothing = () => undefined

/**
 * Where a link up leads (design 30i, n3wa2ld4). Opened straight from the
 * parent's list in this tab, through pages above the current one only, it
 * leads back to that list as it was left: its page, filters, search and sort.
 * Its navigation state then names the list, so the list opens where it was
 * left. From anywhere else it leads to the bare parent.
 *
 * @param to - The parent's address.
 * @returns `href` for the link and its navigation `state`, `undefined` for the
 *   bare parent.
 */
export const useReturnLink = (
  to: string,
): { href: string; state: ReturnState | undefined } => {
  const { key, pathname } = useLocation()
  const record = useSyncExternalStore(
    navigationTrailStore.subscribe,
    () => navigationTrailStore.get(key),
    readNothing,
  )
  const found = findReturn(
    record?.trail ?? [],
    to.split('?')[0] ?? to,
    pathname,
  )

  if (found === null) return { href: to, state: undefined }

  return {
    href: found.entry.pathname + found.entry.search,
    state: { returnTo: found.entry.key },
  }
}
