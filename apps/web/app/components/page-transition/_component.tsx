import { type ReactNode, ViewTransition } from 'react'
import { type NavigationType, useNavigationType } from 'react-router'

import { pageFlightStore } from '~/utils/page-flight/page-flight-store'
import { skipViewTransition } from '~/utils/view-transition/skip-view-transition'
import { skipViewTransitionOnInput } from '~/utils/view-transition/skip-view-transition-on-input'

type Props = {
  children: ReactNode
  /** The address the page stands for; a new one makes it a new page. */
  transitionKey: string
}

// Back and Forward change the page at once (18d): the router loads their data
// in a transition, so React starts one, and it is skipped before it shows.
// Otherwise input skips it (18d). Once it has run, the flight is over, so the
// page that is left never flies its image back.
const handlePageEnter = (navigationType: NavigationType) => {
  if (navigationType === 'POP') {
    skipViewTransition()
  }

  const stopSkipping = skipViewTransitionOnInput()

  return () => {
    stopSkipping()
    pageFlightStore.clear()
  }
}

/**
 * Cross-fades a navigation's old and new page in 200 ms, in place (design
 * 18d, u6r1pxsx). Keyed by the address, so the old page leaves and the new one
 * enters: each stays where it stands, while a boundary that updated would move
 * from the old page's scrolled box to the new one's. A change at the same
 * address, such as data reloaded after an action, doesn't animate, and Back
 * and Forward don't either.
 */
export const PageTransition = ({ children, transitionKey }: Props) => {
  // The type of the navigation that brought this page, read by the entering one.
  const navigationType = useNavigationType()

  return (
    <ViewTransition
      default={'none'}
      enter={'page'}
      exit={'page'}
      key={transitionKey}
      onEnter={() => handlePageEnter(navigationType)}
      update={'none'}
    >
      {children}
    </ViewTransition>
  )
}
