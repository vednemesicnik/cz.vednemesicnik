import { useEffect } from 'react'

import { startPageFlight } from '~/utils/page-flight/start-page-flight'

/**
 * Listens for clicks on links whose image may fly to the page they open
 * (design 18a–18c, u6r1pxsx). In the capture phase, so the flight is decided
 * before the router takes the click.
 */
export const usePageFlightClicks = () => {
  useEffect(() => {
    document.addEventListener('click', startPageFlight, { capture: true })

    return () => {
      document.removeEventListener('click', startPageFlight, { capture: true })
    }
  }, [])
}
