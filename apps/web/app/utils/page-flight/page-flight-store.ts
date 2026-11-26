/** What a flight's source looked like, so the new page can match it. */
export type PageFlightKind = 'article-row' | 'article-hero' | 'tile' | 'cover'

/** The image that flies from the clicked link to its place on the new page. */
export type PageFlight = {
  /** The view transition name both ends share, e.g. `article-image-<id>`. */
  name: string
  /** The source's shape, which sets the corners the flight starts from. */
  kind: PageFlightKind
  /** The file the link already shows, for the new page until its own loads. */
  source: string
}

type Listener = () => void

/**
 * Creates the store of the one flight that may be under way. A click on a
 * link starts it, the new page's image reads it while it renders, and the
 * page transition clears it once it has run (design 18a–18d, u6r1pxsx).
 * Only the page whose image the store names joins the flight, so a page that
 * is left again never flies its image back.
 */
export const createPageFlightStore = () => {
  let flight: PageFlight | null = null
  const listeners = new Set<Listener>()

  const notify = () => {
    for (const listener of listeners) listener()
  }

  return {
    clear: () => {
      if (flight === null) return

      flight = null
      notify()
    },
    read: () => flight,
    start: (nextFlight: PageFlight) => {
      flight = nextFlight
      notify()
    },
    subscribe: (listener: Listener) => {
      listeners.add(listener)

      return () => {
        listeners.delete(listener)
      }
    },
  }
}

/** The page's one flight store. */
export const pageFlightStore = createPageFlightStore()
