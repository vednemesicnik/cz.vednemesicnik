import { isHalfVisibleBelow } from '~/utils/page-flight/is-half-visible-below'
import {
  type PageFlightKind,
  pageFlightStore,
} from '~/utils/page-flight/page-flight-store'
import { readLoadedImageSource } from '~/utils/read-loaded-image-source'

const kinds = new Set<string>([
  'article-row',
  'article-hero',
  'tile',
  'cover',
] satisfies PageFlightKind[])

const isPageFlightKind = (value: string | undefined): value is PageFlightKind =>
  value !== undefined && kinds.has(value)

/**
 * Starts the flight of a clicked link's image to its place on the new page
 * (design 18a–18d, u6r1pxsx), when the image may fly: the link is, or holds,
 * an element marked `data-page-flight` with the flight's name and
 * `data-page-flight-kind`; the browser has view transitions; motion isn't
 * reduced; the image has loaded; and at least half of it is in the window
 * below the header. Otherwise nothing flies and the page only cross-fades.
 *
 * Decided when the reader clicks, since loaded and visible are facts of that
 * moment. The marked element then gets `data-page-flight-flying`, which the
 * styles read while the transition captures it.
 *
 * @param event - A click anywhere on the page, as it reaches `document`.
 */
export const startPageFlight = (event: MouseEvent) => {
  if (event.defaultPrevented || event.button !== 0) return
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  if (!(event.target instanceof Element)) return

  const link = event.target.closest<HTMLAnchorElement>('a[href]')

  if (link === null) return

  const marked = link.matches('[data-page-flight]')
    ? link
    : link.querySelector<HTMLElement>('[data-page-flight]')

  if (marked === null) return

  const name = marked.dataset.pageFlight
  const kind = marked.dataset.pageFlightKind

  if (name === undefined || !isPageFlightKind(kind)) return
  if (!('startViewTransition' in document)) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const source = readLoadedImageSource(marked)
  const image = marked.querySelector('picture img')

  if (source === undefined || image === null) return

  // Where the header ends and the image stands is layout a click handler
  // has to read itself; CSS can't hand it a decision.
  const header = document.querySelector('[data-app-header]')
  const top = Math.max(0, header?.getBoundingClientRect().bottom ?? 0)
  const rect = image.getBoundingClientRect()

  if (!isHalfVisibleBelow({ bottom: window.innerHeight, rect, top })) return

  marked.dataset.pageFlightFlying = ''
  pageFlightStore.start({ kind, name, source })
}
