import { type ReactNode, ViewTransition } from 'react'

import { usePageFlight } from '~/hooks/use-page-flight'

type Props = {
  children: ReactNode
  /** The view transition name both ends share; none, and it never flies. */
  name: string | undefined
}

/**
 * One end of an image's flight between a list and the page it opens (design
 * 18a–18d, u6r1pxsx): the image in the clicked link, or its place on the new
 * page. Both ends keep their name, since React keeps track of a name by the
 * one a boundary mounted with, and join only while the clicked link's flight
 * names them: only then do they have a share class, which also carries the
 * source's corners. Two lists showing the same article, or a page and the list
 * it was opened from, never pair on their own. The ends never enter, leave or
 * change by themselves, so every other change of the page only cross-fades.
 */
export const PageFlight = ({ children, name }: Props) => {
  const flight = usePageFlight(name ?? '')

  return (
    <ViewTransition
      default={'none'}
      enter={'none'}
      exit={'none'}
      name={name}
      share={
        flight === null ? 'none' : `page-flight page-flight-${flight.kind}`
      }
      update={'none'}
    >
      {children}
    </ViewTransition>
  )
}
