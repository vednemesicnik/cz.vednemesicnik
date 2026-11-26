import { useEffect, useRef } from 'react'
import { type Location, useLocation, useNavigationType } from 'react-router'

import { inputModalityStore } from '~/utils/input-modality/input-modality-store'
import { focusRecordLink } from '~/utils/navigation-trail/focus-record-link'
import { navigationTrailStore } from '~/utils/navigation-trail/navigation-trail-store'
import { recordNavigation } from '~/utils/navigation-trail/record-navigation'

/**
 * Keeps the tab's navigation trail (design 30i, n3wa2ld4): on every move to a
 * new history entry, it records the way there, which the links up read. After
 * a return up to a list, it puts the focus on the row the reader came back
 * from, with its ring only after the keyboard. Mounted once, at the root.
 */
export const useNavigationTrail = () => {
  const location = useLocation()
  const navigationType = useNavigationType()
  const previousRef = useRef<Location | null>(null)

  useEffect(() => {
    const previous = previousRef.current

    const expectedRedirect = navigationTrailStore.readExpectedRedirect()

    previousRef.current = location
    navigationTrailStore.setCurrentKey(location.key)

    if (previous === null || previous.key === location.key) return

    // The redirect a delete asked for lands with this navigation or not at all.
    navigationTrailStore.clearExpectedRedirect()

    const record = recordNavigation({
      expectedRedirect,
      navigationType,
      next: location,
      previous: {
        key: previous.key,
        pathname: previous.pathname,
        search: previous.search,
      },
      previousTrail: navigationTrailStore.get(previous.key)?.trail ?? [],
    })

    if (record === null) return

    navigationTrailStore.set(location.key, record)

    if (record.focusPath !== undefined) {
      focusRecordLink(record.focusPath, inputModalityStore.read())
    }
  }, [location, navigationType])

  // How the return was started decides whether its focus shows a ring (30i).
  useEffect(() => inputModalityStore.startTracking(), [])
}
