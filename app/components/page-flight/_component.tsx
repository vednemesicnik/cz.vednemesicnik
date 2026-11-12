import { type ReactNode, ViewTransition } from 'react'

import type { PageFlightKind } from '~/utils/page-flight/page-flight-store'

type Props = {
  children: ReactNode
  /** The view transition name both ends share; none, and it never flies. */
  name: string | undefined
  /**
   * The source's shape, which picks the corners the flight starts from; none,
   * and this end declines to fly. The page's end gets one only while a flight
   * is bound for it: its name stays, since React keeps track of a name by the
   * one a boundary mounted with.
   */
  kind: PageFlightKind | undefined
}

/**
 * One end of an image's flight between a list and the page it opens (design
 * 18a–18d, u6r1pxsx): the image in the clicked link, or its place on the new
 * page. Its child flies only when the other end with the same name appears in
 * the same page transition and both have a kind. It never enters, leaves or
 * changes on its own, so every other change of the page only cross-fades.
 */
export const PageFlight = ({ children, name, kind }: Props) => {
  return (
    <ViewTransition
      default={'none'}
      enter={'none'}
      exit={'none'}
      name={name}
      share={kind === undefined ? 'none' : `page-flight page-flight-${kind}`}
      update={'none'}
    >
      {children}
    </ViewTransition>
  )
}
