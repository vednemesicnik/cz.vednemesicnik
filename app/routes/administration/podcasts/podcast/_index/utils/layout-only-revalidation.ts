const createLayoutOnlyRevalidation = () => {
  let isRequested = false

  return {
    /**
     * Whether a revalidation was asked to leave the page out; the request is
     * used up either way.
     */
    consume: () => {
      const wasRequested = isRequested
      isRequested = false
      return wasRequested
    },
    /** Asks that the next revalidation leave the podcast's page out. */
    request: () => {
      isRequested = true
    },
  }
}

/**
 * A change of the podcast made elsewhere (22f, xkg6rdz4): its page's header
 * and episode rows follow through their live load of the rows on screen, so
 * the revalidation that carries the new title to the breadcrumb (the podcast
 * layout) leaves the page itself out, or its rows would move.
 */
export const layoutOnlyRevalidation = createLayoutOnlyRevalidation()
