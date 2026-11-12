import { useSyncExternalStore } from 'react'

import { pageFlightStore } from '~/utils/page-flight/page-flight-store'

const readNothing = () => null

/**
 * The flight bound for this image, while one is under way (design 18a,
 * u6r1pxsx).
 *
 * @param name - The image's view transition name, e.g. `article-image-<id>`.
 * @returns The flight when it names this image, otherwise `null`.
 */
export const usePageFlight = (name: string) => {
  const flight = useSyncExternalStore(
    pageFlightStore.subscribe,
    pageFlightStore.read,
    readNothing,
  )

  return flight?.name === name ? flight : null
}
